import { FileTextIcon, ImageIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Answers, AnswerValue, CellValue, TableRow } from "@/lib/forms/answers";
import { localize, type FieldOf, type FormDefinition, type FormField, type TableColumn } from "@/lib/forms/definition";
import { answerText } from "@/lib/forms/answer-text";
import { formatFileSize } from "@/lib/format";

type ViewDocument = { id: string; fileName: string; contentType: string; size: number };

function useCellText() {
    const locale = useLocale();
    const t = useTranslations("ApplicationForm");
    const labels = { yes: t("yes"), no: t("no") };

    return (field: FormField | TableColumn, value: AnswerValue | undefined) => answerText(field, value, locale, labels);
}

function TableView({ field, rows }: { field: FieldOf<"table">; rows: TableRow[] }) {
    const locale = useLocale();
    const cellText = useCellText();

    return (
        <div className="overflow-x-auto rounded-[12px] border border-green/10 bg-white">
            <table className="w-full min-w-max text-left text-[14px]">
                <thead className="bg-green/5 text-green">
                    <tr>
                        {field.columns.map((column) => (
                            <th key={column.id} scope="col" className="px-3 py-2 font-semibold">
                                {localize(column.label, locale)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index} className="border-t border-green/10">
                            {field.columns.map((column) => (
                                <td key={column.id} className="px-3 py-2">
                                    {cellText(column, row[column.id] as CellValue) ?? "—"}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function DocumentLinks({ documents }: { documents: ViewDocument[] }) {
    return (
        <ul className="flex flex-col gap-2">
            {documents.map((document) => (
                <li key={document.id}>
                    <a
                        href={`/api/documents/${document.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-[12px] border border-green/10 bg-white px-3 py-2.5 hover:border-green/30"
                    >
                        <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-green/5 text-green">
                            {document.contentType === "application/pdf" ? <FileTextIcon /> : <ImageIcon />}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px]">{document.fileName}</span>
                            <span className="text-[13px] text-muted-foreground">{formatFileSize(document.size)}</span>
                        </span>
                    </a>
                </li>
            ))}
        </ul>
    );
}

function AnswerValueView({
    field,
    value,
    documents,
}: {
    field: FormField;
    value: AnswerValue | undefined;
    documents: ViewDocument[];
}) {
    const t = useTranslations("ApplicationForm");
    const cellText = useCellText();
    const empty = <span className="text-muted-foreground">{t("noAnswer")}</span>;

    if (field.type === "document") {
        const ids = Array.isArray(value) ? value : [];
        const attached = documents.filter((document) => (ids as unknown[]).includes(document.id));
        return attached.length > 0 ? <DocumentLinks documents={attached} /> : empty;
    }

    if (field.type === "table") {
        const rows = Array.isArray(value) ? (value as TableRow[]) : [];
        return rows.length > 0 ? <TableView field={field} rows={rows} /> : empty;
    }

    const text = cellText(field, value);
    return text ? <span className="whitespace-pre-wrap">{text}</span> : empty;
}

export function AnswersView({
    definition,
    answers,
    documents,
}: {
    definition: FormDefinition;
    answers: Answers;
    documents: ViewDocument[];
}) {
    const locale = useLocale();

    return (
        <div className="flex flex-col gap-6">
            {definition.sections.map((section) => (
                <section
                    key={section.id}
                    className="rounded-[18px] border border-green/10 bg-field p-[clamp(20px,2.6vw,32px)]"
                >
                    <h2 className="display m-0 text-[24px] text-green">{localize(section.title, locale)}</h2>
                    <dl className="mt-4 flex flex-col divide-y divide-green/10">
                        {section.fields.map((field) => (
                            <div
                                key={field.id}
                                className="grid gap-1 py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6"
                            >
                                <dt className="text-[14px] font-semibold text-[#4A5451]">{localize(field.label, locale)}</dt>
                                <dd className="m-0 min-w-0 text-[15px]">
                                    <AnswerValueView field={field} value={answers[field.id]} documents={documents} />
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>
            ))}
        </div>
    );
}
