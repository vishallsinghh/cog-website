import { headers } from "next/headers";
import { TRPCError } from "@trpc/server";
import { getClientIp, writeAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { STAFF_ROLES } from "@/lib/permissions";
import { closeOpenInvites } from "@/lib/staff-invite";
import {
    INVITE_TTL_DAYS,
    changeRoleInputSchema,
    inviteIdInputSchema,
    inviteInputSchema,
    userIdInputSchema,
} from "@/lib/team.schemas";
import { createTRPCRouter, superAdminProcedure } from "../init";

const last4 = (phoneNumber: string | null | undefined) => (phoneNumber ?? "").slice(-4);

function hasRole(role: string | null | undefined, wanted: string) {
    return (role ?? "").split(",").some((value) => value.trim() === wanted);
}

async function assertNotLastSuperAdmin(target: { id: string; role: string | null }) {
    if (!hasRole(target.role, "super_admin")) return;

    const others = await db.user.count({
        where: { id: { not: target.id }, role: { contains: "super_admin" }, banned: { not: true } },
    });

    if (others === 0) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This is the only Super Admin, so their role cannot be changed or removed.",
        });
    }
}

async function findStaff(userId: string) {
    const target = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, phoneNumber: true },
    });

    if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "That person was not found." });

    const isStaff = (STAFF_ROLES as readonly string[]).some((role) => hasRole(target.role, role));
    if (!isStaff) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "That person is not on the team." });
    }

    return target;
}

export const teamRouter = createTRPCRouter({
    overview: superAdminProcedure.query(async () => {
        const [staff, invites] = await Promise.all([
            db.user.findMany({
                where: { role: { in: [...STAFF_ROLES] } },
                orderBy: [{ createdAt: "asc" }, { id: "asc" }],
                select: { id: true, name: true, phoneNumber: true, role: true, createdAt: true },
            }),
            db.staffInvite.findMany({
                where: { acceptedAt: null },
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                include: { invitedBy: { select: { name: true } } },
            }),
        ]);

        const now = Date.now();

        return {
            staff: staff.map((person) => ({
                id: person.id,
                name: person.name,
                phoneNumber: person.phoneNumber,
                role: person.role ?? "member",
                joinedAt: person.createdAt,
            })),
            invites: invites.map((invite) => ({
                id: invite.id,
                phoneNumber: invite.phoneNumber,
                role: invite.role,
                invitedByName: invite.invitedBy.name,
                createdAt: invite.createdAt,
                expiresAt: invite.expiresAt,
                expired: invite.expiresAt.getTime() <= now,
            })),
        };
    }),

    invite: superAdminProcedure.input(inviteInputSchema).mutation(async ({ ctx, input }) => {
        const existing = await db.user.findUnique({
            where: { phoneNumber: input.phoneNumber },
            select: { role: true },
        });

        if (hasRole(existing?.role, "super_admin")) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "That number belongs to a Super Admin." });
        }

        // One open invite per number: a new invite replaces the old one.
        await closeOpenInvites(input.phoneNumber);

        const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
        const invite = await db.staffInvite.create({
            data: {
                phoneNumber: input.phoneNumber,
                role: input.role,
                invitedById: ctx.userId,
                expiresAt,
            },
        });

        await writeAuditLog({
            actorId: ctx.userId,
            action: "staff.invite.created",
            entityType: "staff_invite",
            entityId: invite.id,
            metadata: {
                role: input.role,
                phoneLast4: last4(input.phoneNumber),
                existingUser: Boolean(existing),
            },
            ipAddress: await getClientIp(),
        });

        return { id: invite.id, expiresAt };
    }),

    revokeInvite: superAdminProcedure.input(inviteIdInputSchema).mutation(async ({ ctx, input }) => {
        const invite = await db.staffInvite.findFirst({ where: { id: input.inviteId, acceptedAt: null } });

        if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "That invite no longer exists." });

        await db.staffInvite.deleteMany({ where: { id: invite.id, acceptedAt: null } });

        await writeAuditLog({
            actorId: ctx.userId,
            action: "staff.invite.revoked",
            entityType: "staff_invite",
            entityId: invite.id,
            metadata: { role: invite.role, phoneLast4: last4(invite.phoneNumber) },
            ipAddress: await getClientIp(),
        });

        return { ok: true as const };
    }),

    changeRole: superAdminProcedure.input(changeRoleInputSchema).mutation(async ({ ctx, input }) => {
        const target = await findStaff(input.userId);

        if ((target.role ?? "") === input.role) return { ok: true as const };

        await assertNotLastSuperAdmin(target);

        // Close any open invite first so it cannot grant the old role again later.
        await closeOpenInvites(target.phoneNumber);

        await auth.api.setRole({
            body: { userId: target.id, role: input.role },
            headers: await headers(),
        });

        await writeAuditLog({
            actorId: ctx.userId,
            action: "staff.role.changed",
            entityType: "user",
            entityId: target.id,
            metadata: { from: target.role, to: input.role },
            ipAddress: await getClientIp(),
        });

        return { ok: true as const };
    }),

    remove: superAdminProcedure.input(userIdInputSchema).mutation(async ({ ctx, input }) => {
        const target = await findStaff(input.userId);

        await assertNotLastSuperAdmin(target);

        await closeOpenInvites(target.phoneNumber);

        const requestHeaders = await headers();

        // Sessions first: if the role change then fails, a retry still finds them on the team.
        await auth.api.revokeUserSessions({ body: { userId: target.id }, headers: requestHeaders });
        await auth.api.setRole({ body: { userId: target.id, role: "member" }, headers: requestHeaders });

        await writeAuditLog({
            actorId: ctx.userId,
            action: "staff.removed",
            entityType: "user",
            entityId: target.id,
            metadata: { from: target.role },
            ipAddress: await getClientIp(),
        });

        return { ok: true as const };
    }),
});
