"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { InfoIcon, PlusIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, FormProvider, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { errorMessage } from "@/components/applications/error-message";
import { FormFieldError } from "@/components/form/form-field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "@/i18n/navigation";
import { blankSection } from "@/lib/forms/builder";
import { formDefinitionSchema, formDetailsSchema, MAX_SECTIONS, type FormDefinition } from "@/lib/forms/definition";
import { formatDateTime } from "@/lib/format";
import { useTRPC } from "@/trpc/client";
import type { AppRouter } from "@/trpc/routers/_app";
import { SectionEditor } from "./section-editor";

type EditorData = inferRouterOutputs<AppRouter>["formsAdmin"]["get"];
type Details = z.infer<typeof formDetailsSchema>;

const blankText = { en: "", gu: "" };

function withEmptyTexts(definition: FormDefinition): FormDefinition {
    return {
        sections: definition.sections.map((section) => ({
            ...section,
            description: section.description ?? blankText,
            fields: section.fields.map((field) => ({ ...field, help: field.help ?? blankText })),
        })),
    };
}

function DetailsCard({ data }: { data: EditorData }) {
    const t = useTranslations("FormsAdmin.editor");
    const tn = useTranslations("FormsAdmin.create");
    const tc = useTranslations("Common");
    const router = useRouter();
    const trpc = useTRPC();
    const update = useMutation(trpc.formsAdmin.updateDetails.mutationOptions());

    const form = useForm<Details>({
        resolver: zodResolver(formDetailsSchema),
        defaultValues: {
            titleEn: data.titleEn,
            titleGu: data.titleGu,
            summaryEn: data.summaryEn,
            summaryGu: data.summaryGu,
        },
    });

    async function onSubmit(values: Details) {
        try {
            await update.mutateAsync({ id: data.id, ...values });
            toast.success(t("detailsSaved"));
            form.reset(values);
            router.refresh();
        } catch (error) {
            toast.error(errorMessage(error, tc("genericError")));
        }
    }

    const fields: { name: keyof Details; label: string }[] = [
        { name: "titleEn", label: tn("titleEn") },
        { name: "titleGu", label: tn("titleGu") },
        { name: "summaryEn", label: tn("summaryEn") },
        { name: "summaryGu", label: tn("summaryGu") },
    ];

    return (
        <section className="rounded-[18px] border border-green/10 bg-field p-[clamp(16px,2.4vw,28px)]">
            <h2 className="display m-0 text-[24px] text-green">{t("detailsTitle")}</h2>
            <p className="mt-1 text-[14px] text-muted-foreground">
                {t("slug")}: <span className="font-mono">{data.slug}</span> · {t("code")}:{" "}
                <span className="font-mono">{data.code}</span>
            </p>
            <form noValidate className="mt-4" onSubmit={form.handleSubmit(onSubmit)}>
                <fieldset disabled={!data.canWrite} className="min-w-0">
                    <FieldGroup className="gap-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {fields.map(({ name, label }) => (
                                <Controller
                                    key={name}
                                    name={name}
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor={`details-${name}`}>{label}</FieldLabel>
                                            <Input {...field} id={`details-${name}`} aria-invalid={fieldState.invalid} />
                                            <FormFieldError error={fieldState.error} />
                                        </Field>
                                    )}
                                />
                            ))}
                        </div>
                        {data.canWrite && (
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-fit"
                                disabled={update.isPending || !form.formState.isDirty}
                            >
                                {update.isPending && <Spinner data-icon="inline-start" />}
                                {t("saveDetails")}
                            </Button>
                        )}
                    </FieldGroup>
                </fieldset>
            </form>
        </section>
    );
}

export function FormEditor({ data }: { data: EditorData }) {
    const t = useTranslations("FormsAdmin.editor");
    const ts = useTranslations("FormsAdmin.section");
    const tc = useTranslations("Common");
    const locale = useLocale();
    const router = useRouter();
    const trpc = useTRPC();
    const saveDraft = useMutation(trpc.formsAdmin.saveDraft.mutationOptions());
    const publish = useMutation(trpc.formsAdmin.publish.mutationOptions());
    const discard = useMutation(trpc.formsAdmin.discardDraft.mutationOptions());
    const [confirming, setConfirming] = useState<"publish" | "discard" | null>(null);
    const [pending, setPending] = useState<FormDefinition | null>(null);

    const readOnly = !data.canWrite;
    const busy = saveDraft.isPending || publish.isPending || discard.isPending;

    const form = useForm<FormDefinition>({
        resolver: zodResolver(formDefinitionSchema),
        defaultValues: withEmptyTexts(data.definition),
        mode: "onTouched",
    });
    const sections = useFieldArray({ control: form.control, name: "sections", keyName: "_key" });

    const invalid = () => toast.error(t("fixErrors"));

    async function onSaveDraft(definition: FormDefinition) {
        try {
            await saveDraft.mutateAsync({ id: data.id, definition });
            toast.success(t("draftSaved"));
            router.refresh();
        } catch (error) {
            toast.error(errorMessage(error, tc("genericError")));
        }
    }

    async function onPublish() {
        if (!pending) return;

        try {
            const result = await publish.mutateAsync({ id: data.id, definition: pending });
            toast.success(t("published", { version: result.version }));
            router.refresh();
        } catch (error) {
            toast.error(errorMessage(error, tc("genericError")));
        } finally {
            setConfirming(null);
            setPending(null);
        }
    }

    async function onDiscard() {
        try {
            await discard.mutateAsync({ id: data.id });
            toast.success(t("discarded"));
            router.refresh();
        } catch (error) {
            toast.error(errorMessage(error, tc("genericError")));
        } finally {
            setConfirming(null);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <DetailsCard data={data} />

            <Alert>
                <InfoIcon />
                <AlertDescription>
                    {readOnly && <p>{t("readOnly")}</p>}
                    <p>
                        {data.publishedVersion
                            ? t("publishedInfo", { version: data.publishedVersion })
                            : t("neverPublished")}
                    </p>
                    {data.draft && <p>{t("draftInfo", { date: formatDateTime(data.draft.updatedAt, locale) })}</p>}
                </AlertDescription>
            </Alert>

            <FormProvider {...form}>
                <form
                    noValidate
                    className="flex flex-col gap-6"
                    onSubmit={form.handleSubmit((definition) => void onSaveDraft(definition), invalid)}
                >
                    <h2 className="display m-0 text-[26px] text-green">{t("questionsTitle")}</h2>

                    {sections.fields.map((section, index) => (
                        <SectionEditor
                            key={section._key}
                            index={index}
                            count={sections.fields.length}
                            lockedTypes={data.lockedTypes}
                            readOnly={readOnly}
                            onMove={(to) => sections.move(index, to)}
                            onRemove={() => sections.remove(index)}
                        />
                    ))}

                    {!readOnly && sections.fields.length < MAX_SECTIONS && (
                        <Button type="button" variant="outline" className="w-fit" onClick={() => sections.append(blankSection())}>
                            <PlusIcon data-icon="inline-start" />
                            {ts("add")}
                        </Button>
                    )}

                    {!readOnly && (
                        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t border-green/10 bg-background/95 px-1 py-3 backdrop-blur">
                            <Button
                                type="button"
                                size="lg"
                                disabled={busy}
                                onClick={form.handleSubmit((definition) => {
                                    setPending(definition);
                                    setConfirming("publish");
                                }, invalid)}
                            >
                                {publish.isPending && <Spinner data-icon="inline-start" />}
                                {t("publish")}
                            </Button>
                            <Button type="submit" variant="outline" size="lg" disabled={busy}>
                                {saveDraft.isPending && <Spinner data-icon="inline-start" />}
                                {t("saveDraft")}
                            </Button>
                            {data.draft && data.publishedVersion && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="lg"
                                    className="sm:ml-auto"
                                    disabled={busy}
                                    onClick={() => setConfirming("discard")}
                                >
                                    {t("discard")}
                                </Button>
                            )}
                        </div>
                    )}
                </form>
            </FormProvider>

            <AlertDialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirming === "discard" ? t("discardTitle") : t("publishTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirming === "discard" ? t("discardText") : t("publishText")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={busy}>{tc("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            variant={confirming === "discard" ? "destructive" : "default"}
                            disabled={busy}
                            onClick={() => void (confirming === "discard" ? onDiscard() : onPublish())}
                        >
                            {busy && <Spinner data-icon="inline-start" />}
                            {confirming === "discard" ? t("discard") : t("publish")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
