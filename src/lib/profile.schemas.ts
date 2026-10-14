import { z } from "zod";
import { nameSchema } from "./auth.schemas";
import { INDIAN_STATES } from "./indian-states";

export const LANGUAGES = ["en", "gu"] as const;

const optionalText = (message: string, max: number) => z.string().trim().max(max, message);

export const profileFormSchema = z.object({
    name: nameSchema,
    preferredLanguage: z.enum(LANGUAGES),
    contactEmail: z
        .string()
        .trim()
        .max(120, "emailTooLong")
        .refine((value) => value === "" || z.email().safeParse(value).success, "emailInvalid"),
    addressLine1: optionalText("addressTooLong", 120),
    addressLine2: optionalText("addressTooLong", 120),
    city: optionalText("cityTooLong", 60),
    state: z.union([z.literal(""), z.enum(INDIAN_STATES)]),
    pincode: z
        .string()
        .trim()
        .refine((value) => value === "" || /^[1-9]\d{5}$/.test(value), "pincodeInvalid"),
    jamaat: optionalText("jamaatTooLong", 100),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
