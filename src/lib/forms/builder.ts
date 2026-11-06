import type { FieldType, FormDefinition, FormField, FormSection, LocalizedText, TableColumn } from "./definition";

export function newId(prefix: "s" | "q" | "o" | "c") {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    return `${prefix}_${Array.from(bytes, (byte) => (byte % 36).toString(36)).join("")}`;
}

const emptyText = (): LocalizedText => ({ en: "", gu: "" });

function choiceOptions() {
    return [{ value: newId("o"), label: emptyText() }];
}

export function blankColumn(type: TableColumn["type"] = "short_text"): TableColumn {
    return convertColumn({ id: newId("c"), type: "short_text", label: emptyText(), required: false }, type);
}

export function convertColumn(column: TableColumn, type: TableColumn["type"]): TableColumn {
    const base = { id: column.id, label: column.label, help: column.help, required: column.required };

    switch (type) {
        case "number":
            return { ...base, type, min: 0 };
        case "choice":
            return { ...base, type, options: column.type === "choice" ? column.options : choiceOptions() };
        default:
            return { ...base, type };
    }
}

export function convertField(field: FormField, type: FieldType): FormField {
    const base = { id: field.id, label: field.label, help: field.help, required: field.required };

    switch (type) {
        case "short_text":
        case "long_text":
            return { ...base, type };
        case "number":
            return { ...base, type, min: 0 };
        case "choice":
            return { ...base, type, options: field.type === "choice" ? field.options : choiceOptions() };
        case "document":
            return { ...base, type, maxFiles: 3 };
        case "table":
            return { ...base, type, columns: [blankColumn()], minRows: 0, maxRows: 10 };
        default:
            return { ...base, type };
    }
}

export function blankField(type: FieldType = "short_text"): FormField {
    return convertField({ id: newId("q"), type: "short_text", label: emptyText(), help: emptyText(), required: true }, type);
}

export function blankSection(): FormSection {
    return { id: newId("s"), title: emptyText(), description: emptyText(), fields: [blankField()] };
}

export function starterDefinition(): FormDefinition {
    return {
        sections: [
            {
                id: "applicant",
                title: { en: "Applicant details", gu: "અરજદારની વિગતો" },
                description: emptyText(),
                fields: [
                    {
                        id: "applicant_name",
                        type: "short_text",
                        label: { en: "Applicant's full name", gu: "અરજદારનું પૂરું નામ" },
                        required: true,
                        prefill: "name",
                    },
                ],
            },
        ],
    };
}
