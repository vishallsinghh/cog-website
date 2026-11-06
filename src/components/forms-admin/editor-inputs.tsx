"use client";

import { useState } from "react";
import { Controller, useFormContext, useWatch, type Control } from "react-hook-form";
import { FormFieldError } from "@/components/form/form-field-error";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FormDefinition } from "@/lib/forms/definition";

export type DefinitionControl = Control<FormDefinition>;

export function useDefinitionValue<T>(name: string): T {
    const { control } = useFormContext<FormDefinition>();
    return useWatch({ control, name: name as never }) as unknown as T;
}

const inputId = (name: string) => `builder-${name.replace(/\./g, "-")}`;

export function TextInput({
    control,
    name,
    label,
    multiline,
}: {
    control: DefinitionControl;
    name: string;
    label: string;
    multiline?: boolean;
}) {
    return (
        <Controller
            name={name as never}
            control={control}
            render={({ field, fieldState }) => {
                const Control = multiline ? Textarea : Input;

                return (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={inputId(name)}>{label}</FieldLabel>
                        <Control
                            id={inputId(name)}
                            name={field.name}
                            ref={field.ref}
                            value={typeof field.value === "string" ? field.value : ""}
                            onChange={(event) => field.onChange(event.target.value)}
                            onBlur={field.onBlur}
                            rows={multiline ? 2 : undefined}
                            aria-invalid={fieldState.invalid}
                        />
                        <FormFieldError error={fieldState.error} />
                    </Field>
                );
            }}
        />
    );
}

export function LocalizedInputs({
    control,
    name,
    labelEn,
    labelGu,
    multiline,
}: {
    control: DefinitionControl;
    name: string;
    labelEn: string;
    labelGu: string;
    multiline?: boolean;
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <TextInput control={control} name={`${name}.en`} label={labelEn} multiline={multiline} />
            <TextInput control={control} name={`${name}.gu`} label={labelGu} multiline={multiline} />
        </div>
    );
}

function NumberText({
    value,
    onChange,
    scale,
    ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
    value: unknown;
    onChange: (value: number | undefined) => void;
    scale: number;
}) {
    const [text, setText] = useState(() => (typeof value === "number" ? String(value / scale) : ""));

    return (
        <Input
            {...props}
            inputMode="decimal"
            value={text}
            onChange={(event) => {
                const cleaned = event.target.value.replace(/[^\d.-]/g, "");
                setText(cleaned);
                const parsed = Number(cleaned);
                onChange(cleaned === "" || Number.isNaN(parsed) ? undefined : Math.round(parsed * scale));
            }}
        />
    );
}

export function NumberInput({
    control,
    name,
    label,
    scale = 1,
}: {
    control: DefinitionControl;
    name: string;
    label: string;
    scale?: number;
}) {
    return (
        <Controller
            name={name as never}
            control={control}
            render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={inputId(name)}>{label}</FieldLabel>
                    <NumberText
                        key={scale}
                        id={inputId(name)}
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        scale={scale}
                        aria-invalid={fieldState.invalid}
                    />
                    <FormFieldError error={fieldState.error} />
                </Field>
            )}
        />
    );
}

export function CheckboxInput({
    control,
    name,
    label,
    onCheckedChange,
}: {
    control: DefinitionControl;
    name: string;
    label: string;
    onCheckedChange?: (checked: boolean) => void;
}) {
    return (
        <Controller
            name={name as never}
            control={control}
            render={({ field }) => (
                <Field orientation="horizontal" className="w-auto">
                    <Checkbox
                        id={inputId(name)}
                        name={field.name}
                        ref={field.ref}
                        checked={field.value === true}
                        onCheckedChange={(checked) => {
                            field.onChange(checked === true);
                            onCheckedChange?.(checked === true);
                        }}
                    />
                    <FieldLabel htmlFor={inputId(name)} className="font-normal">
                        {label}
                    </FieldLabel>
                </Field>
            )}
        />
    );
}
