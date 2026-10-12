import { z } from "zod";
import { INDIAN_MOBILE } from "./phone";
import { mobileSchema } from "./auth.schemas";

// super_admin is deliberately absent: it can never be granted by invite or role change.
export const ASSIGNABLE_ROLES = ["admin", "editor", "viewer"] as const;

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const assignableRoleSchema = z.enum(ASSIGNABLE_ROLES);

export const INVITE_TTL_DAYS = 7;

export const inviteInputSchema = z.object({
    phoneNumber: z.string().regex(INDIAN_MOBILE, "Enter a valid Indian mobile number"),
    role: assignableRoleSchema,
});

export const inviteFormSchema = z.object({
    mobile: mobileSchema,
    role: assignableRoleSchema,
});

export type InviteFormValues = z.infer<typeof inviteFormSchema>;

export const changeRoleInputSchema = z.object({
    userId: z.string().min(1),
    role: assignableRoleSchema,
});

export const userIdInputSchema = z.object({ userId: z.string().min(1) });

export const inviteIdInputSchema = z.object({ inviteId: z.string().min(1) });
