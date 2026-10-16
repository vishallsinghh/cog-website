import { TRPCError } from "@trpc/server";
import type { Prisma } from "@/generated/prisma/client";
import type { AppLocale } from "@/i18n/routing";
import { purgeFullAadhaar } from "@/lib/aadhaar.server";
import { hasPermission, type RequiredPermissions } from "@/lib/access";
import { getClientIp, maskPhone, writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { dayRange, memberListInputSchema } from "@/lib/list.schemas";
import { memberIdInputSchema, setMemberStatusInputSchema } from "@/lib/members.schemas";
import { STAFF_ROLES, type MemberStatus } from "@/lib/permissions";
import { createTRPCRouter, errorsFor, staffProcedure } from "../init";

const last4 = (phoneNumber: string | null | undefined) => (phoneNumber ?? "").slice(-4);

function isStaff(role: string | null | undefined) {
    return (role ?? "").split(",").some((value) => (STAFF_ROLES as readonly string[]).includes(value.trim()));
}

function permissionsForStatusChange(from: string, to: MemberStatus): RequiredPermissions {
    if (from === "approved" || to === "approved") return { member: ["approve"] };
    if (from === "rejected" || to === "rejected") return { member: ["reject"] };
    return { member: ["update"] };
}

async function findMember(userId: string, locale: AppLocale) {
    const target = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, status: true, phoneNumber: true },
    });

    if (!target) {
        const e = await errorsFor(locale);
        throw new TRPCError({ code: "NOT_FOUND", message: e("personNotFound") });
    }

    if (isStaff(target.role)) {
        const e = await errorsFor(locale);
        throw new TRPCError({ code: "BAD_REQUEST", message: e("staffNotMember") });
    }

    return target;
}

export const membersRouter = createTRPCRouter({
    list: staffProcedure({ member: ["read"] })
        .input(memberListInputSchema)
        .query(async ({ ctx, input }) => {
            const canSeePhone = hasPermission(ctx.auth.user.role, { member: ["readContact"] });
            const canDelete = hasPermission(ctx.auth.user.role, { member: ["reject"] });

            const and: Prisma.UserWhereInput[] = [];

            const search = input.search?.trim();
            if (search) {
                const or: Prisma.UserWhereInput[] = [
                    { name: { contains: search } },
                    { memberId: { contains: search } },
                ];

                // Phone search is off for roles that only see masked numbers, otherwise
                // a hit would confirm that a number belongs to a member.
                const digits = search.replace(/\D/g, "");
                if (canSeePhone && digits.length >= 3) {
                    or.push({ phoneNumber: { contains: digits } });
                }

                and.push({ OR: or });
            }

            if (input.status) and.push({ status: input.status });
            if (input.role) and.push(input.role === "member" ? { OR: [{ role: "member" }, { role: null }] } : { role: input.role });

            const joined = dayRange(input.joined);
            if (joined) and.push({ createdAt: joined });

            const where: Prisma.UserWhereInput = and.length > 0 ? { AND: and } : {};

            const [total, rows] = await Promise.all([
                db.user.count({ where }),
                db.user.findMany({
                    where,
                    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                    skip: (input.page - 1) * input.pageSize,
                    take: input.pageSize,
                    select: {
                        id: true,
                        name: true,
                        phoneNumber: true,
                        memberId: true,
                        status: true,
                        role: true,
                        createdAt: true,
                    },
                }),
            ]);

            return {
                total,
                page: input.page,
                pageSize: input.pageSize,
                canSearchPhone: canSeePhone,
                rows: rows.map((row) => ({
                    id: row.id,
                    name: row.name,
                    phone: canSeePhone ? (row.phoneNumber ?? "") : maskPhone(row.phoneNumber),
                    memberId: row.memberId,
                    status: row.status,
                    role: row.role ?? "member",
                    joinedAt: row.createdAt,
                    deletable: canDelete && !isStaff(row.role) && row.status !== "approved",
                })),
            };
        }),

    get: staffProcedure({ member: ["read"] })
        .input(memberIdInputSchema)
        .query(async ({ ctx, input }) => {
            const role = ctx.auth.user.role;
            const canSeeContact = hasPermission(role, { member: ["readContact"] });

            const user = await db.user.findUnique({
                where: { id: input.userId },
                select: {
                    id: true,
                    name: true,
                    phoneNumber: true,
                    memberId: true,
                    status: true,
                    role: true,
                    preferredLanguage: true,
                    consentAcceptedAt: true,
                    createdAt: true,
                    profile: {
                        select: {
                            addressLine1: true,
                            addressLine2: true,
                            city: true,
                            state: true,
                            pincode: true,
                            jamaat: true,
                            contactEmail: true,
                            aadhaarLast4: true,
                            aadhaarVerifiedAt: true,
                        },
                    },
                    accounts: { where: { providerId: "google" }, select: { id: true } },
                },
            });

            if (!user) {
                const e = await errorsFor(ctx.locale);
                throw new TRPCError({ code: "NOT_FOUND", message: e("personNotFound") });
            }

            const profile = user.profile;
            const staff = isStaff(user.role);

            return {
                id: user.id,
                name: user.name,
                phone: canSeeContact ? (user.phoneNumber ?? "") : maskPhone(user.phoneNumber),
                memberId: user.memberId,
                status: user.status,
                role: user.role ?? "member",
                preferredLanguage: user.preferredLanguage,
                consentAcceptedAt: user.consentAcceptedAt,
                joinedAt: user.createdAt,
                contactEmail: canSeeContact ? (profile?.contactEmail ?? null) : null,
                addressLine1: canSeeContact ? (profile?.addressLine1 ?? null) : null,
                addressLine2: canSeeContact ? (profile?.addressLine2 ?? null) : null,
                city: profile?.city ?? null,
                state: profile?.state ?? null,
                pincode: canSeeContact ? (profile?.pincode ?? null) : null,
                jamaat: profile?.jamaat ?? null,
                aadhaarLast4: profile?.aadhaarLast4 ?? null,
                aadhaarVerified: Boolean(profile?.aadhaarVerifiedAt),
                googleLinked: user.accounts.length > 0,
                canSeeContact,
                staff,
                canUpdate: !staff && hasPermission(role, { member: ["update"] }),
                canApprove: !staff && hasPermission(role, { member: ["approve"] }),
                canReject: !staff && hasPermission(role, { member: ["reject"] }),
            };
        }),

    setStatus: staffProcedure({ member: ["update"] })
        .input(setMemberStatusInputSchema)
        .mutation(async ({ ctx, input, path }) => {
            const target = await findMember(input.userId, ctx.locale);
            const required = permissionsForStatusChange(target.status, input.status);

            if (!hasPermission(ctx.auth.user.role, required)) {
                await writeAuditLog({
                    actorId: ctx.userId,
                    action: "access.denied",
                    entityType: "trpc",
                    entityId: path,
                    metadata: {
                        procedure: path,
                        type: "mutation",
                        required: JSON.stringify(required),
                        role: ctx.auth.user.role ?? null,
                    },
                    ipAddress: await getClientIp(),
                });

                const e = await errorsFor(ctx.locale);
                throw new TRPCError({ code: "FORBIDDEN", message: e("forbidden") });
            }

            const final = input.status === "approved" || input.status === "rejected";
            if (target.status === input.status && !final) return { ok: true as const };

            await db.user.update({ where: { id: target.id }, data: { status: input.status } });

            if (final) await purgeFullAadhaar(target.id);
            if (input.status === "rejected") await db.session.deleteMany({ where: { userId: target.id } });

            if (target.status !== input.status) {
                await writeAuditLog({
                    actorId: ctx.userId,
                    action: "member.status.changed",
                    entityType: "user",
                    entityId: target.id,
                    metadata: { from: target.status, to: input.status },
                    ipAddress: await getClientIp(),
                });
            }

            return { ok: true as const };
        }),

    delete: staffProcedure({ member: ["reject"] })
        .input(memberIdInputSchema)
        .mutation(async ({ ctx, input }) => {
            const target = await findMember(input.userId, ctx.locale);

            if (target.status === "approved") {
                const e = await errorsFor(ctx.locale);
                throw new TRPCError({ code: "BAD_REQUEST", message: e("approvedNotDeletable") });
            }

            await db.user.deleteMany({ where: { id: target.id } });

            await writeAuditLog({
                actorId: ctx.userId,
                action: "member.request.deleted",
                entityType: "user",
                entityId: target.id,
                metadata: { status: target.status, phoneLast4: last4(target.phoneNumber) },
                ipAddress: await getClientIp(),
            });

            return { ok: true as const };
        }),
});
