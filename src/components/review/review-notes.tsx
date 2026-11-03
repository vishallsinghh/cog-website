"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { errorMessage } from "@/components/applications/error-message";
import { FormFieldError } from "@/components/form/form-field-error";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { formatDateTime } from "@/lib/format";
import { noteFormSchema } from "@/lib/forms/review.schemas";
import { useTRPC } from "@/trpc/client";

type NoteValues = z.infer<typeof noteFormSchema>;

type Note = { id: string; body: string; createdAt: Date; authorName: string | null };

export function ReviewNotes({ applicationId, notes, canNote }: { applicationId: string; notes: Note[]; canNote: boolean }) {
    const t = useTranslations("Review.notes");
    const tc = useTranslations("Common");
    const locale = useLocale();
    const router = useRouter();
    const trpc = useTRPC();
    const addNote = useMutation(trpc.applicationReview.addNote.mutationOptions());

    const form = useForm<NoteValues>({
        resolver: zodResolver(noteFormSchema),
        defaultValues: { body: "" },
    });

    async function onSubmit(values: NoteValues) {
        try {
            await addNote.mutateAsync({ id: applicationId, ...values });
            toast.success(t("added"));
            form.reset({ body: "" });
            router.refresh();
        } catch (error) {
            toast.error(errorMessage(error, tc("genericError")));
        }
    }

    return (
        <section className="rounded-[18px] border border-green/10 bg-field p-5">
            <h2 className="display m-0 text-[22px] text-green">{t("title")}</h2>
            <p className="mt-1 text-[14px] text-muted-foreground">{t("help")}</p>

            {canNote && (
                <form noValidate className="mt-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <FieldGroup className="gap-3">
                        <Controller
                            name="body"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="review-note">{t("label")}</FieldLabel>
                                    <Textarea
                                        {...field}
                                        id="review-note"
                                        rows={3}
                                        disabled={addNote.isPending}
                                        aria-invalid={fieldState.invalid}
                                    />
                                    <FormFieldError error={fieldState.error} />
                                </Field>
                            )}
                        />
                        <Button type="submit" variant="outline" className="self-start" disabled={addNote.isPending}>
                            {addNote.isPending && <Spinner data-icon="inline-start" />}
                            {t("add")}
                        </Button>
                    </FieldGroup>
                </form>
            )}

            {notes.length === 0 ? (
                <p className="mt-4 text-[15px] text-muted-foreground">{t("empty")}</p>
            ) : (
                <ul className="mt-4 flex flex-col gap-3">
                    {notes.map((note) => (
                        <li key={note.id} className="rounded-[12px] border border-green/10 bg-white p-3">
                            <p className="text-[15px] whitespace-pre-wrap">{note.body}</p>
                            <p className="mt-1 text-[13px] text-muted-foreground">
                                {note.authorName ?? t("unknownAuthor")} · {formatDateTime(note.createdAt, locale)}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
