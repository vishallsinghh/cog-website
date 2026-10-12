import { z } from "zod";
import { MEMBER_STATUSES, STAFF_ROLES } from "./permissions";

export const PAGE_SIZES = [10, 20, 50] as const;

export const pagingSchema = z.object({
    page: z.number().int().min(1).max(10_000).default(1),
    pageSize: z
        .number()
        .int()
        .refine((value) => (PAGE_SIZES as readonly number[]).includes(value), "Unsupported page size")
        .default(20),
});

const dateOnly = z.iso.date();

export const dateRangeSchema = z.object({
    from: dateOnly.optional(),
    to: dateOnly.optional(),
});

export const memberListInputSchema = pagingSchema.extend({
    search: z.string().trim().max(100).optional(),
    status: z.enum(MEMBER_STATUSES).optional(),
    role: z.enum(["member", ...STAFF_ROLES]).optional(),
    joined: dateRangeSchema.optional(),
});

export const auditListInputSchema = pagingSchema.extend({
    action: z.string().trim().min(1).max(100).optional(),
    actorId: z.string().trim().min(1).max(100).optional(),
    dates: dateRangeSchema.optional(),
});

// Dates are calendar days in India. `from` is the start of that day and `to` is the
// start of the next day (exclusive), so the whole last day is included.
const IST = "+05:30";

export function dayRange(range: { from?: string; to?: string } | undefined) {
    const result: { gte?: Date; lt?: Date } = {};

    if (range?.from) result.gte = new Date(`${range.from}T00:00:00${IST}`);
    if (range?.to) {
        const end = new Date(`${range.to}T00:00:00${IST}`);
        end.setUTCDate(end.getUTCDate() + 1);
        result.lt = end;
    }

    return result.gte || result.lt ? result : undefined;
}
