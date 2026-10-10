import { z } from "zod";
import { nameSchema } from "./auth.schemas";
import { INDIAN_STATES } from "./indian-states";

export const LANGUAGES = ["en", "gu"] as const;

export const LANGUAGE_LABELS: Record<(typeof LANGUAGES)[number], string> = {
    en: "English",
    gu: "ગુજરાતી",
};

const optionalText = (label: string, max: number) =>
    z.string().trim().max(max, `${label} is too long`);

export const profileFormSchema = z.object({
    name: nameSchema,
    preferredLanguage: z.enum(LANGUAGES),
    contactEmail: z
        .string()
        .trim()
        .max(120, "Email is too long")
        .refine((value) => value === "" || z.email().safeParse(value).success, "Enter a valid email address"),
    addressLine1: optionalText("Address", 120),
    addressLine2: optionalText("Address", 120),
    city: optionalText("City", 60),
    state: z.union([z.literal(""), z.enum(INDIAN_STATES)]),
    pincode: z
        .string()
        .trim()
        .refine((value) => value === "" || /^[1-9]\d{5}$/.test(value), "Enter a 6-digit pincode"),
    jamaat: optionalText("Jamaat", 100),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
