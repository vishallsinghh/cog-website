"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { blankColumn, convertColumn, newId } from "@/lib/forms/builder";
import {
    MAX_CHOICE_OPTIONS,
    MAX_TABLE_COLUMNS,
    PREFILL_SOURCES,
    TABLE_COLUMN_TYPES,
    type FieldType,
    type FormDefinition,
    type TableColumn,
} from "@/lib/forms/definition";
import { CheckboxInput, LocalizedInputs, NumberInput, useDefinitionValue } from "./editor-inputs";

function PrefillSelect({ path }: { path: string }) {
    const t = useTranslations("FormsAdmin.question");
    const ts = useTranslations("FormsAdmin.prefillSources");
    const { control } = useFormContext<FormDefinition>();
    const id = `builder-${path.replace(/\./g, "-")}-prefill`;

    return (
        <Controller
            name={`${path}.prefill` as never}
            control={control}
            render={({ field }) => (
                <Field>
                    <FieldLabel htmlFor={id}>{t("prefill")}</FieldLabel>
                    <ResponsiveSelect
                        id={id}
                        className="w-full sm:w-72"
                        name={field.name}
                        ref={field.ref}
                        value={typeof field.value === "string" ? field.value : ""}
                        onValueChange={(next) => field.onChange(next || undefined)}
                        onBlur={field.onBlur}
                        label={t("prefill")}
                        options={[
                            { value: "", label: t("noPrefill") },
                            ...PREFILL_SOURCES.map((source) => ({ value: source, label: ts(source) })),
                        ]}
                    />
                </Field>
            )}
        />
    );
}

function OptionsEditor({ path }: { path: string }) {
    const t = useTranslations("FormsAdmin.question");
    const { control } = useFormContext<FormDefinition>();
    const options = useFieldArray({ control, name: `${path}.options` as never, keyName: "_key" });

    return (
        <FieldSet>
            <FieldLegend variant="label">{t("options")}</FieldLegend>
            <div className="flex flex-col gap-3">
                {options.fields.map((option, index) => (
                    <div key={option._key} className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                            <LocalizedInputs
                                control={control}
                                name={`${path}.options.${index}.label`}
                                labelEn={t("optionEn")}
                                labelGu={t("optionGu")}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="mt-7"
                            disabled={options.fields.length === 1}
                            onClick={() => options.remove(index)}
                            aria-label={t("removeOption")}
                        >
                            <Trash2Icon />
                        </Button>
                    </div>
                ))}
            </div>
            {options.fields.length < MAX_CHOICE_OPTIONS && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => options.append({ value: newId("o"), label: { en: "", gu: "" } } as never)}
                >
                    <PlusIcon data-icon="inline-start" />
                    {t("addOption")}
                </Button>
            )}
        </FieldSet>
    );
}

function ColumnsEditor({ path }: { path: string }) {
    const t = useTranslations("FormsAdmin.question");
    const tt = useTranslations("FormsAdmin.types");
    const { control, getValues } = useFormContext<FormDefinition>();
    const columns = useFieldArray({ control, name: `${path}.columns` as never, keyName: "_key" });

    return (
        <FieldSet>
            <FieldLegend variant="label">{t("columns")}</FieldLegend>
            <div className="flex flex-col gap-3">
                {columns.fields.map((column, index) => {
                    const columnPath = `${path}.columns.${index}`;
                    const id = `builder-${columnPath.replace(/\./g, "-")}-type`;

                    return (
                        <div key={column._key} className="flex flex-col gap-4 rounded-[12px] border border-green/10 bg-field p-4">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[14px] font-semibold text-green">
                                    {t("column", { number: index + 1 })}
                                </span>
                                <div className="flex gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        disabled={index === 0}
                                        onClick={() => columns.move(index, index - 1)}
                                        aria-label={t("moveUp")}
                                    >
                                        <ArrowUpIcon />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        disabled={index === columns.fields.length - 1}
                                        onClick={() => columns.move(index, index + 1)}
                                        aria-label={t("moveDown")}
                                    >
                                        <ArrowDownIcon />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        disabled={columns.fields.length === 1}
                                        onClick={() => columns.remove(index)}
                                        aria-label={t("removeColumn")}
                                    >
                                        <Trash2Icon />
                                    </Button>
                                </div>
                            </div>
                            <LocalizedInputs
                                control={control}
                                name={`${columnPath}.label`}
                                labelEn={t("labelEn")}
                                labelGu={t("labelGu")}
                            />
                            <div className="flex flex-wrap items-end gap-6">
                                <Controller
                                    name={`${columnPath}.type` as never}
                                    control={control}
                                    render={({ field }) => (
                                        <Field className="w-full sm:w-56">
                                            <FieldLabel htmlFor={id}>{t("type")}</FieldLabel>
                                            <ResponsiveSelect
                                                id={id}
                                                className="w-full"
                                                value={field.value as string}
                                                onValueChange={(next) => {
                                                    const current = getValues(columnPath as never) as unknown as TableColumn;
                                                    columns.update(
                                                        index,
                                                        convertColumn(current, next as TableColumn["type"]) as never,
                                                    );
                                                }}
                                                label={t("type")}
                                                options={TABLE_COLUMN_TYPES.map((type) => ({ value: type, label: tt(type) }))}
                                            />
                                        </Field>
                                    )}
                                />
                                <CheckboxInput control={control} name={`${columnPath}.required`} label={t("required")} />
                            </div>
                            <TypeSettings path={columnPath} column />
                        </div>
                    );
                })}
            </div>
            {columns.fields.length < MAX_TABLE_COLUMNS && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => columns.append(blankColumn() as never)}
                >
                    <PlusIcon data-icon="inline-start" />
                    {t("addColumn")}
                </Button>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
                <NumberInput control={control} name={`${path}.minRows`} label={t("minRows")} />
                <NumberInput control={control} name={`${path}.maxRows`} label={t("maxRows")} />
            </div>
        </FieldSet>
    );
}

export function TypeSettings({ path, column }: { path: string; column?: boolean }) {
    const t = useTranslations("FormsAdmin.question");
    const { control } = useFormContext<FormDefinition>();
    const type = useDefinitionValue<FieldType>(`${path}.type`);
    const money = useDefinitionValue<boolean | undefined>(`${path}.money`) === true;

    switch (type) {
        case "short_text":
        case "long_text":
            return column ? null : <PrefillSelect path={path} />;
        case "number":
            return (
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-6">
                        <CheckboxInput control={control} name={`${path}.money`} label={t("money")} />
                        <CheckboxInput control={control} name={`${path}.integer`} label={t("integer")} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <NumberInput control={control} name={`${path}.min`} label={t("min")} scale={money ? 100 : 1} />
                        <NumberInput control={control} name={`${path}.max`} label={t("max")} scale={money ? 100 : 1} />
                    </div>
                </div>
            );
        case "choice":
            return <OptionsEditor path={path} />;
        case "document":
            return (
                <div className="sm:w-56">
                    <NumberInput control={control} name={`${path}.maxFiles`} label={t("maxFiles")} />
                </div>
            );
        case "table":
            return <ColumnsEditor path={path} />;
        default:
            return null;
    }
}
