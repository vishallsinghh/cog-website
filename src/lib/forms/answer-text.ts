import { formatIsoDate, formatRupees } from "@/lib/format";
import type { AnswerValue } from "./answers";
import { localize, type FormField, type TableColumn } from "./definition";

export type YesNoLabels = { yes: string; no: string };

export function answerText(
    field: FormField | TableColumn,
    value: AnswerValue | undefined,
    locale: string,
    labels: YesNoLabels,
): string | null {
    if (value === null || value === undefined || value === "") return null;

    switch (field.type) {
        case "number":
            if (typeof value !== "number") return null;
            return field.money ? formatRupees(value, locale) : value.toLocaleString(locale === "gu" ? "gu-IN" : "en-IN");
        case "date":
            return typeof value === "string" ? formatIsoDate(value, locale) : null;
        case "choice": {
            const option = field.options.find((item) => item.value === value);
            return option ? localize(option.label, locale) : String(value);
        }
        case "yes_no":
            return value === true ? labels.yes : value === false ? labels.no : null;
        default:
            return typeof value === "string" ? value : null;
    }
}
