import type { Prisma } from "@/generated/prisma/client";
import { hasPermission } from "@/lib/access";
import { getClientIp, writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { starterDefinition } from "@/lib/forms/builder";
import {
    createFormSchema,
    formIdSchema,
    moveFormSchema,
    saveDefinitionSchema,
    setFormOpenSchema,
    updateFormDetailsSchema,
} from "@/lib/forms/builder.schemas";
import { allFields, parseDefinition, type FieldType, type FormDefinition } from "@/lib/forms/definition";
import { createTRPCRouter, fail, staffProcedure, type Context } from "../init";

type Locale = Context["locale"];

async function findForm(locale: Locale, id: string) {
    const form = await db.form.findUnique({
        where: { id },
        include: { versions: { orderBy: { version: "desc" } } },
    });

    if (!form) return fail(locale, "NOT_FOUND", "formNotFound");

    return form;
}

type Versions = Awaited<ReturnType<typeof findForm>>["versions"];

function lockedTypes(versions: Versions) {
    const locked: Record<string, FieldType> = {};

    for (const version of versions) {
        if (!version.publishedAt) continue;
        for (const field of allFields(parseDefinition(version.definition))) locked[field.id] ??= field.type;
    }

    return locked;
}

async function assertTypesKept(locale: Locale, versions: Versions, definition: FormDefinition) {
    const locked = lockedTypes(versions);

    for (const field of allFields(definition)) {
        if (locked[field.id] && locked[field.id] !== field.type) await fail(locale, "BAD_REQUEST", "fieldTypeLocked");
    }
}

async function writeDraft(
    client: Prisma.TransactionClient,
    formId: string,
    versions: Versions,
    definition: FormDefinition,
    userId: string,
) {
    const draft = versions.find((version) => !version.publishedAt);
    const json = JSON.stringify(definition);

    if (draft) {
        return client.formVersion.update({
            where: { id: draft.id },
            data: { definition: json, createdById: userId },
        });
    }

    return client.formVersion.create({
        data: { formId, version: (versions[0]?.version ?? 0) + 1, definition: json, createdById: userId },
    });
}

async function audit(actorId: string, action: string, formId: string, metadata: Record<string, string | number | boolean | null>) {
    await writeAuditLog({
        actorId,
        action,
        entityType: "form",
        entityId: formId,
        metadata,
        ipAddress: await getClientIp(),
    });
}

export const formsAdminRouter = createTRPCRouter({
    list: staffProcedure({ form: ["read"] }).query(async ({ ctx }) => {
        const [forms, counts] = await Promise.all([
            db.form.findMany({
                orderBy: [{ position: "asc" }, { createdAt: "asc" }],
                include: { versions: { select: { version: true, publishedAt: true }, orderBy: { version: "desc" } } },
            }),
            db.application.groupBy({ by: ["formId"], where: { status: { not: "draft" } }, _count: { _all: true } }),
        ]);

        return {
            canWrite: hasPermission(ctx.auth.user.role, { form: ["write"] }),
            forms: forms.map((form) => {
                const published = form.versions.find((version) => version.publishedAt);

                return {
                    id: form.id,
                    code: form.code,
                    titleEn: form.titleEn,
                    titleGu: form.titleGu,
                    isOpen: form.isOpen,
                    publishedVersion: published?.version ?? null,
                    hasDraft: form.versions.some((version) => !version.publishedAt),
                    applications: counts.find((row) => row.formId === form.id)?._count._all ?? 0,
                };
            }),
        };
    }),

    get: staffProcedure({ form: ["read"] })
        .input(formIdSchema)
        .query(async ({ ctx, input }) => {
            const form = await findForm(ctx.locale, input.id);
            const draft = form.versions.find((version) => !version.publishedAt);
            const published = form.versions.find((version) => version.publishedAt);
            const source = draft ?? published;

            return {
                id: form.id,
                slug: form.slug,
                code: form.code,
                titleEn: form.titleEn,
                titleGu: form.titleGu,
                summaryEn: form.summaryEn,
                summaryGu: form.summaryGu,
                isOpen: form.isOpen,
                publishedVersion: published?.version ?? null,
                publishedAt: published?.publishedAt ?? null,
                draft: draft ? { version: draft.version, updatedAt: draft.updatedAt } : null,
                definition: source ? parseDefinition(source.definition) : starterDefinition(),
                lockedTypes: lockedTypes(form.versions),
                canWrite: hasPermission(ctx.auth.user.role, { form: ["write"] }),
            };
        }),

    create: staffProcedure({ form: ["write"] })
        .input(createFormSchema)
        .mutation(async ({ ctx, input }) => {
            const existing = await db.form.findFirst({
                where: { OR: [{ slug: input.slug }, { code: input.code }] },
                select: { id: true },
            });
            if (existing) return fail(ctx.locale, "CONFLICT", "formExists");

            const last = await db.form.findFirst({ orderBy: { position: "desc" }, select: { position: true } });

            const form = await db.$transaction(async (tx) => {
                const created = await tx.form.create({
                    data: { ...input, isOpen: false, position: (last?.position ?? -1) + 1 },
                    select: { id: true },
                });
                await tx.formVersion.create({
                    data: {
                        formId: created.id,
                        version: 1,
                        definition: JSON.stringify(starterDefinition()),
                        createdById: ctx.userId,
                    },
                });
                return created;
            });

            await audit(ctx.userId, "form.created", form.id, { form: input.code, slug: input.slug });

            return form;
        }),

    updateDetails: staffProcedure({ form: ["write"] })
        .input(updateFormDetailsSchema)
        .mutation(async ({ ctx, input }) => {
            const { id, ...details } = input;
            const form = await findForm(ctx.locale, id);

            await db.form.update({ where: { id: form.id }, data: details });
            await audit(ctx.userId, "form.details.updated", form.id, { form: form.code });

            return { ok: true as const };
        }),

    saveDraft: staffProcedure({ form: ["write"] })
        .input(saveDefinitionSchema)
        .mutation(async ({ ctx, input }) => {
            const form = await findForm(ctx.locale, input.id);
            await assertTypesKept(ctx.locale, form.versions, input.definition);

            const draft = await writeDraft(db, form.id, form.versions, input.definition, ctx.userId);
            await audit(ctx.userId, "form.draft.saved", form.id, { form: form.code, version: draft.version });

            return { version: draft.version, updatedAt: draft.updatedAt };
        }),

    publish: staffProcedure({ form: ["write"] })
        .input(saveDefinitionSchema)
        .mutation(async ({ ctx, input }) => {
            const form = await findForm(ctx.locale, input.id);
            await assertTypesKept(ctx.locale, form.versions, input.definition);

            const published = await db.$transaction(async (tx) => {
                const draft = await writeDraft(tx, form.id, form.versions, input.definition, ctx.userId);
                return tx.formVersion.update({ where: { id: draft.id }, data: { publishedAt: new Date() } });
            });

            await audit(ctx.userId, "form.published", form.id, { form: form.code, version: published.version });

            return { version: published.version };
        }),

    discardDraft: staffProcedure({ form: ["write"] })
        .input(formIdSchema)
        .mutation(async ({ ctx, input }) => {
            const form = await findForm(ctx.locale, input.id);
            const draft = form.versions.find((version) => !version.publishedAt);

            if (!draft) return fail(ctx.locale, "BAD_REQUEST", "noDraft");
            if (!form.versions.some((version) => version.publishedAt)) {
                return fail(ctx.locale, "BAD_REQUEST", "formNotPublished");
            }

            await db.formVersion.deleteMany({ where: { id: draft.id, publishedAt: null } });
            await audit(ctx.userId, "form.draft.discarded", form.id, { form: form.code, version: draft.version });

            return { ok: true as const };
        }),

    setOpen: staffProcedure({ form: ["write"] })
        .input(setFormOpenSchema)
        .mutation(async ({ ctx, input }) => {
            const form = await findForm(ctx.locale, input.id);

            if (input.open && !form.versions.some((version) => version.publishedAt)) {
                return fail(ctx.locale, "BAD_REQUEST", "formNotPublished");
            }

            if (form.isOpen !== input.open) {
                await db.form.update({ where: { id: form.id }, data: { isOpen: input.open } });
                await audit(ctx.userId, input.open ? "form.opened" : "form.closed", form.id, { form: form.code });
            }

            return { ok: true as const };
        }),

    move: staffProcedure({ form: ["write"] })
        .input(moveFormSchema)
        .mutation(async ({ ctx, input }) => {
            const forms = await db.form.findMany({
                orderBy: [{ position: "asc" }, { createdAt: "asc" }],
                select: { id: true, code: true },
            });
            const index = forms.findIndex((form) => form.id === input.id);
            if (index === -1) return fail(ctx.locale, "NOT_FOUND", "formNotFound");

            const target = input.direction === "up" ? index - 1 : index + 1;
            if (target < 0 || target >= forms.length) return { ok: true as const };

            const order = [...forms];
            [order[index], order[target]] = [order[target], order[index]];

            await db.$transaction(
                order.map((form, position) => db.form.update({ where: { id: form.id }, data: { position } })),
            );
            await audit(ctx.userId, "form.reordered", input.id, { form: forms[index].code, direction: input.direction });

            return { ok: true as const };
        }),
});
