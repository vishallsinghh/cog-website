import { z } from "zod";
import { INDIAN_MOBILE } from "./phone";

function lazy<T>(parse: () => T) {
    let value: T | undefined;
    return () => (value ??= parse());
}

const required = z.string().min(1);

const dbSchema = z.object({
    TURSO_DATABASE_URL: required,
    TURSO_AUTH_TOKEN: z.string().optional(),
});

const authSchema = z.object({
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    GOOGLE_CLIENT_ID: required,
    GOOGLE_CLIENT_SECRET: required,
});

const redisSchema = z.object({
    UPSTASH_REDIS_REST_URL: z.url(),
    UPSTASH_REDIS_REST_TOKEN: required,
});

const smsSchema = z.object({
    MSG91_AUTH_KEY: z.string().optional(),
    MSG91_OTP_TEMPLATE_ID: z.string().optional(),
    MSG91_APPLICATION_TEMPLATE_ID: z.string().optional(),
    MSG91_APPROVAL_TEMPLATE_ID: z.string().optional(),
    EXPOSE_OTP_TO_BROWSER: z
        .enum(["true", "false"])
        .optional()
        .transform((value) => value === "true"),
});

const aadhaarSchema = z.object({
    AADHAAR_ENCRYPTION_KEY: z
        .string()
        .refine((value) => Buffer.from(value, "base64").length === 32, "Must be 32 random bytes, base64 encoded"),
});

const storageSchema = z.object({
    R2_ACCOUNT_ID: required,
    R2_ACCESS_KEY_ID: required,
    R2_SECRET_ACCESS_KEY: required,
    R2_BUCKET: required,
});

const razorpaySchema = z.object({
    RAZORPAY_KEY_ID: z.string().regex(/^rzp_(test|live)_\w+$/, "Use the Key ID from the Razorpay dashboard"),
    RAZORPAY_KEY_SECRET: required,
    RAZORPAY_WEBHOOK_SECRET: required,
});

const sanityPublicSchema = z.object({
    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().regex(/^[a-z0-9-]+$/),
    NEXT_PUBLIC_SANITY_DATASET: z.string().regex(/^[a-z0-9_-]+$/),
});

const sanityPublicValues = () => ({
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
});

const sanityServerSchema = z.object({
    SANITY_REVALIDATE_SECRET: z.string().min(16).optional(),
    SANITY_API_READ_TOKEN: z.string().min(1).optional(),
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
export const storageEnv = lazy(() => storageSchema.parse(process.env));
export const razorpayEnv = lazy(() => razorpaySchema.parse(process.env));
export const razorpayConfigured = () => razorpaySchema.safeParse(process.env).success;
export const sanityPublicEnv = () => {
    const parsed = sanityPublicSchema.safeParse(sanityPublicValues());
    return parsed.success ? parsed.data : null;
};
export const sanityServerEnv = lazy(() => sanityServerSchema.parse(process.env));
export const seedEnv = lazy(() => seedSchema.parse(process.env));
