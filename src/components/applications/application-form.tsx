"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm, type FieldError } from "react-hook-form";
import { toast } from "sonner";
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
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "@/i18n/navigation";
import { buildAnswersSchema, emptyAnswers, type Answers } from "@/lib/forms/answers";
import { localize, type FormDefinition } from "@/lib/forms/definition";
import { useTRPC } from "@/trpc/client";
import { AnswerControl, TableAnswer } from "./answer-fields";
import { DocumentField, type UploadedDocument } from "./document-field";
import { errorMessage } from "./error-message";

export function ApplicationForm({
    applicationId,
    status,
    definition,
    initialAnswers,
    initialDocuments,
    uploadsAvailable,
}: {
    applicationId: string;
    status: string;
    definition: FormDefinition;
    initialAnswers: Answers;
    initialDocuments: UploadedDocument[];
    uploadsAvailable: boolean;
}) {
    const locale = useLocale();
    const t = useTranslations("ApplicationForm");
    const tc = useTranslations("Common");
    const router = useRouter();
    const trpc = useTRPC();
    const saveDraft = useMutation(trpc.applications.saveDraft.mutationOptions());
    const submit = useMutation(trpc.applications.submit.mutationOptions());
    const discard = useMutation(trpc.applications.discard.mutationOptions());

    const [documents, setDocuments] = useState(initialDocuments);
    const [confirmingSubmit, setConfirmingSubmit] = useState<Answers | null>(null);
    const [confirmingDiscard, setConfirmingDiscard] = useState(false);
    const [navigating, startNavigation] = useTransition();

    const documentsOnly = status === "documents_required";
    const schema = useMemo(() => buildAnswersSchema(definition, "submit"), [definition]);

    const form = useForm<Answers>({
        resolver: zodResolver(schema),
        defaultValues: { ...emptyAnswers(definition), ...initialAnswers },
        mode: "onTouched",
    });

    const submitting = submit.isPending || (submit.isSuccess && navigating);
    const discarding = discard.isPending || (discard.isSuccess && navigating);
    const busy = saveDraft.isPending || submitting || discarding;

    async function save({ quiet }: { quiet: boolean }) {
        try {
            await saveDraft.mutateAsync({ id: applicationId, answers: form.getValues() });
            if (!quiet) toast.success(t("saved"));
        } catch (error) {
            toast.error(errorMessage(error, t("saveError")));
        }
    }

    async function confirmSubmit() {
        if (!confirmingSubmit) return;

        try {
            const result = await submit.mutateAsync({ id: applicationId, answers: confirmingSubmit });
            toast.success(t("submitted", { number: result.number }));
            startNavigation(() => router.refresh());
        } catch (error) {
            setConfirmingSubmit(null);
            toast.error(errorMessage(error, tc("genericError")));
        }
    }

    async function confirmDiscard() {
        try {
            await discard.mutateAsync({ id: applicationId });
            toast.success(t("discarded"));
            startNavigation(() => router.push("/my-applications"));
        } catch (error) {
            setConfirmingDiscard(false);
            toast.error(errorMessage(error, tc("genericError")));
        }
    }

    return (
        <form
            noValidate
            onSubmit={form.handleSubmit(
                (values) => setConfirmingSubmit(values),
                () => toast.error(t("fixErrors")),
            )}
            className="flex flex-col gap-6"
        >
            {documentsOnly && (
                <Alert>
                    <InfoIcon />
                    <AlertDescription>{t("documentsOnlyHint")}</AlertDescription>
                </Alert>
            )}

            {definition.sections.map((section) => (
                <section
                    key={section.id}
                    className="rise rounded-[18px] border border-green/10 bg-field p-[clamp(20px,2.6vw,36px)]"
                >
                    <FieldSet>
                        <FieldLegend className="font-heading font-medium text-green data-[variant=legend]:text-[26px]">
                            {localize(section.title, locale)}
                        </FieldLegend>
                        {section.description && localize(section.description, locale) && (
                            <FieldDescription>{localize(section.description, locale)}</FieldDescription>
                        )}
                        <FieldGroup>
                            {section.fields.map((field) => {
                                if (field.type === "table") {
                                    return (
                                        <TableAnswer
                                            key={field.id}
                                            field={field}
                                            control={form.control}
                                            disabled={documentsOnly}
                                        />
                                    );
                                }

                                if (field.type === "document") {
                                    return (
                                        <Controller
                                            key={field.id}
                                            name={field.id}
                                            control={form.control}
                                            render={({ field: input, fieldState }) => {
                                                const value = Array.isArray(input.value) ? (input.value as string[]) : [];

                                                return (
                                                    <DocumentField
                                                        field={field}
                                                        applicationId={applicationId}
                                                        value={value}
                                                        documents={documents}
                                                        uploadsAvailable={uploadsAvailable}
                                                        error={fieldState.error as FieldError | undefined}
                                                        onUploaded={(document) => {
                                                            setDocuments((current) => [...current, document]);
                                                            input.onChange([...value, document.id]);
                                                            void save({ quiet: true });
                                                        }}
                                                        onRemoved={(document) => {
                                                            setDocuments((current) =>
                                                                current.filter((item) => item.id !== document.id),
                                                            );
                                                            input.onChange(value.filter((id) => id !== document.id));
                                                        }}
                                                        onReplaced={(previous, next) => {
                                                            setDocuments((current) => [
                                                                ...current.filter((item) => item.id !== previous.id),
                                                                next,
                                                            ]);
                                                            input.onChange(
                                                                value.map((id) => (id === previous.id ? next.id : id)),
                                                            );
                                                            void save({ quiet: true });
                                                        }}
                                                    />
                                                );
                                            }}
                                        />
                                    );
                                }

                                return (
                                    <AnswerControl
                                        key={field.id}
                                        field={field}
                                        name={field.id}
                                        control={form.control}
                                        disabled={documentsOnly}
                                    />
                                );
                            })}
                        </FieldGroup>
                    </FieldSet>
                </section>
            ))}

            <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t border-green/10 bg-background/95 px-1 py-3 backdrop-blur">
                <Button type="submit" size="lg" disabled={busy}>
                    {submitting && <Spinner data-icon="inline-start" />}
                    {t("submit")}
                </Button>
                <Button type="button" variant="outline" size="lg" disabled={busy} onClick={() => void save({ quiet: false })}>
                    {saveDraft.isPending && <Spinner data-icon="inline-start" />}
                    {t("saveDraft")}
                </Button>
                {status === "draft" && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        className="sm:ml-auto"
                        disabled={busy}
                        onClick={() => setConfirmingDiscard(true)}
                    >
                        {t("discard")}
                    </Button>
                )}
            </div>

            <AlertDialog
                open={Boolean(confirmingSubmit)}
                onOpenChange={(open) => !open && !submitting && setConfirmingSubmit(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("submitTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("submitText")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>{tc("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={submitting}
                            onClick={(event) => {
                                event.preventDefault();
                                void confirmSubmit();
                            }}
                        >
                            {submitting && <Spinner data-icon="inline-start" />}
                            {t("submit")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={confirmingDiscard} onOpenChange={(open) => !discarding && setConfirmingDiscard(open)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("discardTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("discardText")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={discarding}>{tc("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={discarding}
                            onClick={(event) => {
                                event.preventDefault();
                                void confirmDiscard();
                            }}
                        >
                            {discarding && <Spinner data-icon="inline-start" />}
                            {t("discard")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </form>
    );
}
