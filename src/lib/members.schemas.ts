import { z } from "zod";
import { MEMBER_STATUSES } from "./permissions";

export const memberIdInputSchema = z.object({
    userId: z.string().trim().min(1).max(100),
});

export const memberStatusSchema = z.enum(MEMBER_STATUSES);

export const setMemberStatusInputSchema = memberIdInputSchema.extend({
    status: memberStatusSchema,
});
