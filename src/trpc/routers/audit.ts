import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { auditListInputSchema, dayRange } from "@/lib/list.schemas";
import { createTRPCRouter, staffProcedure } from "../init";

const auditReader = staffProcedure({ auditLog: ["read"] });

export const auditRouter = createTRPCRouter({
    list: auditReader.input(auditListInputSchema).query(async ({ input }) => {
        const where: Prisma.AuditLogWhereInput = {};

        if (input.action) where.action = input.action;
        if (input.actorId) where.actorId = input.actorId;

        const range = dayRange(input.dates);
        if (range) where.createdAt = range;

        const [total, rows] = await Promise.all([
            db.auditLog.count({ where }),
            db.auditLog.findMany({
                where,
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                skip: (input.page - 1) * input.pageSize,
                take: input.pageSize,
                include: { actor: { select: { name: true } } },
            }),
        ]);

        return {
            total,
            page: input.page,
            pageSize: input.pageSize,
            rows: rows.map((row) => ({
                id: row.id,
                createdAt: row.createdAt,
                action: row.action,
                actorId: row.actorId,
                actorName: row.actor?.name ?? null,
                entityType: row.entityType,
                entityId: row.entityId,
                ipAddress: row.ipAddress,
            })),
        };
    }),

    filters: auditReader.query(async () => {
        const [actions, actors] = await Promise.all([
            db.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
            db.auditLog.findMany({
                where: { actorId: { not: null } },
                distinct: ["actorId"],
                select: { actorId: true, actor: { select: { name: true } } },
            }),
        ]);

        return {
            actions: actions.map((row) => row.action),
            actors: actors
                .filter((row): row is typeof row & { actorId: string } => row.actorId !== null)
                .map((row) => ({ id: row.actorId, name: row.actor?.name ?? row.actorId }))
                .sort((a, b) => a.name.localeCompare(b.name)),
        };
    }),
});
