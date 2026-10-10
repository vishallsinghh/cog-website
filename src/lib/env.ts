import { z } from "zod";
import { INDIAN_MOBILE } from "./phone";

function lazy<T>(parse: () => T) {
    let value: T | undefined;
    return () => (value ??= parse());
}

const required = z.string().min(1);

const dbSchema = z.object({
    CLOUDFLARE_ACCOUNT_ID: required,
    CLOUDFLARE_DATABASE_ID: required,
    CLOUDFLARE_D1_TOKEN: required,
});

const authSchema = z.object({
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
    GOOGLE_CLIENT_ID: required,
    GOOGLE_CLIENT_SECRET: required,
});

const redisSchema = z.object({
    UPSTASH_REDIS_REST_URL: z.url(),
    UPSTASH_REDIS_REST_TOKEN: required,
});

const smsSchema = z
    .object({
        NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
        MSG91_AUTH_KEY: z.string().optional(),
        MSG91_OTP_TEMPLATE_ID: z.string().optional(),
    })
    .superRefine((value, ctx) => {
        if (value.NODE_ENV !== "production") return;

        for (const key of ["MSG91_AUTH_KEY", "MSG91_OTP_TEMPLATE_ID"] as const) {
            if (!value[key]) {
                ctx.addIssue({
                    code: "custom",
                    path: [key],
                    message: `${key} is required in production`,
                });
            }
        }
    });

const aadhaarSchema = z.object({
    AADHAAR_ENCRYPTION_KEY: z
        .string()
        .refine((value) => Buffer.from(value, "base64").length === 32, "Must be 32 random bytes, base64 encoded"),
});

const seedSchema = z.object({
    SUPER_ADMIN_PHONE: z.string().regex(INDIAN_MOBILE, "Use the format +91XXXXXXXXXX"),
    SUPER_ADMIN_NAME: z.string().trim().min(2).max(100),
});

export const dbEnv = lazy(() => dbSchema.parse(process.env));
export const authEnv = lazy(() => authSchema.parse(process.env));
export const redisEnv = lazy(() => redisSchema.parse(process.env));
export const smsEnv = lazy(() => smsSchema.parse(process.env));
export const aadhaarEnv = lazy(() => aadhaarSchema.parse(process.env));
export const seedEnv = lazy(() => seedSchema.parse(process.env));
