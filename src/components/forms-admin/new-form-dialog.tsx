"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Controller, useForm, type Control } from "react-hook-form";
import { toast } from "sonner";
import { errorMessage } from "@/components/applications/error-message";
import { FormFieldError } from "@/components/form/form-field-error";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "@/i18n/navigation";
import { createFormSchema } from "@/lib/forms/builder.schemas";
import type { FormMeta } from "@/lib/forms/definition";
import { useTRPC } from "@/trpc/client";

const EMPTY: FormMeta = { slug: "", code: "", titleEn: "", titleGu: "", summaryEn: "", summaryGu: "" };

function slugify(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
}

function TextField({
    control,
    name,
    label,
    help,
    transform,
    onValue,
}: {
    control: Control<FormMeta>;
    name: keyof FormMeta;
    label: string;
    help?: string;
    transform?: (value: string) => string;
    onValue?: (value: string) => void;
}) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`new-form-${name}`}>{label}</FieldLabel>
                    {help && <FieldDescription>{help}</FieldDescription>}
                    <Input
                        {...field}
                        id={`new-form-${name}`}
                        onChange={(event) => {
                            const value = transform ? transform(event.target.value) : event.target.value;
                            field.onChange(value);
                            onValue?.(value);
                        }}
                        aria-invalid={fieldState.invalid}
                    />
                    <FormFieldError error={fieldState.error} />
                </Field>
            )}
        />
    );
}

export function NewFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const t = useTranslations("FormsAdmin.create");
    const tc = useTranslations("Common");
    const router = useRouter();
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const create = useMutation(trpc.formsAdmin.create.mutationOptions());
    const [navigating, startNavigation] = useTransition();
    const creating = create.isPending || (create.isSuccess && navigating);

    const form = useForm<FormMeta>({ resolver: zodResolver(createFormSchema), defaultValues: EMPTY });

    async function onSubmit(values: FormMeta) {
        try {
            const created = await create.mutateAsync(values);
            toast.success(t("created"));
            await queryClient.invalidateQueries({ queryKey: trpc.formsAdmin.list.queryKey() });
            startNavigation(() => router.push(`/forms/${created.id}`));
        } catch (error) {
            toast.error(errorMessage(error, tc("genericError")));
        }
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !creating && onOpenChange(next)}>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-heading text-[24px] text-green">{t("title")}</DialogTitle>
                    <DialogDescription>{t("description")}</DialogDescription>
                </DialogHeader>
                <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
                    <FieldGroup className="gap-4">
                        <TextField
                            control={form.control}
                            name="titleEn"
                            label={t("titleEn")}
                            onValue={(value) => {
                                if (!form.getFieldState("slug").isDirty) form.setValue("slug", slugify(value));
                            }}
                        />
                        <TextField control={form.control} name="titleGu" label={t("titleGu")} />
                        <TextField control={form.control} name="summaryEn" label={t("summaryEn")} />
                        <TextField control={form.control} name="summaryGu" label={t("summaryGu")} />
                        <TextField
                            control={form.control}
                            name="slug"
                            label={t("slug")}
                            help={t("slugHelp")}
                            transform={(value) => value.toLowerCase()}
                        />
                        <TextField
                            control={form.control}
                            name="code"
                            label={t("code")}
                            help={t("codeHelp")}
                            transform={(value) => value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5)}
                        />
                    </FieldGroup>
                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
                            {tc("cancel")}
                        </Button>
                        <Button type="submit" disabled={creating}>
                            {creating && <Spinner data-icon="inline-start" />}
                            {t("submit")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
