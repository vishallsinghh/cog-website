import { z } from "zod";
import {
    allFields,
    LONG_TEXT_MAX,
    SHORT_TEXT_MAX,
    type FieldOf,
    type FormDefinition,
    type FormField,
    type TableColumn,
} from "./definition";

export type CellValue = string | number | boolean | null;
export type TableRow = Record<string, CellValue>;
export type AnswerValue = CellValue | string[] | TableRow[];
export type Answers = Record<string, AnswerValue>;

export type AnswerMode = "draft" | "submit";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string) {
    if (!ISO_DATE.test(value)) return false;

    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function isStrict(field: { required: boolean }, mode: AnswerMode) {
    return mode === "submit" && field.required;
}

function textSchema(field: { required: boolean }, max: number, mode: AnswerMode) {
    const text = z.string("answerRequired").trim().max(max, "answerTooLong");

    return isStrict(field, mode) ? text.min(1, "answerRequired") : text;
}

function numberSchema(field: FieldOf<"number">, mode: AnswerMode) {
    let number = z.number({
        error: (issue) => (issue.input === undefined || issue.input === null ? "answerRequired" : "numberInvalid"),
    });

    if (field.integer || field.money) number = number.int("numberWhole");
    if (field.min !== undefined) number = number.min(field.min, "numberTooSmall");
    if (field.max !== undefined) number = number.max(field.max, "numberTooLarge");

    return isStrict(field, mode) ? number : number.nullable();
}

function dateSchema(field: { required: boolean }, mode: AnswerMode) {
    const date = z.string("answerRequired").min(1, { message: "answerRequired", abort: true }).refine(isRealDate, "dateInvalid");

    return isStrict(field, mode) ? date : z.union([z.literal(""), date]);
}

function choiceSchema(field: FieldOf<"choice">, mode: AnswerMode) {
    const values = field.options.map((option) => option.value);
    const choice = z
        .string("answerRequired")
        .min(1, { message: "answerRequired", abort: true })
        .refine((value) => values.includes(value), "choiceInvalid");

    return isStrict(field, mode) ? choice : z.union([z.literal(""), choice]);
}

function yesNoSchema(field: { required: boolean }, mode: AnswerMode) {
    const answer = z.boolean("answerRequired");

    return isStrict(field, mode) ? answer : answer.nullable();
}

function documentSchema(field: FieldOf<"document">, mode: AnswerMode) {
    const ids = z.array(z.string().min(1).max(100)).max(field.maxFiles, "tooManyDocuments");

    return isStrict(field, mode) ? ids.min(1, "documentRequired") : ids;
}

function columnSchema(column: TableColumn, mode: AnswerMode): z.ZodType<CellValue> {
    switch (column.type) {
        case "short_text":
            return textSchema(column, SHORT_TEXT_MAX, mode);
        case "number":
            return numberSchema(column, mode);
        case "date":
            return dateSchema(column, mode);
        case "choice":
            return choiceSchema(column, mode);
        case "yes_no":
            return yesNoSchema(column, mode);
    }
}

function tableSchema(field: FieldOf<"table">, mode: AnswerMode) {
    const row = z.object(
        Object.fromEntries(
            field.columns.map((column) => {
                const schema = columnSchema(column, mode);
                return [column.id, isStrict(column, mode) ? schema : schema.optional()];
            }),
        ),
    );
    const rows = z.array(row).max(field.maxRows, "tableTooManyRows");

    if (mode === "draft") return rows;

    const minRows = field.required ? Math.max(1, field.minRows) : field.minRows;
    return minRows > 0 ? rows.min(minRows, "tableTooFewRows") : rows;
}

function answerSchema(field: FormField, mode: AnswerMode): z.ZodType<AnswerValue> {
    switch (field.type) {
        case "short_text":
            return textSchema(field, SHORT_TEXT_MAX, mode);
        case "long_text":
            return textSchema(field, LONG_TEXT_MAX, mode);
        case "number":
            return numberSchema(field, mode);
        case "date":
            return dateSchema(field, mode);
        case "choice":
            return choiceSchema(field, mode);
        case "yes_no":
            return yesNoSchema(field, mode);
        case "document":
            return documentSchema(field, mode);
        case "table":
            return tableSchema(field, mode) as z.ZodType<TableRow[]>;
    }
}

export function buildAnswersSchema(definition: FormDefinition, mode: AnswerMode) {
    return z.object(
        Object.fromEntries(
            allFields(definition).map((field) => {
                const schema = answerSchema(field, mode);
                return [field.id, isStrict(field, mode) ? schema : schema.optional()];
            }),
        ),
    ) as z.ZodType<Answers, Answers>;
}

export function emptyAnswer(field: FormField): AnswerValue {
    switch (field.type) {
        case "number":
        case "yes_no":
            return null;
        case "document":
        case "table":
            return [];
        default:
            return "";
    }
}

export function emptyAnswers(definition: FormDefinition): Answers {
    return Object.fromEntries(allFields(definition).map((field) => [field.id, emptyAnswer(field)]));
}

export function documentIdsIn(definition: FormDefinition, answers: Answers) {
    return allFields(definition)
        .filter((field) => field.type === "document")
        .flatMap((field) => {
            const value = answers[field.id];
            return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
        });
}

export function parseAnswers(json: string): Answers {
    const value: unknown = JSON.parse(json);

    return value && typeof value === "object" && !Array.isArray(value) ? (value as Answers) : {};
}
