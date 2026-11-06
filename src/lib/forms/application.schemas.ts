import { z } from "zod";
import { DOCUMENT_CONTENT_TYPES, MAX_DOCUMENT_BYTES } from "./documents";

const id = z.string().trim().min(1).max(100);

export const MAX_ANSWERS_JSON_LENGTH = 200_000;

export const applicationIdSchema = z.object({ id });

export const startApplicationSchema = z.object({
    slug: z.string().trim().min(1).max(60),
});

export const saveAnswersSchema = z.object({
    id,
    answers: z
        .record(z.string().max(40), z.unknown())
        .refine((value) => JSON.stringify(value).length <= MAX_ANSWERS_JSON_LENGTH, "answerTooLong"),
});

export const requestUploadSchema = z.object({
    applicationId: id,
    fieldId: z.string().max(40),
    fileName: z.string().trim().min(1).max(200),
    contentType: z.enum(DOCUMENT_CONTENT_TYPES),
    size: z.number().int().min(1).max(MAX_DOCUMENT_BYTES),
});

export const documentIdSchema = z.object({ documentId: id });
