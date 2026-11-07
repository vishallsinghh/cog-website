"use client";

import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, get, useFieldArray, useFormContext, useFormState } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { blankField, convertField } from "@/lib/forms/builder";
import {
    FIELD_TYPES,
    localize,
    MAX_FIELDS_PER_SECTION,
    type FieldType,
    type FormDefinition,
    type FormField,
    type LocalizedText,
} from "@/lib/forms/definition";
import { cn } from "@/lib/utils";
import { CheckboxInput, LocalizedInputs, useDefinitionValue } from "./editor-inputs";
import { TypeSettings } from "./type-settings";

type Mover = { index: number; count: number; onMove: (to: number) => void; onRemove: () => void };

function MoveButtons({
    index,
    count,
    onMove,
    onRemove,
    labels,
}: Mover & { labels: { up: string; down: string; remove: string } }) {
    return (
        <div className="flex gap-1">
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={index === 0}
                onClick={() => onMove(index - 1)}
                aria-label={labels.up}
            >
                <ArrowUpIcon />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={index === count - 1}
                onClick={() => onMove(index + 1)}
                aria-label={labels.down}
            >
                <ArrowDownIcon />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={count === 1}
                onClick={onRemove}
                aria-label={labels.remove}
            >
                <Trash2Icon />
            </Button>
        </div>
    );
}

function QuestionEditor({
    path,
    lockedType,
    readOnly,
    defaultOpen,
    onTypeChange,
    ...mover
}: Mover & {
    path: string;
    lockedType?: FieldType;
    readOnly: boolean;
    defaultOpen: boolean;
    onTypeChange: (type: FieldType) => void;
}) {
    const t = useTranslations("FormsAdmin.question");
    const tt = useTranslations("FormsAdmin.types");
    const locale = useLocale();
    const { control } = useFormContext<FormDefinition>();
    const [open, setOpen] = useState(defaultOpen);
    const label = useDefinitionValue<LocalizedText | undefined>(`${path}.label`);
    const type = useDefinitionValue<FieldType>(`${path}.type`);
    const required = useDefinitionValue<boolean | undefined>(`${path}.required`) === true;
    const { errors } = useFormState({ control, name: path as never });
    const invalid = Boolean(get(errors, path));
    const expanded = open || invalid;
    const typeId = `builder-${path.replace(/\./g, "-")}-type`;

    return (
        <div
            className={cn(
                "rounded-[12px] border bg-white",
                invalid ? "border-destructive/50" : "border-green/10",
            )}
        >
            <div className="flex items-center gap-2 p-3">
                <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    aria-expanded={expanded}
                    onClick={() => setOpen(!expanded)}
                >
                    <ChevronDownIcon
                        className={cn("size-4 flex-none text-muted-foreground transition-transform", expanded && "rotate-180")}
                        aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium">
                            {localize(label, locale) || t("untitled")}
                        </span>
                        <span className="text-[13px] text-muted-foreground">{tt(type)}</span>
                    </span>
                    {required && <Badge variant="secondary">{t("requiredBadge")}</Badge>}
                </button>
                {!readOnly && (
                    <MoveButtons
                        {...mover}
                        labels={{ up: t("moveUp"), down: t("moveDown"), remove: t("remove") }}
                    />
                )}
            </div>

            {expanded && (
                <fieldset disabled={readOnly} className="flex min-w-0 flex-col gap-4 border-t border-green/10 p-4">
                    <LocalizedInputs control={control} name={`${path}.label`} labelEn={t("labelEn")} labelGu={t("labelGu")} />
                    <LocalizedInputs
                        control={control}
                        name={`${path}.help`}
                        labelEn={t("helpEn")}
                        labelGu={t("helpGu")}
                        multiline
                    />
                    <div className="flex flex-wrap items-end gap-6">
                        <Controller
                            name={`${path}.type` as never}
                            control={control}
                            render={({ field }) => (
                                <Field className="w-full sm:w-64">
                                    <FieldLabel htmlFor={typeId}>{t("type")}</FieldLabel>
                                    <ResponsiveSelect
                                        id={typeId}
                                        className="w-full"
                                        value={field.value as string}
                                        disabled={Boolean(lockedType)}
                                        onValueChange={(next) => onTypeChange(next as FieldType)}
                                        label={t("type")}
                                        options={FIELD_TYPES.map((value) => ({ value, label: tt(value) }))}
                                    />
                                </Field>
                            )}
                        />
                        <CheckboxInput control={control} name={`${path}.required`} label={t("required")} />
                    </div>
                    {lockedType && <FieldDescription>{t("typeLocked")}</FieldDescription>}
                    <TypeSettings path={path} />
                    <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setOpen(false)}>
                        {t("done")}
                    </Button>
                </fieldset>
            )}
        </div>
    );
}

export function SectionEditor({
    index,
    lockedTypes,
    readOnly,
    ...mover
}: Mover & { lockedTypes: Record<string, FieldType>; readOnly: boolean }) {
    const t = useTranslations("FormsAdmin.section");
    const { control, getValues } = useFormContext<FormDefinition>();
    const path = `sections.${index}`;
    const fields = useFieldArray({ control, name: `${path}.fields` as never, keyName: "_key" });
    const [added, setAdded] = useState<string[]>([]);

    return (
        <section className="flex flex-col gap-4 rounded-[18px] border border-green/10 bg-field p-[clamp(16px,2.4vw,28px)]">
            <div className="flex items-center justify-between gap-2">
                <h3 className="display m-0 text-[22px] text-green">{t("heading", { number: index + 1 })}</h3>
                {!readOnly && (
                    <MoveButtons
                        {...mover}
                        index={index}
                        labels={{ up: t("moveUp"), down: t("moveDown"), remove: t("remove") }}
                    />
                )}
            </div>

            <fieldset disabled={readOnly} className="flex min-w-0 flex-col gap-4">
                <LocalizedInputs control={control} name={`${path}.title`} labelEn={t("titleEn")} labelGu={t("titleGu")} />
                <LocalizedInputs
                    control={control}
                    name={`${path}.description`}
                    labelEn={t("descriptionEn")}
                    labelGu={t("descriptionGu")}
                    multiline
                />
            </fieldset>

            <div className="flex flex-col gap-3">
                {fields.fields.map((field, fieldIndex) => {
                    const id = (field as unknown as FormField).id;

                    return (
                        <QuestionEditor
                            key={field._key}
                            path={`${path}.fields.${fieldIndex}`}
                            index={fieldIndex}
                            count={fields.fields.length}
                            lockedType={lockedTypes[id]}
                            readOnly={readOnly}
                            defaultOpen={added.includes(id)}
                            onMove={(to) => fields.move(fieldIndex, to)}
                            onRemove={() => fields.remove(fieldIndex)}
                            onTypeChange={(type) => {
                                const current = getValues(`${path}.fields.${fieldIndex}` as never) as unknown as FormField;
                                setAdded((ids) => [...ids, current.id]);
                                fields.update(fieldIndex, convertField(current, type) as never);
                            }}
                        />
                    );
                })}
            </div>

            {!readOnly && fields.fields.length < MAX_FIELDS_PER_SECTION && (
                <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    onClick={() => {
                        const field = blankField();
                        setAdded((current) => [...current, field.id]);
                        fields.append(field as never);
                    }}
                >
                    <PlusIcon data-icon="inline-start" />
                    {t("addQuestion")}
                </Button>
            )}
        </section>
    );
}
