import { z } from "zod";

export const FIELD_TYPES = [
    "short_text",
    "long_text",
    "number",
    "date",
    "choice",
    "yes_no",
    "document",
    "table",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const TABLE_COLUMN_TYPES = ["short_text", "number", "date", "choice", "yes_no"] as const satisfies readonly FieldType[];

export const PREFILL_SOURCES = [
    "name",
    "phoneNumber",
    "contactEmail",
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "pincode",
    "jamaat",
] as const;

export type PrefillSource = (typeof PREFILL_SOURCES)[number];

export const MAX_SECTIONS = 20;
export const MAX_FIELDS_PER_SECTION = 40;
export const MAX_TABLE_COLUMNS = 10;
export const MAX_TABLE_ROWS = 30;
export const MAX_CHOICE_OPTIONS = 50;
export const MAX_DOCUMENTS_PER_FIELD = 10;
export const SHORT_TEXT_MAX = 200;
export const LONG_TEXT_MAX = 4000;

const fieldId = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/);

export const localizedTextSchema = z.object({
    en: z.string().trim().min(1, "textRequired").max(500, "textTooLong"),
    gu: z.string().trim().max(500, "textTooLong"),
});

const optionalLocalizedTextSchema = z.object({
    en: z.string().trim().max(1000, "textTooLong"),
    gu: z.string().trim().max(1000, "textTooLong"),
});

export type LocalizedText = z.infer<typeof localizedTextSchema>;

const choiceOptionSchema = z.object({
    value: fieldId,
    label: localizedTextSchema,
});

const baseField = {
    id: fieldId,
    label: localizedTextSchema,
    help: optionalLocalizedTextSchema.optional(),
    required: z.boolean(),
};

const shortTextField = z.object({
    ...baseField,
    type: z.literal("short_text"),
    prefill: z.enum(PREFILL_SOURCES).optional(),
});

const longTextField = z.object({
    ...baseField,
    type: z.literal("long_text"),
    prefill: z.enum(PREFILL_SOURCES).optional(),
});

const numberField = z.object({
    ...baseField,
    type: z.literal("number"),
    min: z.number({ error: "numberInvalid" }).optional(),
    max: z.number({ error: "numberInvalid" }).optional(),
    integer: z.boolean().optional(),
    money: z.boolean().optional(),
});

const dateField = z.object({
    ...baseField,
    type: z.literal("date"),
});

const choiceField = z.object({
    ...baseField,
    type: z.literal("choice"),
    options: z.array(choiceOptionSchema).min(1).max(MAX_CHOICE_OPTIONS),
});

const yesNoField = z.object({
    ...baseField,
    type: z.literal("yes_no"),
});

const documentField = z.object({
    ...baseField,
    type: z.literal("document"),
    maxFiles: z.number({ error: "maxFilesInvalid" }).int("maxFilesInvalid").min(1, "maxFilesInvalid").max(MAX_DOCUMENTS_PER_FIELD, "maxFilesInvalid"),
});

const tableColumnSchema = z.discriminatedUnion("type", [shortTextField.omit({ prefill: true }), numberField, dateField, choiceField, yesNoField]);

const tableField = z.object({
    ...baseField,
    type: z.literal("table"),
    columns: z.array(tableColumnSchema).min(1).max(MAX_TABLE_COLUMNS),
    minRows: z.number({ error: "rowsInvalid" }).int("rowsInvalid").min(0, "rowsInvalid").max(MAX_TABLE_ROWS, "rowsInvalid"),
    maxRows: z.number({ error: "rowsInvalid" }).int("rowsInvalid").min(1, "rowsInvalid").max(MAX_TABLE_ROWS, "rowsInvalid"),
});

export const fieldSchema = z.discriminatedUnion("type", [
    shortTextField,
    longTextField,
    numberField,
    dateField,
    choiceField,
    yesNoField,
    documentField,
    tableField,
]);

export type FormField = z.infer<typeof fieldSchema>;
export type TableColumn = z.infer<typeof tableColumnSchema>;
export type FieldOf<T extends FieldType> = Extract<FormField, { type: T }>;

export const sectionSchema = z.object({
    id: fieldId,
    title: localizedTextSchema,
    description: optionalLocalizedTextSchema.optional(),
    fields: z.array(fieldSchema).min(1).max(MAX_FIELDS_PER_SECTION),
});

export type FormSection = z.infer<typeof sectionSchema>;

function duplicates(values: string[]) {
    return values.filter((value, index) => values.indexOf(value) !== index);
}

export const formDefinitionSchema = z
    .object({
        sections: z.array(sectionSchema).min(1).max(MAX_SECTIONS),
    })
    .superRefine((definition, ctx) => {
        const sectionIds = definition.sections.map((section) => section.id);
        const fieldIds = definition.sections.flatMap((section) => section.fields.map((field) => field.id));

        if (duplicates(sectionIds).length > 0 || duplicates(fieldIds).length > 0) {
            ctx.addIssue({ code: "custom", message: "duplicateId" });
        }

        definition.sections.forEach((section, sectionIndex) => {
            section.fields.forEach((field, fieldIndex) => {
                const path = ["sections", sectionIndex, "fields", fieldIndex];
                const checks: { item: FormField | TableColumn; at: (string | number)[] }[] = [{ item: field, at: path }];
                if (field.type === "table") {
                    field.columns.forEach((column, columnIndex) =>
                        checks.push({ item: column, at: [...path, "columns", columnIndex] }),
                    );
                }

                checks.forEach(({ item, at }) => {

                    if (item.type === "number" && item.min !== undefined && item.max !== undefined && item.min > item.max) {
                        ctx.addIssue({ code: "custom", path: [...at, "max"], message: "minAboveMax" });
                    }

                    if (item.type === "choice" && duplicates(item.options.map((option) => option.value)).length > 0) {
                        ctx.addIssue({ code: "custom", path: [...at, "options"], message: "duplicateId" });
                    }
                });

                if (field.type === "table") {
                    if (field.minRows > field.maxRows) {
                        ctx.addIssue({ code: "custom", path: [...path, "maxRows"], message: "rowsInvalid" });
                    }

                    if (duplicates(field.columns.map((column) => column.id)).length > 0) {
                        ctx.addIssue({ code: "custom", path: [...path, "columns"], message: "duplicateId" });
                    }
                }
            });
        });
    });

export type FormDefinition = z.infer<typeof formDefinitionSchema>;

export function parseDefinition(json: string): FormDefinition {
    return formDefinitionSchema.parse(JSON.parse(json));
}

export function allFields(definition: FormDefinition) {
    return definition.sections.flatMap((section) => section.fields);
}

export function localize(text: LocalizedText | undefined, locale: string) {
    if (!text) return "";

    return locale === "gu" && text.gu ? text.gu : text.en;
}

export const formDetailsSchema = z.object({
    titleEn: z.string().trim().min(1, "textRequired").max(100, "textTooLong"),
    titleGu: z.string().trim().max(100, "textTooLong"),
    summaryEn: z.string().trim().max(200, "textTooLong"),
    summaryGu: z.string().trim().max(200, "textTooLong"),
});

export const formMetaSchema = formDetailsSchema.extend({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slugInvalid").max(60, "slugInvalid"),
    code: z.string().regex(/^[A-Z]{2,5}$/, "codeInvalid"),
});

export type FormMeta = z.infer<typeof formMetaSchema>;
