"use client";

import { useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useFieldArray, useFormState, type Control, type FieldError } from "react-hook-form";
import { FormFieldError } from "@/components/form/form-field-error";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { Answers, TableRow } from "@/lib/forms/answers";
import { localize, type FieldOf, type FormField, type TableColumn } from "@/lib/forms/definition";

const RADIO_LIMIT = 5;

type InputField = Exclude<FormField, FieldOf<"document" | "table">>;

type ControlProps = {
    field: InputField | TableColumn;
    name: string;
    control: Control<Answers>;
    disabled?: boolean;
};

function FieldLabelText({ field }: { field: InputField | TableColumn }) {
    const locale = useLocale();
    const t = useTranslations("ApplicationForm");

    return (
        <>
            {localize(field.label, locale)}
            {!field.required && <span className="font-normal text-muted-foreground">{t("optional")}</span>}
        </>
    );
}

function NumberInput({
    value,
    onChange,
    money,
    integer,
    allowNegative,
    ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
    value: unknown;
    onChange: (value: number | null) => void;
    money?: boolean;
    integer?: boolean;
    allowNegative?: boolean;
}) {
    const [text, setText] = useState(() => {
        if (typeof value !== "number") return "";
        return String(money ? value / 100 : value);
    });

    function handleChange(raw: string) {
        const whole = money || integer;
        let cleaned = raw.replace(whole ? /[^\d-]/g : /[^\d.-]/g, "");
        cleaned = (allowNegative && cleaned.startsWith("-") ? "-" : "") + cleaned.replace(/-/g, "");
        const [head, ...rest] = cleaned.split(".");
        if (rest.length > 0) cleaned = `${head}.${rest.join("")}`;

        setText(cleaned);

        const parsed = Number(cleaned);
        if (cleaned === "" || cleaned === "-" || cleaned === "." || Number.isNaN(parsed)) {
            onChange(null);
        } else {
            onChange(money ? Math.round(parsed * 100) : parsed);
        }
    }

    return (
        <div className="relative">
            {money && (
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">₹</span>
            )}
            <Input
                {...props}
                value={text}
                inputMode={money || integer ? "numeric" : "decimal"}
                className={money ? "pl-7" : undefined}
                onChange={(event) => handleChange(event.target.value)}
            />
        </div>
    );
}

export function AnswerControl({ field, name, control, disabled }: ControlProps) {
    const locale = useLocale();
    const t = useTranslations("ApplicationForm");
    const id = `answer-${name.replace(/\./g, "-")}`;

    return (
        <Controller
            name={name}
            control={control}
            render={({ field: input, fieldState }) => {
                const help = "help" in field ? localize(field.help, locale) : "";
                const invalid = fieldState.invalid;
                const label = (
                    <FieldLabel htmlFor={id}>
                        <FieldLabelText field={field} />
                    </FieldLabel>
                );
                const description = help ? <FieldDescription>{help}</FieldDescription> : null;
                const error = invalid ? <FormFieldError error={fieldState.error} /> : null;

                switch (field.type) {
                    case "short_text":
                    case "long_text": {
                        const Control = field.type === "long_text" ? Textarea : Input;
                        return (
                            <Field data-invalid={invalid}>
                                {label}
                                {description}
                                <Control
                                    id={id}
                                    name={input.name}
                                    ref={input.ref}
                                    value={typeof input.value === "string" ? input.value : ""}
                                    onChange={(event) => input.onChange(event.target.value)}
                                    onBlur={input.onBlur}
                                    disabled={disabled}
                                    aria-invalid={invalid}
                                />
                                {error}
                            </Field>
                        );
                    }
                    case "number":
                        return (
                            <Field data-invalid={invalid}>
                                {label}
                                {description}
                                <NumberInput
                                    id={id}
                                    name={input.name}
                                    ref={input.ref}
                                    value={input.value}
                                    onChange={input.onChange}
                                    onBlur={input.onBlur}
                                    disabled={disabled}
                                    money={field.money}
                                    integer={field.integer}
                                    allowNegative={field.min === undefined || field.min < 0}
                                    aria-invalid={invalid}
                                />
                                {error}
                            </Field>
                        );
                    case "date":
                        return (
                            <Field data-invalid={invalid}>
                                {label}
                                {description}
                                <Input
                                    id={id}
                                    type="date"
                                    name={input.name}
                                    ref={input.ref}
                                    value={typeof input.value === "string" ? input.value : ""}
                                    onChange={(event) => input.onChange(event.target.value)}
                                    onBlur={input.onBlur}
                                    disabled={disabled}
                                    className="w-fit min-w-44"
                                    aria-invalid={invalid}
                                />
                                {error}
                            </Field>
                        );
                    case "choice": {
                        const value = typeof input.value === "string" ? input.value : "";

                        if (field.options.length <= RADIO_LIMIT) {
                            return (
                                <FieldSet data-invalid={invalid}>
                                    <FieldLegend variant="label">
                                        <FieldLabelText field={field} />
                                    </FieldLegend>
                                    {description}
                                    <RadioGroup
                                        name={input.name}
                                        ref={input.ref}
                                        value={value}
                                        onValueChange={input.onChange}
                                        disabled={disabled}
                                        aria-invalid={invalid}
                                    >
                                        {field.options.map((option) => (
                                            <Field orientation="horizontal" key={option.value}>
                                                <RadioGroupItem
                                                    id={`${id}-${option.value}`}
                                                    value={option.value}
                                                    aria-invalid={invalid}
                                                />
                                                <FieldLabel htmlFor={`${id}-${option.value}`} className="font-normal">
                                                    {localize(option.label, locale)}
                                                </FieldLabel>
                                            </Field>
                                        ))}
                                    </RadioGroup>
                                    {error}
                                </FieldSet>
                            );
                        }

                        return (
                            <Field data-invalid={invalid}>
                                {label}
                                {description}
                                <NativeSelect
                                    id={id}
                                    name={input.name}
                                    ref={input.ref}
                                    value={value}
                                    onChange={(event) => input.onChange(event.target.value)}
                                    onBlur={input.onBlur}
                                    disabled={disabled}
                                    className="w-full sm:w-80"
                                    aria-invalid={invalid}
                                >
                                    <NativeSelectOption value="">{t("choose")}</NativeSelectOption>
                                    {field.options.map((option) => (
                                        <NativeSelectOption key={option.value} value={option.value}>
                                            {localize(option.label, locale)}
                                        </NativeSelectOption>
                                    ))}
                                </NativeSelect>
                                {error}
                            </Field>
                        );
                    }
                    case "yes_no": {
                        const value = input.value === true ? "yes" : input.value === false ? "no" : "";

                        return (
                            <FieldSet data-invalid={invalid}>
                                <FieldLegend variant="label">
                                    <FieldLabelText field={field} />
                                </FieldLegend>
                                {description}
                                <RadioGroup
                                    name={input.name}
                                    ref={input.ref}
                                    value={value}
                                    onValueChange={(next) => input.onChange(next === "yes")}
                                    disabled={disabled}
                                    className="flex gap-6"
                                    aria-invalid={invalid}
                                >
                                    {(["yes", "no"] as const).map((option) => (
                                        <Field orientation="horizontal" key={option} className="w-auto">
                                            <RadioGroupItem id={`${id}-${option}`} value={option} aria-invalid={invalid} />
                                            <FieldLabel htmlFor={`${id}-${option}`} className="font-normal">
                                                {t(option)}
                                            </FieldLabel>
                                        </Field>
                                    ))}
                                </RadioGroup>
                                {error}
                            </FieldSet>
                        );
                    }
                }
            }}
        />
    );
}

function emptyRow(columns: TableColumn[]): TableRow {
    return Object.fromEntries(
        columns.map((column) => [column.id, column.type === "number" || column.type === "yes_no" ? null : ""]),
    );
}

export function TableAnswer({
    field,
    control,
    disabled,
}: {
    field: FieldOf<"table">;
    control: Control<Answers>;
    disabled?: boolean;
}) {
    const locale = useLocale();
    const t = useTranslations("ApplicationForm");
    const rows = useFieldArray({ control, name: field.id as never, keyName: "_key" });
    const { errors } = useFormState({ control, name: field.id });
    const tableError = errors[field.id] as (FieldError & { root?: FieldError }) | undefined;
    const rootError = tableError?.root ?? (tableError?.message ? tableError : undefined);

    return (
        <FieldSet data-invalid={Boolean(rootError)}>
            <FieldLegend variant="label">
                {localize(field.label, locale)}
                {!field.required && <span className="font-normal text-muted-foreground"> {t("optional")}</span>}
            </FieldLegend>
            {field.help && localize(field.help, locale) && (
                <FieldDescription>{localize(field.help, locale)}</FieldDescription>
            )}

            {rows.fields.length === 0 && <p className="text-[15px] text-muted-foreground">{t("noRows")}</p>}

            <div className="flex flex-col gap-3">
                {rows.fields.map((row, index) => (
                    <div key={row._key} className="rounded-[12px] border border-green/10 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <span className="text-[14px] font-semibold text-green">
                                {t("row", { number: index + 1 })}
                            </span>
                            {!disabled && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => rows.remove(index)}
                                    aria-label={t("removeRow")}
                                >
                                    <Trash2Icon data-icon="inline-start" />
                                    {t("removeRow")}
                                </Button>
                            )}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {field.columns.map((column) => (
                                <AnswerControl
                                    key={column.id}
                                    field={column}
                                    name={`${field.id}.${index}.${column.id}`}
                                    control={control}
                                    disabled={disabled}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {!disabled && rows.fields.length < field.maxRows && (
                <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    onClick={() => rows.append(emptyRow(field.columns) as never)}
                >
                    <PlusIcon data-icon="inline-start" />
                    {t("addRow")}
                </Button>
            )}
            {rootError && <FormFieldError error={rootError} />}
        </FieldSet>
    );
}
