import { hasPermission } from "@/lib/access";
import { getClientIp, maskPhone, writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { parseAnswers } from "@/lib/forms/answers";
import {
    accessLevelAllows,
    DECISION_STATUSES,
    levelForStatus,
    REVIEW_STATUSES,
    staffTransitions,
    type FormAccessLevel,
    type ReviewStatus,
} from "@/lib/forms/application-status";
import { parseDefinition } from "@/lib/forms/definition";
import {
    addNoteSchema,
    grantFormAccessSchema,
    reviewApplicationIdSchema,
    reviewFormIdSchema,
    reviewListInputSchema,
    revokeFormAccessSchema,
    setApplicationStatusSchema,
} from "@/lib/forms/review.schemas";
import {
    auditFormDenied,
    canSeeContact,
    formAccessLevel,
    formAccessLevels,
    hideContactAnswers,
    notifyApplicant,
    reviewWhere,
    roleAccessLevel,
    seesAllForms,
} from "@/lib/forms/review.server";
import { STAFF_ROLES } from "@/lib/permissions";
import { createTRPCRouter, fail, staffProcedure, type Context } from "../init";

type Caller = { userId: string; role: string | null | undefined; locale: Context["locale"] };

function callerOf(ctx: { userId: string; locale: Context["locale"]; auth: { user: { role?: string | null } } }): Caller {
    return { userId: ctx.userId, role: ctx.auth.user.role, locale: ctx.locale };
}

async function requireFormLevel(caller: Caller, formId: string, needed: FormAccessLevel, entity: string) {
    const level = await formAccessLevel(caller.userId, caller.role, formId);

    if (!level || !accessLevelAllows(level, needed)) {
        await auditFormDenied(caller.userId, formId, needed, entity);
        return fail(caller.locale, "FORBIDDEN", "forbidden");
    }

    return level;
}

async function reviewableApplication(caller: Caller, id: string, needed: FormAccessLevel) {
    const application = await db.application.findUnique({
        where: { id },
        include: {
            form: { select: { id: true, code: true, titleEn: true, titleGu: true } },
            formVersion: { select: { definition: true } },
            user: { select: { id: true, name: true, memberId: true, phoneNumber: true } },
        },
    });

    if (!application || application.status === "draft") {
        return fail(caller.locale, "NOT_FOUND", "applicationNotFound");
    }

    const level = await requireFormLevel(caller, application.formId, needed, `application:${application.id}`);

    return { application, level };
}

function emptyCounts() {
    return Object.fromEntries(REVIEW_STATUSES.map((status) => [status, 0])) as Record<ReviewStatus, number>;
}

export const applicationReviewRouter = createTRPCRouter({
    forms: staffProcedure({ application: ["read"] }).query(async ({ ctx }) => {
        const role = ctx.auth.user.role;
        const levels = await formAccessLevels(ctx.userId, role);
        const ids = [...levels.keys()];

        const [forms, counts] = await Promise.all([
            db.form.findMany({
                where: { id: { in: ids } },
                orderBy: { position: "asc" },
                select: { id: true, code: true, titleEn: true, titleGu: true, isOpen: true },
            }),
            db.application.groupBy({
                by: ["formId", "status"],
                where: { formId: { in: ids }, status: { not: "draft" } },
                _count: { _all: true },
            }),
        ]);

        return {
            canAssign: seesAllForms(role),
            canExport: hasPermission(role, { application: ["export"] }),
            forms: forms.map((form) => {
                const byStatus = emptyCounts();
                for (const row of counts) {
                    if (row.formId === form.id && row.status in byStatus) {
                        byStatus[row.status as ReviewStatus] = row._count._all;
                    }
                }

                return {
                    ...form,
                    level: levels.get(form.id) ?? "view",
                    counts: byStatus,
                    total: Object.values(byStatus).reduce((sum, value) => sum + value, 0),
                };
            }),
        };
    }),

    filters: staffProcedure({ application: ["read"] })
        .input(reviewFormIdSchema)
        .query(async ({ ctx, input }) => {
            await requireFormLevel(callerOf(ctx), input.formId, "view", "filters");

            const where = { formId: input.formId, status: { not: "draft" } };
            const [jamaats, cities] = await Promise.all([
                db.application.groupBy({ by: ["jamaat"], where: { ...where, jamaat: { not: null } } }),
                db.application.groupBy({ by: ["city"], where: { ...where, city: { not: null } } }),
            ]);

            const sorted = (values: (string | null)[]) =>
                values.filter((value): value is string => Boolean(value)).sort((a, b) => a.localeCompare(b));

            return {
                jamaats: sorted(jamaats.map((row) => row.jamaat)),
                cities: sorted(cities.map((row) => row.city)),
            };
        }),

    list: staffProcedure({ application: ["read"] })
        .input(reviewListInputSchema)
        .query(async ({ ctx, input }) => {
            await requireFormLevel(callerOf(ctx), input.formId, "view", "list");

            const contact = canSeeContact(ctx.auth.user.role);
            const where = reviewWhere(input, contact);

            const [total, rows] = await Promise.all([
                db.application.count({ where }),
                db.application.findMany({
                    where,
                    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
                    skip: (input.page - 1) * input.pageSize,
                    take: input.pageSize,
                    select: {
                        id: true,
                        number: true,
                        status: true,
                        jamaat: true,
                        city: true,
                        submittedAt: true,
                        updatedAt: true,
                        user: { select: { name: true, memberId: true } },
                    },
                }),
            ]);

            return {
                total,
                page: input.page,
                pageSize: input.pageSize,
                canSearchPhone: contact,
                rows: rows.map((row) => ({
                    id: row.id,
                    number: row.number,
                    status: row.status,
                    jamaat: row.jamaat,
                    city: row.city,
                    submittedAt: row.submittedAt,
                    updatedAt: row.updatedAt,
                    applicant: row.user.name,
                    memberId: row.user.memberId,
                })),
            };
        }),

    get: staffProcedure({ application: ["read"] })
        .input(reviewApplicationIdSchema)
        .query(async ({ ctx, input }) => {
            const { application, level } = await reviewableApplication(callerOf(ctx), input.id, "view");
            const contact = canSeeContact(ctx.auth.user.role);
            const definition = parseDefinition(application.formVersion.definition);
            const answers = parseAnswers(application.answers);

            const [documents, events, notes] = await Promise.all([
                db.applicationDocument.findMany({
                    where: { applicationId: application.id, uploadedAt: { not: null } },
                    orderBy: { createdAt: "asc" },
                    select: { id: true, fieldId: true, fileName: true, contentType: true, size: true },
                }),
                db.applicationEvent.findMany({
                    where: { applicationId: application.id },
                    orderBy: { createdAt: "asc" },
                    select: {
                        id: true,
                        fromStatus: true,
                        toStatus: true,
                        message: true,
                        createdAt: true,
                        actorId: true,
                        actor: { select: { name: true } },
                    },
                }),
                db.applicationNote.findMany({
                    where: { applicationId: application.id },
                    orderBy: { createdAt: "desc" },
                    select: { id: true, body: true, createdAt: true, author: { select: { name: true } } },
                }),
            ]);

            return {
                id: application.id,
                number: application.number,
                status: application.status,
                submittedAt: application.submittedAt,
                decidedAt: application.decidedAt,
                updatedAt: application.updatedAt,
                form: application.form,
                applicant: {
                    id: application.user.id,
                    name: application.user.name,
                    memberId: application.user.memberId,
                    phone: contact ? (application.user.phoneNumber ?? "") : maskPhone(application.user.phoneNumber),
                },
                definition,
                answers: contact ? answers : hideContactAnswers(definition, answers),
                documents,
                events: events.map((event) => ({
                    id: event.id,
                    fromStatus: event.fromStatus,
                    toStatus: event.toStatus,
                    message: event.message,
                    createdAt: event.createdAt,
                    byApplicant: event.actorId === application.userId,
                    actorName: event.actor?.name ?? null,
                })),
                notes: notes.map((note) => ({
                    id: note.id,
                    body: note.body,
                    createdAt: note.createdAt,
                    authorName: note.author?.name ?? null,
                })),
                level,
                transitions: staffTransitions(application.status, level),
                canNote: accessLevelAllows(level, "review"),
            };
        }),

    setStatus: staffProcedure({ application: ["review"] })
        .input(setApplicationStatusSchema)
        .mutation(async ({ ctx, input }) => {
            const caller = callerOf(ctx);
            const { application } = await reviewableApplication(caller, input.id, "review");
            const level = await requireFormLevel(
                caller,
                application.formId,
                levelForStatus(input.status),
                `application:${application.id}`,
            );

            if (!staffTransitions(application.status, level).includes(input.status)) {
                return fail(ctx.locale, "BAD_REQUEST", "statusChangeInvalid");
            }

            const decided = (DECISION_STATUSES as readonly string[]).includes(input.status);
            const number = application.number ?? application.id;

            await db.$transaction(async (tx) => {
                const updated = await tx.application.updateMany({
                    where: { id: application.id, status: application.status },
                    data: { status: input.status, decidedAt: decided ? new Date() : null },
                });

                if (updated.count === 0) return fail(ctx.locale, "CONFLICT", "applicationChanged");

                await tx.applicationEvent.create({
                    data: {
                        applicationId: application.id,
                        actorId: ctx.userId,
                        fromStatus: application.status,
                        toStatus: input.status,
                        message: input.message || null,
                    },
                });
            });

            await writeAuditLog({
                actorId: ctx.userId,
                action: "application.status.changed",
                entityType: "application",
                entityId: application.id,
                metadata: { number, form: application.form.code, from: application.status, to: input.status },
                ipAddress: await getClientIp(),
            });

            const smsSent = await notifyApplicant(application.userId, number, input.status);

            return { smsSent };
        }),

    addNote: staffProcedure({ application: ["review"] })
        .input(addNoteSchema)
        .mutation(async ({ ctx, input }) => {
            const { application } = await reviewableApplication(callerOf(ctx), input.id, "review");

            const note = await db.applicationNote.create({
                data: { applicationId: application.id, authorId: ctx.userId, body: input.body },
                select: { id: true },
            });

            await writeAuditLog({
                actorId: ctx.userId,
                action: "application.note.added",
                entityType: "application",
                entityId: application.id,
                metadata: { number: application.number, noteId: note.id },
                ipAddress: await getClientIp(),
            });

            return { ok: true as const };
        }),

    access: staffProcedure({ form: ["assign"] }).query(async () => {
        const [forms, staff] = await Promise.all([
            db.form.findMany({
                orderBy: { position: "asc" },
                select: {
                    id: true,
                    code: true,
                    titleEn: true,
                    titleGu: true,
                    access: { select: { userId: true, level: true } },
                },
            }),
            db.user.findMany({
                where: { role: { in: [...STAFF_ROLES] } },
                orderBy: [{ name: "asc" }, { id: "asc" }],
                select: { id: true, name: true, role: true },
            }),
        ]);

        return {
            forms,
            staff: staff
                .map((person) => ({
                    id: person.id,
                    name: person.name,
                    role: person.role ?? "member",
                    roleLevel: roleAccessLevel(person.role),
                    seesAll: seesAllForms(person.role),
                }))
                .filter((person) => person.roleLevel !== null),
        };
    }),

    grantAccess: staffProcedure({ form: ["assign"] })
        .input(grantFormAccessSchema)
        .mutation(async ({ ctx, input }) => {
            const [form, person] = await Promise.all([
                db.form.findUnique({ where: { id: input.formId }, select: { id: true, code: true } }),
                db.user.findUnique({ where: { id: input.userId }, select: { id: true, role: true } }),
            ]);

            if (!form) return fail(ctx.locale, "NOT_FOUND", "formNotFound");
            if (!person || !roleAccessLevel(person.role)) return fail(ctx.locale, "BAD_REQUEST", "notOnTeam");

            const previous = await db.formAccess.findUnique({
                where: { formId_userId: { formId: form.id, userId: person.id } },
                select: { level: true },
            });

            await db.formAccess.upsert({
                where: { formId_userId: { formId: form.id, userId: person.id } },
                create: { formId: form.id, userId: person.id, level: input.level },
                update: { level: input.level },
            });

            await writeAuditLog({
                actorId: ctx.userId,
                action: "form.access.granted",
                entityType: "form",
                entityId: form.id,
                metadata: { form: form.code, userId: person.id, level: input.level, previous: previous?.level ?? null },
                ipAddress: await getClientIp(),
            });

            return { ok: true as const };
        }),

    revokeAccess: staffProcedure({ form: ["assign"] })
        .input(revokeFormAccessSchema)
        .mutation(async ({ ctx, input }) => {
            const removed = await db.formAccess.deleteMany({ where: { formId: input.formId, userId: input.userId } });

            if (removed.count > 0) {
                await writeAuditLog({
                    actorId: ctx.userId,
                    action: "form.access.revoked",
                    entityType: "form",
                    entityId: input.formId,
                    metadata: { userId: input.userId },
                    ipAddress: await getClientIp(),
                });
            }

            return { ok: true as const };
        }),
});
