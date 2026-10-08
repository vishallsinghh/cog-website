import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getIP, isAPIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins/admin";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";
import { z } from "zod";
import { db } from "./db";
import { env } from "./env";
import { ac, roles } from "./permissions";
import { isIndianMobile, tempEmailForPhone } from "./phone";
import {
    OTP_ALLOWED_ATTEMPTS,
    assertCanSendOtp,
    assertNumberNotLocked,
    clearWrongOtpAttempts,
    recordWrongOtpAttempt,
    upstashRateLimitStorage,
} from "./rate-limit";
import { sendOtpSms } from "./sms";

const signUpDetailsSchema = z.object({
    name: z.string().trim().min(2).max(100),
    consent: z.literal(true),
});

const phoneBodySchema = z.object({ phoneNumber: z.string() });

export const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: prismaAdapter(db, {
        provider: "sqlite",
    }),
    trustedOrigins: [env.BETTER_AUTH_URL],
    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            disableSignUp: true,
        },
    },
    account: {
        accountLinking: {
            enabled: true,
            allowDifferentEmails: true,
            trustedProviders: [],
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 30,
        updateAge: 60 * 60 * 24,
        cookieCache: {
            enabled: true,
            maxAge: 60,
        },
    },
    rateLimit: {
        enabled: true,
        window: 60,
        max: 100,
        customStorage: upstashRateLimitStorage,
    },
    advanced: {
        database: {
            generateId: false,
        },
        backgroundTasks: {
            handler: (promise) => after(promise),
        },
    },
    user: {
        additionalFields: {
            status: {
                type: "string",
                defaultValue: "pending",
                input: false,
                required: true,
            },
            memberId: {
                type: "string",
                required: false,
                unique: true,
                input: false,
            },
            preferredLanguage: {
                type: "string",
                defaultValue: "en",
                required: true,
                input: true,
            },
            consentAcceptedAt: {
                type: "date",
                required: false,
                input: false,
            },
        },
    },
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path === "/phone-number/send-otp") {
                const { phoneNumber: number } = phoneBodySchema.parse(ctx.body);
                await assertCanSendOtp(number, getIP(ctx.request ?? new Request("http://localhost"), ctx.context.options));
            }

            if (ctx.path === "/phone-number/verify") {
                const { phoneNumber: number } = phoneBodySchema.parse(ctx.body);
                await assertNumberNotLocked(number);
            }
        }),
        after: createAuthMiddleware(async (ctx) => {
            if (ctx.path !== "/phone-number/verify") return;

            const parsed = phoneBodySchema.safeParse(ctx.body);
            if (!parsed.success) return;

            const returned = ctx.context.returned;

            if (isAPIError(returned)) {
                const code = (returned.body as { code?: string } | undefined)?.code;
                if (code === "INVALID_OTP") {
                    await recordWrongOtpAttempt(parsed.data.phoneNumber);
                }
                return;
            }

            await clearWrongOtpAttempts(parsed.data.phoneNumber);
        }),
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user, ctx) => {
                    if (ctx?.path !== "/phone-number/verify") return;

                    const details = signUpDetailsSchema.safeParse(ctx.body);

                    if (!details.success) {
                        throw APIError.from("BAD_REQUEST", {
                            code: "SIGNUP_DETAILS_REQUIRED",
                            message:
                                "No account exists for this number. Sign up with your name and accept the consent to continue.",
                        });
                    }

                    return {
                        data: {
                            ...user,
                            name: details.data.name,
                            status: "pending",
                            consentAcceptedAt: new Date(),
                        },
                    };
                },
            },
        },
        session: {
            create: {
                before: async (session, ctx) => {
                    const record = await ctx?.context.internalAdapter.findUserById(session.userId);
                    const status = (record as { status?: string } | null | undefined)?.status;

                    if (status === "approved") return;

                    if (status === "rejected") {
                        throw APIError.from("FORBIDDEN", {
                            code: "ACCOUNT_REJECTED",
                            message: "Your membership request was not approved. Please contact COG.",
                        });
                    }

                    throw APIError.from("FORBIDDEN", {
                        code: "ACCOUNT_PENDING_APPROVAL",
                        message: "Your account is awaiting approval. You will be able to log in once COG approves it.",
                    });
                },
            },
        },
    },
    plugins: [
        phoneNumber({
            expiresIn: 300,
            otpLength: 6,
            allowedAttempts: OTP_ALLOWED_ATTEMPTS,
            phoneNumberValidator: isIndianMobile,
            sendOTP: async ({ phoneNumber: number, code }) => {
                await sendOtpSms(number, code);
            },
            signUpOnVerification: {
                getTempEmail: tempEmailForPhone,
                getTempName: (number) => number,
            },
        }),
        admin({
            ac,
            roles,
            defaultRole: "member",
            adminRoles: ["super_admin", "admin"],
            bannedUserMessage:
                "Your account has been suspended. Please contact an administrator for assistance.",
        }),
        nextCookies(),
    ],
});

export type Session = typeof auth.$Infer.Session;

export type AppUser = typeof auth.$Infer.Session.user;
