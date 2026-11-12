import { z } from "zod";
import { mobileSchema, nameSchema } from "./auth.schemas";
import { dateRangeSchema, pagingSchema } from "./list.schemas";
import { normalizeIndianMobile } from "./phone";

export const DONATION_PROGRAMMES = ["need", "education", "housing", "healthcare", "marriages", "relief"] as const;
export const DONATION_PRESETS_PAISE = [100_000, 250_000, 500_000, 1_000_000, 2_500_000] as const;
export const DONATION_STATUSES = ["created", "paid", "failed"] as const;

export type DonationProgramme = (typeof DONATION_PROGRAMMES)[number];
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const MIN_DONATION_PAISE = 100;
export const MAX_DONATION_PAISE = 10_000_000_00;

export function isDonationStatus(value: string): value is DonationStatus {
    return (DONATION_STATUSES as readonly string[]).includes(value);
}

export function isDonationProgramme(value: string): value is DonationProgramme {
    return (DONATION_PROGRAMMES as readonly string[]).includes(value);
}

export type DonationFormValues = {
    programme: DonationProgramme;
    amountPaise: number;
    custom: string;
    name: string;
    mobile: string;
    email: string;
};

const amountSchema = z.number().int().min(MIN_DONATION_PAISE, "amountInvalid").max(MAX_DONATION_PAISE, "amountInvalid");
const emailSchema = z.string().trim().max(254, "emailTooLong").pipe(z.email("emailInvalid"));

export const donationFormSchema: z.ZodType<DonationFormValues, DonationFormValues> = z.object({
    programme: z.enum(DONATION_PROGRAMMES),
    amountPaise: amountSchema,
    custom: z.string(),
    name: nameSchema,
    mobile: mobileSchema,
    email: emailSchema,
});

export const donationStartSchema = z.object({
    programme: z.enum(DONATION_PROGRAMMES),
    amountPaise: amountSchema,
    name: nameSchema,
    mobile: mobileSchema.transform((value) => normalizeIndianMobile(value)!),
    email: emailSchema,
});

const razorpayId = z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9_]+$/);

export const donationConfirmSchema = z.object({
    orderId: razorpayId,
    paymentId: razorpayId,
    signature: z.string().trim().regex(/^[a-f0-9]{64}$/),
});

export const donationFiltersSchema = z.object({
    search: z.string().trim().max(100).optional(),
    status: z.enum(DONATION_STATUSES).optional(),
    programme: z.enum(DONATION_PROGRAMMES).optional(),
    dates: dateRangeSchema.optional(),
});

export type DonationFilters = z.infer<typeof donationFiltersSchema>;

export const donationListInputSchema = pagingSchema.extend(donationFiltersSchema.shape);
