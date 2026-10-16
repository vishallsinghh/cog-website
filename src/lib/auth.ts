import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getIP, isAPIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins/admin";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";
import { z } from "zod";
import { storeAadhaarForUser } from "./aadhaar.server";
import { writeAuditLog } from "./audit";
import { signUpDetailsSchema } from "./auth.schemas";
import { db } from "./db";
import { authEnv } from "./env";
import { ac, roles } from "./permissions";
import { isIndianMobile, tempEmailForPhone } from "./phone";
import {
    OTP_ALLOWED_ATTEMPTS,
    assertCanSendOtp,
    assertNumberNotLocked,
    clearWrongOtpAttempts,
    recordWrongOtpAttempt,
    upstashRateLimitStorage,
} from "./rate-limit";
import { sendOtpSms } from "./sms";
import { findOpenInvite, markInviteAccepted } from "./staff-invite";
import { ASSIGNABLE_ROLES } from "./team.schemas";

const env = authEnv();

const phoneBodySchema = z.object({ phoneNumber: z.string() });

const verifyBodySchema = z.object({
    phoneNumber: z.string(),
    updatePhoneNumber: z.boolean().optional(),
});

type InviteRole = (typeof ASSIGNABLE_ROLES)[number];

function isInviteRole(role: string): role is InviteRole {
    return (ASSIGNABLE_ROLES as readonly string[]).includes(role);
}

/**
 * Records an invite as accepted once its role has actually been applied to the user.
 * Safe to run twice: only the call that flips acceptedAt writes the audit row. If the
 * role was not applied (for example a rejected account), the invite stays open.
 */
async function acceptInviteFor(
    user: { id: string; phoneNumber?: string | null; role?: string | null; status?: string | null },
    ipAddress: string | null,
) {
    if (!user.phoneNumber || user.status !== "approved") return;

    const invite = await findOpenInvite(user.phoneNumber);
    if (!invite || user.role !== invite.role) return;

    if (!(await markInviteAccepted(invite.id))) return;

    await writeAuditLog({
        actorId: user.id,
        action: "staff.invite.accepted",
        entityType: "staff_invite",
        entityId: invite.id,
        metadata: { role: invite.role, invitedById: invite.invitedById },
        ipAddress,
    });
}

export const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: prismaAdapter(db, {
        provider: "sqlite",
    }),
    trustedOrigins: [env.BETTER_AUTH_URL],
    disabledPaths: [
        "/sign-in/phone-number",
        "/phone-number/request-password-reset",
        "/phone-number/reset-password",
    ],
    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            disableSignUp: true,
        },
    },
    account: {
        accountLinking: {
            enabled: true,
            allowDifferentEmails: true,
            allowUnlinkingAll: true,
            trustedProviders: [],
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 30,
        updateAge: 60 * 60 * 24,
        cookieCache: {
            enabled: true,
            maxAge: 60,
        },
    },
    rateLimit: {
        enabled: true,
        window: 60,
        max: 100,
        customStorage: upstashRateLimitStorage,
    },
    advanced: {
        database: {
            generateId: false,
        },
        backgroundTasks: {
            handler: (promise) => after(promise),
        },
    },
    user: {
        additionalFields: {
            status: {
                type: "string",
                defaultValue: "pending",
                input: false,
                required: true,
            },
            memberId: {
                type: "string",
                required: false,
                unique: true,
                input: false,
            },
            preferredLanguage: {
                type: "string",
                defaultValue: "en",
                required: true,
                input: true,
            },
            consentAcceptedAt: {
                type: "date",
                required: false,
                input: false,
            },
        },
    },
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            const body = phoneBodySchema.safeParse(ctx.body);
            if (!body.success) return;

            if (ctx.path === "/phone-number/send-otp") {
                const ip = ctx.request ? getIP(ctx.request, ctx.context.options) : null;
                await assertCanSendOtp(body.data.phoneNumber, ip);
            }

            if (ctx.path === "/phone-number/verify") {
                await assertNumberNotLocked(body.data.phoneNumber);
            }
        }),
        after: createAuthMiddleware(async (ctx) => {
            if (ctx.path !== "/phone-number/verify") return;

            const parsed = phoneBodySchema.safeParse(ctx.body);
            if (!parsed.success) return;

            const returned = ctx.context.returned;

            if (isAPIError(returned)) {
                const code = (returned.body as { code?: string } | undefined)?.code;
                if (code === "INVALID_OTP") {
                    await recordWrongOtpAttempt(parsed.data.phoneNumber);
                }
                return;
            }

            await clearWrongOtpAttempts(parsed.data.phoneNumber);
        }),
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user, ctx) => {
                    if (ctx?.path !== "/phone-number/verify") return;

                    const details = signUpDetailsSchema.safeParse(ctx.body);

                    if (!details.success) {
                        throw APIError.from("BAD_REQUEST", {
                            code: "SIGNUP_DETAILS_REQUIRED",
                            message:
                                "No account exists for this number. Sign up with your name and accept the consent to continue.",
                        });
                    }

                    // An open staff invite for this number makes the new account staff and
                    // approved straight away. Without one the account starts pending.
                    const invite =
                        typeof user.phoneNumber === "string" ? await findOpenInvite(user.phoneNumber) : null;
                    const invitedRole = invite && isInviteRole(invite.role) ? invite.role : null;

                    return {
                        data: {
                            ...user,
                            name: details.data.name,
                            status: invitedRole ? "approved" : "pending",
                            ...(invitedRole ? { role: invitedRole } : {}),
                            consentAcceptedAt: new Date(),
                        },
                    };
                },
                after: async (user, ctx) => {
                    if (ctx?.path !== "/phone-number/verify") return;

                    const details = signUpDetailsSchema.safeParse(ctx.body);
                    if (!details.success) return;

                    await storeAadhaarForUser(user.id, details.data.aadhaar);

                    const ip = ctx.request ? getIP(ctx.request, ctx.context.options) : null;
                    await acceptInviteFor(user as Parameters<typeof acceptInviteFor>[0], ip);
                },
            },
            update: {
                // Runs after the OTP is verified and before the session is created, so the
                // session already carries the new role. It receives only the changed fields
                // ({ phoneNumberVerified: true }), so the user is found by the verified number.
                before: async (data, ctx) => {
                    if (ctx?.path !== "/phone-number/verify") return;

                    const body = verifyBodySchema.safeParse(ctx.body);
                    if (!body.success) return;

                    // Changing a logged-in user's own number goes through this path too.
                    // It must never grant a role.
                    if (body.data.updatePhoneNumber || "phoneNumber" in data) return;

                    const invite = await findOpenInvite(body.data.phoneNumber);
                    if (!invite || !isInviteRole(invite.role)) return;

                    const existing = await db.user.findUnique({
                        where: { phoneNumber: body.data.phoneNumber },
                        select: { role: true, status: true },
                    });
                    if (!existing) return;

                    // A rejected account stays rejected: an invite never overrides a rejection.
                    if (existing.status === "rejected") return;

                    // An invite never touches a Super Admin.
                    if ((existing.role ?? "").split(",").some((value) => value.trim() === "super_admin")) {
                        return;
                    }

                    return { data: { ...data, role: invite.role, status: "approved" } };
                },
                after: async (user, ctx) => {
                    if (ctx?.path !== "/phone-number/verify") return;

                    const body = verifyBodySchema.safeParse(ctx.body);
                    if (!body.success || body.data.updatePhoneNumber) return;

                    const ip = ctx.request ? getIP(ctx.request, ctx.context.options) : null;
                    await acceptInviteFor(user as Parameters<typeof acceptInviteFor>[0], ip);
                },
            },
        },
        session: {
            create: {
                before: async (session, ctx) => {
                    const record = await ctx?.context.internalAdapter.findUserById(session.userId);
                    const status = (record as { status?: string } | null | undefined)?.status;

                    if (status !== "rejected") return;

                    throw APIError.from("FORBIDDEN", {
                        code: "ACCOUNT_REJECTED",
                        message: "Your membership request was not approved. Please contact COG.",
                    });
                },
            },
        },
    },
    plugins: [
        phoneNumber({
            expiresIn: 300,
            otpLength: 6,
            allowedAttempts: OTP_ALLOWED_ATTEMPTS,
            phoneNumberValidator: isIndianMobile,
            sendOTP: async ({ phoneNumber: number, code }) => {
                await sendOtpSms(number, code);
            },
            signUpOnVerification: {
                getTempEmail: tempEmailForPhone,
                getTempName: (number) => number,
            },
        }),
        admin({
            ac,
            roles,
            defaultRole: "member",
            adminRoles: ["super_admin", "admin"],
            bannedUserMessage:
                "Your account has been suspended. Please contact an administrator for assistance.",
        }),
        nextCookies(),
    ],
});

export type Session = typeof auth.$Infer.Session;

export type AppUser = typeof auth.$Infer.Session.user;
