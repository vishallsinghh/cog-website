import { db } from "@/lib/db";
import { buildAnswersSchema, documentIdsIn, parseAnswers, type Answers } from "@/lib/forms/answers";
import {
    applicationIdSchema,
    documentIdSchema,
    requestUploadSchema,
    saveAnswersSchema,
    startApplicationSchema,
} from "@/lib/forms/application.schemas";
import { canMemberEdit, type ApplicationStatus } from "@/lib/forms/application-status";
import {
    canCompress,
    COMPRESSED_CONTENT_TYPE,
    compressedFileName,
    compressImage,
} from "@/lib/forms/compress.server";
import { allFields, parseDefinition, type FormDefinition } from "@/lib/forms/definition";
import { isDocumentContentType, matchesClaimedType, SIGNATURE_BYTES } from "@/lib/forms/documents";
import { answerForSource, prefillAnswers } from "@/lib/forms/prefill";
import { notifyApplicant } from "@/lib/forms/review.server";
import {
    createUploadUrl,
    deleteObject,
    documentStorageKey,
    getObject,
    headObject,
    putObject,
    readObjectStart,
    storageConfigured,
    UPLOAD_URL_TTL_SECONDS,
} from "@/lib/storage";
import { createTRPCRouter, fail, protectedProcedure, type Context } from "../init";

const MAX_OPEN_DRAFTS = 10;
const MAX_DOCUMENTS_PER_APPLICATION = 60;
const STALE_UPLOAD_AFTER_MS = 2 * UPLOAD_URL_TTL_SECONDS * 1000;

type Locale = Context["locale"];

async function latestPublishedVersion(formId: string) {
    return db.formVersion.findFirst({
        where: { formId, publishedAt: { not: null } },
        orderBy: { version: "desc" },
    });
}

async function ownApplication(locale: Locale, userId: string, id: string) {
    const application = await db.application.findUnique({
        where: { id },
        include: { form: true, formVersion: true },
    });

    if (!application || application.userId !== userId) {
        return fail(locale, "NOT_FOUND", "applicationNotFound");
    }

    return { ...application, definition: parseDefinition(application.formVersion.definition) };
}

async function editableApplication(locale: Locale, userId: string, id: string) {
    const application = await ownApplication(locale, userId, id);

    if (!canMemberEdit(application.status)) {
        return fail(locale, "BAD_REQUEST", "applicationLocked");
    }

    return application;
}

async function purgeStaleUploads(applicationId: string) {
    const stale = await db.applicationDocument.findMany({
        where: {
            applicationId,
            uploadedAt: null,
            createdAt: { lt: new Date(Date.now() - STALE_UPLOAD_AFTER_MS) },
        },
        select: { id: true, storageKey: true },
    });

    if (stale.length === 0) return;

    const results = await Promise.allSettled(stale.map((document) => deleteObject(document.storageKey)));
    const purged = stale.filter((_, index) => results[index]?.status === "fulfilled").map((document) => document.id);

    if (purged.length > 0) {
        await db.applicationDocument.deleteMany({ where: { id: { in: purged }, uploadedAt: null } });
    }
}

// The smaller copy goes under a new key and the original is deleted only after the row
// points at the copy, so a failure at any step still leaves a working document.
async function compressUploadedImage(document: {
    applicationId: string;
    storageKey: string;
    fileName: string;
    contentType: string;
}) {
    if (!canCompress(document.contentType)) return null;

    const compressed = await compressImage(await getObject(document.storageKey));
    if (!compressed) return null;

    const storageKey = documentStorageKey(document.applicationId);
    await putObject(storageKey, compressed, COMPRESSED_CONTENT_TYPE);

    return {
        storageKey,
        size: compressed.byteLength,
        contentType: COMPRESSED_CONTENT_TYPE,
        fileName: compressedFileName(document.fileName),
    };
}

function documentFieldIds(definition: FormDefinition) {
    return new Set(allFields(definition).filter((field) => field.type === "document").map((field) => field.id));
}

// While COG is waiting for more documents, only document answers can change and
// documents that were already submitted cannot be taken away.
function mergeForStatus(definition: FormDefinition, status: string, stored: Answers, incoming: Answers): Answers {
    if (status !== "documents_required") return incoming;

    const merged = { ...stored };

    for (const fieldId of documentFieldIds(definition)) {
        const before = Array.isArray(stored[fieldId]) ? (stored[fieldId] as string[]) : [];
        const after = Array.isArray(incoming[fieldId]) ? (incoming[fieldId] as string[]) : [];
        merged[fieldId] = [...new Set([...before, ...after])];
    }

    return merged;
}

async function assertDocumentsBelong(locale: Locale, applicationId: string, definition: FormDefinition, answers: Answers) {
    const documents = await db.applicationDocument.findMany({
        where: { applicationId, uploadedAt: { not: null } },
        select: { id: true, fieldId: true },
    });
    const fieldOf = new Map(documents.map((document) => [document.id, document.fieldId]));

    for (const fieldId of documentFieldIds(definition)) {
        const ids = answers[fieldId];
        if (!Array.isArray(ids)) continue;

        for (const id of ids) {
            if (typeof id !== "string" || fieldOf.get(id) !== fieldId) {
                await fail(locale, "BAD_REQUEST", "documentInvalid");
            }
        }
    }
}

function indiaYear() {
    return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric" }).format(new Date());
}

async function nextApplicationNumber(code: string) {
    const year = indiaYear();
    const counter = await db.applicationCounter.upsert({
        where: { key: `${code}-${year}` },
        create: { key: `${code}-${year}`, value: 1 },
        update: { value: { increment: 1 } },
    });

    return `${code}-${year}-${String(counter.value).padStart(5, "0")}`;
}

export const applicationsRouter = createTRPCRouter({
    openForms: protectedProcedure.query(async () => {
        const forms = await db.form.findMany({
            where: { isOpen: true, versions: { some: { publishedAt: { not: null } } } },
            orderBy: { position: "asc" },
            select: { slug: true, code: true, titleEn: true, titleGu: true, summaryEn: true, summaryGu: true },
        });

        return forms;
    }),

    list: protectedProcedure.query(async ({ ctx }) => {
        const applications = await db.application.findMany({
            where: { userId: ctx.userId },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                number: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                submittedAt: true,
                form: { select: { code: true, titleEn: true, titleGu: true } },
            },
        });

        return applications;
    }),

    get: protectedProcedure.input(applicationIdSchema).query(async ({ ctx, input }) => {
        const application = await ownApplication(ctx.locale, ctx.userId, input.id);

        const [documents, events] = await Promise.all([
            db.applicationDocument.findMany({
                where: { applicationId: application.id, uploadedAt: { not: null } },
                orderBy: { createdAt: "asc" },
                select: { id: true, fieldId: true, fileName: true, contentType: true, size: true, uploadedAt: true },
            }),
            db.applicationEvent.findMany({
                where: { applicationId: application.id },
                orderBy: { createdAt: "asc" },
                select: { id: true, fromStatus: true, toStatus: true, message: true, createdAt: true },
            }),
        ]);

        return {
            id: application.id,
            number: application.number,
            status: application.status,
            editable: canMemberEdit(application.status),
            createdAt: application.createdAt,
            updatedAt: application.updatedAt,
            submittedAt: application.submittedAt,
            form: {
                slug: application.form.slug,
                code: application.form.code,
                titleEn: application.form.titleEn,
                titleGu: application.form.titleGu,
            },
            definition: application.definition,
            answers: parseAnswers(application.answers),
            documents: documents.map((document) => ({
                ...document,
                removable:
                    !application.submittedAt ||
                    (document.uploadedAt?.getTime() ?? 0) > application.submittedAt.getTime(),
            })),
            events,
            uploadsAvailable: storageConfigured(),
        };
    }),

    start: protectedProcedure.input(startApplicationSchema).mutation(async ({ ctx, input }) => {
        const form = await db.form.findUnique({ where: { slug: input.slug } });
        const version = form?.isOpen ? await latestPublishedVersion(form.id) : null;

        if (!form || !version) return fail(ctx.locale, "BAD_REQUEST", "formClosed");

        const drafts = await db.application.count({ where: { userId: ctx.userId, status: "draft" } });
        if (drafts >= MAX_OPEN_DRAFTS) return fail(ctx.locale, "BAD_REQUEST", "tooManyDrafts");

        const user = await db.user.findUnique({ where: { id: ctx.userId }, include: { profile: true } });
        const definition = parseDefinition(version.definition);
        const profile = user?.profile;
        const answers = prefillAnswers(definition, {
            name: user?.name,
            phoneNumber: user?.phoneNumber,
            contactEmail: profile?.contactEmail,
            addressLine1: profile?.addressLine1,
            addressLine2: profile?.addressLine2,
            city: profile?.city,
            state: profile?.state,
            pincode: profile?.pincode,
            jamaat: profile?.jamaat,
        });

        const application = await db.application.create({
            data: {
                formId: form.id,
                formVersionId: version.id,
                userId: ctx.userId,
                answers: JSON.stringify(answers),
            },
            select: { id: true },
        });

        return application;
    }),

    saveDraft: protectedProcedure.input(saveAnswersSchema).mutation(async ({ ctx, input }) => {
        const application = await editableApplication(ctx.locale, ctx.userId, input.id);
        const parsed = buildAnswersSchema(application.definition, "draft").safeParse(input.answers);

        if (!parsed.success) return fail(ctx.locale, "BAD_REQUEST", "answersInvalid");

        const answers = mergeForStatus(
            application.definition,
            application.status,
            parseAnswers(application.answers),
            parsed.data,
        );
        await assertDocumentsBelong(ctx.locale, application.id, application.definition, answers);

        await db.application.update({
            where: { id: application.id },
            data: { answers: JSON.stringify(answers) },
        });

        return { ok: true as const };
    }),

    submit: protectedProcedure.input(saveAnswersSchema).mutation(async ({ ctx, input }) => {
        const application = await editableApplication(ctx.locale, ctx.userId, input.id);
        const answers = mergeForStatus(
            application.definition,
            application.status,
            parseAnswers(application.answers),
            input.answers as Answers,
        );
        const parsed = buildAnswersSchema(application.definition, "submit").safeParse(answers);

        if (!parsed.success) return fail(ctx.locale, "BAD_REQUEST", "answersInvalid");

        await assertDocumentsBelong(ctx.locale, application.id, application.definition, parsed.data);

        const number = application.number ?? (await nextApplicationNumber(application.form.code));
        const fromStatus = application.status as ApplicationStatus;

        await db.$transaction(async (tx) => {
            const updated = await tx.application.updateMany({
                where: { id: application.id, status: fromStatus },
                data: {
                    number,
                    status: "received",
                    answers: JSON.stringify(parsed.data),
                    jamaat: answerForSource(application.definition, parsed.data, "jamaat"),
                    city: answerForSource(application.definition, parsed.data, "city"),
                    submittedAt: new Date(),
                },
            });

            if (updated.count === 0) return fail(ctx.locale, "CONFLICT", "applicationLocked");

            await tx.applicationEvent.create({
                data: { applicationId: application.id, actorId: ctx.userId, fromStatus, toStatus: "received" },
            });
        });

        await notifyApplicant(ctx.userId, number, "received");

        return { number };
    }),

    discard: protectedProcedure.input(applicationIdSchema).mutation(async ({ ctx, input }) => {
        const application = await ownApplication(ctx.locale, ctx.userId, input.id);

        if (application.status !== "draft") return fail(ctx.locale, "BAD_REQUEST", "applicationLocked");

        const documents = await db.applicationDocument.findMany({
            where: { applicationId: application.id },
            select: { storageKey: true },
        });

        if (documents.length > 0 && storageConfigured()) {
            await Promise.allSettled(documents.map((document) => deleteObject(document.storageKey)));
        }

        await db.application.delete({ where: { id: application.id } });

        return { ok: true as const };
    }),

    requestUpload: protectedProcedure.input(requestUploadSchema).mutation(async ({ ctx, input }) => {
        if (!storageConfigured()) return fail(ctx.locale, "PRECONDITION_FAILED", "uploadsUnavailable");

        const application = await editableApplication(ctx.locale, ctx.userId, input.applicationId);
        const field = allFields(application.definition).find((item) => item.id === input.fieldId);

        if (field?.type !== "document") return fail(ctx.locale, "BAD_REQUEST", "documentInvalid");

        let freedSlots = 0;
        if (input.replacesDocumentId) {
            const replaced = await db.applicationDocument.findUnique({ where: { id: input.replacesDocumentId } });
            const replaceable =
                replaced?.applicationId === application.id &&
                replaced.fieldId === field.id &&
                replaced.uploadedAt !== null &&
                !(application.submittedAt && replaced.uploadedAt <= application.submittedAt);

            if (!replaceable) return fail(ctx.locale, "BAD_REQUEST", "documentInvalid");
            freedSlots = 1;
        }

        await purgeStaleUploads(application.id);

        const stored = parseAnswers(application.answers);
        const attached = documentIdsIn(application.definition, { [field.id]: stored[field.id] ?? [] }).filter(
            (id) => id !== input.replacesDocumentId,
        );
        if (attached.length >= field.maxFiles) return fail(ctx.locale, "BAD_REQUEST", "tooManyDocuments");

        const total = await db.applicationDocument.count({ where: { applicationId: application.id } });
        if (total - freedSlots >= MAX_DOCUMENTS_PER_APPLICATION) {
            return fail(ctx.locale, "BAD_REQUEST", "tooManyDocuments");
        }

        const storageKey = documentStorageKey(application.id);
        const document = await db.applicationDocument.create({
            data: {
                applicationId: application.id,
                fieldId: field.id,
                storageKey,
                fileName: input.fileName,
                contentType: input.contentType,
                size: input.size,
            },
            select: { id: true },
        });

        return { documentId: document.id, uploadUrl: await createUploadUrl(storageKey, input.contentType) };
    }),

    confirmUpload: protectedProcedure.input(documentIdSchema).mutation(async ({ ctx, input }) => {
        const document = await db.applicationDocument.findUnique({ where: { id: input.documentId } });

        if (!document) return fail(ctx.locale, "NOT_FOUND", "documentInvalid");

        await editableApplication(ctx.locale, ctx.userId, document.applicationId);

        const object = await headObject(document.storageKey);
        const matches =
            object !== null &&
            object.size === document.size &&
            object.contentType.split(";")[0]?.trim() === document.contentType;

        // The declared type is only a claim. The file's first bytes must agree with it, so a
        // file renamed to look like another type (an SVG called image.png) is thrown away.
        const genuine =
            matches &&
            isDocumentContentType(document.contentType) &&
            matchesClaimedType(await readObjectStart(document.storageKey, SIGNATURE_BYTES), document.contentType);

        if (!genuine) {
            await deleteObject(document.storageKey).catch(() => undefined);
            await db.applicationDocument.delete({ where: { id: document.id } });
            return fail(ctx.locale, "BAD_REQUEST", matches ? "documentContentMismatch" : "documentInvalid");
        }

        // A failed compression is not the member's problem: the original upload is kept.
        const compressed = await compressUploadedImage(document).catch(() => null);

        const confirmed = await db.applicationDocument.update({
            where: { id: document.id },
            data: { uploadedAt: new Date(), ...compressed },
            select: { id: true, fieldId: true, fileName: true, contentType: true, size: true, uploadedAt: true },
        });

        if (compressed) await deleteObject(document.storageKey).catch(() => undefined);

        return { ...confirmed, removable: true };
    }),

    removeDocument: protectedProcedure.input(documentIdSchema).mutation(async ({ ctx, input }) => {
        const document = await db.applicationDocument.findUnique({ where: { id: input.documentId } });

        if (!document) return fail(ctx.locale, "NOT_FOUND", "documentInvalid");

        const application = await editableApplication(ctx.locale, ctx.userId, document.applicationId);

        if (application.submittedAt && document.uploadedAt && document.uploadedAt <= application.submittedAt) {
            return fail(ctx.locale, "BAD_REQUEST", "documentLocked");
        }

        const answers = parseAnswers(application.answers);
        const ids = answers[document.fieldId];
        if (Array.isArray(ids)) answers[document.fieldId] = ids.filter((id) => id !== document.id) as string[];

        await db.application.update({ where: { id: application.id }, data: { answers: JSON.stringify(answers) } });
        await db.applicationDocument.delete({ where: { id: document.id } });
        await deleteObject(document.storageKey).catch(() => undefined);

        return { ok: true as const };
    }),
});
