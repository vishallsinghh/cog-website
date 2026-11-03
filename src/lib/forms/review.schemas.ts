import { z } from "zod";
import { dateRangeSchema, pagingSchema } from "@/lib/list.schemas";
import { FORM_ACCESS_LEVELS, REVIEW_STATUSES, STAFF_TARGET_STATUSES, statusNeedsMessage } from "./application-status";

const idSchema = z.string().trim().min(1).max(100);

export const MAX_REVIEW_MESSAGE = 1000;
export const MAX_NOTE_LENGTH = 2000;

export const reviewFormIdSchema = z.object({ formId: idSchema });

export const reviewFiltersSchema = z.object({
    formId: idSchema,
    search: z.string().trim().max(100).optional(),
    status: z.enum(REVIEW_STATUSES).optional(),
    jamaat: z.string().trim().min(1).max(200).optional(),
    city: z.string().trim().min(1).max(200).optional(),
    submitted: dateRangeSchema.optional(),
});

export type ReviewFilters = z.infer<typeof reviewFiltersSchema>;

export const reviewListInputSchema = pagingSchema.extend(reviewFiltersSchema.shape);

export const reviewApplicationIdSchema = z.object({ id: idSchema });

const statusChangeFields = z.object({
    status: z.enum(STAFF_TARGET_STATUSES, { error: "statusRequired" }),
    message: z.string().trim().max(MAX_REVIEW_MESSAGE, "answerTooLong").optional(),
});

function requireMessage(value: z.infer<typeof statusChangeFields>, ctx: z.RefinementCtx) {
    if (statusNeedsMessage(value.status) && !value.message) {
        ctx.addIssue({ code: "custom", path: ["message"], message: "reviewMessageRequired" });
    }
}

export const statusChangeFormSchema = statusChangeFields.superRefine(requireMessage);

export const setApplicationStatusSchema = statusChangeFields.extend({ id: idSchema }).superRefine(requireMessage);

export const noteFormSchema = z.object({
    body: z.string().trim().min(1, "noteRequired").max(MAX_NOTE_LENGTH, "answerTooLong"),
});

export const addNoteSchema = noteFormSchema.extend({ id: idSchema });

export const grantFormSchema = z.object({
    userId: z.string().trim().min(1, "personRequired").max(100),
    level: z.enum(FORM_ACCESS_LEVELS),
});

export const grantFormAccessSchema = grantFormSchema.extend({ formId: idSchema });

export const revokeFormAccessSchema = z.object({ formId: idSchema, userId: idSchema });
