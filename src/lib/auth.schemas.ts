import { z } from "zod";
import { isValidAadhaar } from "./aadhaar";
import { normalizeIndianMobile } from "./phone";

export const nameSchema = z
    .string()
    .trim()
    .min(2, "nameRequired")
    .max(100, "nameTooLong");

export const mobileSchema = z
    .string()
    .refine((value) => normalizeIndianMobile(value) !== null, "mobileInvalid");

export const aadhaarSchema = z
    .string()
    .refine((value) => isValidAadhaar(value), "aadhaarInvalid");

export const otpCodeSchema = z.string().regex(/^\d{6}$/, "otpInvalid");

export const signUpDetailsSchema = z.object({
    name: nameSchema,
    consent: z.literal(true),
    aadhaar: aadhaarSchema,
});

export type DetailsFormValues = {
    name: string;
    mobile: string;
    aadhaar: string;
    consent: boolean;
};

export function detailsFormSchema(mode: "signin" | "signup"): z.ZodType<DetailsFormValues, DetailsFormValues> {
    return z.object({
        name: mode === "signup" ? nameSchema : z.string(),
        mobile: mobileSchema,
        aadhaar: mode === "signup" ? aadhaarSchema : z.string(),
        consent:
            mode === "signup"
                ? z.boolean().refine((value) => value, "consentRequired")
                : z.boolean(),
    });
}

export const otpFormSchema = z.object({ code: otpCodeSchema });

export type OtpFormValues = z.infer<typeof otpFormSchema>;
