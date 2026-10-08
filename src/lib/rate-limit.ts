import { Ratelimit } from "@upstash/ratelimit";
import type { BetterAuthRateLimitStorage } from "@better-auth/core";
import { APIError } from "better-auth/api";
import { redis } from "./redis";

const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_SENDS_PER_WINDOW = 3;
const OTP_SEND_WINDOW = "15 m";
const OTP_MAX_WRONG_ATTEMPTS = 5;
const OTP_FAILURE_WINDOW_SECONDS = 15 * 60;
const OTP_LOCK_SECONDS = 30 * 60;

const limiters = new Map<string, Ratelimit>();

function limiterFor(window: number, max: number) {
    const id = `${max}:${window}`;
    let limiter = limiters.get(id);

    if (!limiter) {
        limiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(max, `${window} s`),
            prefix: `cog:auth:rl:${id}`,
        });
        limiters.set(id, limiter);
    }

    return limiter;
}

export const upstashRateLimitStorage: BetterAuthRateLimitStorage = {
    async consume(key, rule) {
        const result = await limiterFor(rule.window, rule.max).limit(key);

        if (result.success) {
            return { allowed: true, retryAfter: null };
        }

        return {
            allowed: false,
            retryAfter: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
        };
    },
};

const otpSendLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(OTP_SENDS_PER_WINDOW, OTP_SEND_WINDOW),
    prefix: "cog:otp:send",
});

const otpIpLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "15 m"),
    prefix: "cog:otp:send-ip",
});

function tooManyRequests(code: string, message: string, retryAfterSeconds: number) {
    return APIError.from("TOO_MANY_REQUESTS", {
        code,
        message: `${message} Try again in ${retryAfterSeconds} seconds.`,
    });
}

export async function assertNumberNotLocked(phoneNumber: string) {
    const ttl = await redis.ttl(`cog:otp:lock:${phoneNumber}`);

    if (ttl > 0) {
        throw tooManyRequests(
            "OTP_NUMBER_LOCKED",
            "Too many wrong attempts for this number.",
            ttl,
        );
    }
}

export async function assertCanSendOtp(phoneNumber: string, ip: string | null) {
    await assertNumberNotLocked(phoneNumber);

    const acquired = await redis.set(`cog:otp:cooldown:${phoneNumber}`, "1", {
        nx: true,
        ex: OTP_RESEND_COOLDOWN_SECONDS,
    });

    if (!acquired) {
        const ttl = await redis.ttl(`cog:otp:cooldown:${phoneNumber}`);
        throw tooManyRequests(
            "OTP_RESEND_COOLDOWN",
            "Please wait before requesting another code.",
            Math.max(ttl, 1),
        );
    }

    const perNumber = await otpSendLimiter.limit(phoneNumber);

    if (!perNumber.success) {
        throw tooManyRequests(
            "OTP_SEND_LIMIT",
            "Too many codes requested for this number.",
            Math.max(1, Math.ceil((perNumber.reset - Date.now()) / 1000)),
        );
    }

    if (ip) {
        const perIp = await otpIpLimiter.limit(ip);

        if (!perIp.success) {
            throw tooManyRequests(
                "OTP_IP_LIMIT",
                "Too many codes requested from this network.",
                Math.max(1, Math.ceil((perIp.reset - Date.now()) / 1000)),
            );
        }
    }
}

export async function recordWrongOtpAttempt(phoneNumber: string) {
    const key = `cog:otp:fail:${phoneNumber}`;
    const failures = await redis.incr(key);

    if (failures === 1) {
        await redis.expire(key, OTP_FAILURE_WINDOW_SECONDS);
    }

    if (failures >= OTP_MAX_WRONG_ATTEMPTS) {
        await redis.set(`cog:otp:lock:${phoneNumber}`, "1", { ex: OTP_LOCK_SECONDS });
        await redis.del(key);
    }
}

export async function clearWrongOtpAttempts(phoneNumber: string) {
    await redis.del(`cog:otp:fail:${phoneNumber}`);
}

export const OTP_ALLOWED_ATTEMPTS = OTP_MAX_WRONG_ATTEMPTS;
