import { z } from "zod";
import { mobileSchema, nameSchema } from "./auth.schemas";

export const DONATION_PROGRAMMES = ["need", "education", "housing", "healthcare", "marriages", "relief"] as const;
export const DONATION_FREQUENCIES = ["once", "monthly"] as const;
export const DONATION_PRESETS_PAISE = [100_000, 250_000, 500_000, 1_000_000, 2_500_000] as const;

export const MIN_DONATION_PAISE = 100;
export const MAX_DONATION_PAISE = 10_000_000_00;

export type DonationFormValues = {
    frequency: (typeof DONATION_FREQUENCIES)[number];
    programme: (typeof DONATION_PROGRAMMES)[number];
    amountPaise: number;
    custom: string;
    name: string;
    mobile: string;
    email: string;
};

export const donationFormSchema: z.ZodType<DonationFormValues, DonationFormValues> = z.object({
    frequency: z.enum(DONATION_FREQUENCIES),
    programme: z.enum(DONATION_PROGRAMMES),
    amountPaise: z.number().int().min(MIN_DONATION_PAISE, "amountInvalid").max(MAX_DONATION_PAISE, "amountInvalid"),
    custom: z.string(),
    name: nameSchema,
    mobile: mobileSchema,
    email: z.string().trim().max(254, "emailTooLong").pipe(z.email("emailInvalid")),
});
