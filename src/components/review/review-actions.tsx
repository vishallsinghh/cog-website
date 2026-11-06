"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { errorMessage } from "@/components/applications/error-message";
import { FormFieldError } from "@/components/form/form-field-error";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { DECISION_STATUSES, statusNeedsMessage, type StaffTargetStatus } from "@/lib/forms/application-status";
import { statusChangeFormSchema } from "@/lib/forms/review.schemas";
import { useTRPC } from "@/trpc/client";

type StatusChangeValues = z.input<typeof statusChangeFormSchema>;

export function ReviewActions({
    applicationId,
    status,
    transitions,
}: {
    applicationId: string;
    status: string;
    transitions: StaffTargetStatus[];
}) {
    const t = useTranslations("Review.actions");
    const tc = useTranslations("Common");
    const ts = useTranslations("ApplicationStatuses");
    const router = useRouter();
    const trpc = useTRPC();
    const setStatus = useMutation(trpc.applicationReview.setStatus.mutationOptions());
    const [refreshing, startRefresh] = useTransition();
    const applying = setStatus.isPending || refreshing;
    const [confirming, setConfirming] = useState<StatusChangeValues | null>(null);

    const form = useForm<StatusChangeValues>({
        resolver: zodResolver(statusChangeFormSchema),
        defaultValues: { status: "" as StaffTargetStatus, message: "" },
    });

    const selected = useWatch({ control: form.control, name: "status" });
    const decided = status === "approved" || status === "rejected";

    if (transitions.length === 0) {
        return (
            <section className="rounded-[18px] border border-green/10 bg-field p-5">
                <h2 className="display m-0 text-[22px] text-green">{t("title")}</h2>
                <p className="mt-2 text-[15px] text-[#4A5451]">{decided ? t("final") : t("viewOnly")}</p>
            </section>
        );
    }

    async function apply(values: StatusChangeValues) {
        const label = ts(values.status);

        try {
            const result = await setStatus.mutateAsync({ id: applicationId, ...values });
            toast.success(result.smsSent ? t("saved", { status: label }) : t("savedNoSms", { status: label }));
            form.reset({ status: "" as StaffTargetStatus, message: "" });
            startRefresh(() => {
                router.refresh();
                setConfirming(null);
            });
        } catch (error) {
            toast.error(errorMessage(error, tc("genericError")));
            setConfirming(null);
        }
    }

    return (
        <section className="rounded-[18px] border border-green/10 bg-field p-5">
            <h2 className="display m-0 text-[22px] text-green">{t("title")}</h2>
            <form
                noValidate
                className="mt-4"
                onSubmit={form.handleSubmit((values) => {
                    if ((DECISION_STATUSES as readonly string[]).includes(values.status)) setConfirming(values);
                    else void apply(values);
                })}
            >
                <FieldGroup className="gap-4">
                    <Controller
                        name="status"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="review-status">{t("newStatus")}</FieldLabel>
                                <NativeSelect
                                    {...field}
                                    id="review-status"
                                    className="w-full"
                                    disabled={applying}
                                    aria-invalid={fieldState.invalid}
                                >
                                    <option value="">{t("choose")}</option>
                                    {transitions.map((value) => (
                                        <option key={value} value={value}>
                                            {ts(value)}
                                        </option>
                                    ))}
                                </NativeSelect>
                                <FormFieldError error={fieldState.error} />
                            </Field>
                        )}
                    />
                    <Controller
                        name="message"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="review-message">
                                    {t("message")}
                                    {!statusNeedsMessage(selected) && (
                                        <span className="font-normal text-muted-foreground">{t("optional")}</span>
                                    )}
                                </FieldLabel>
                                <FieldDescription>{t("messageHelp")}</FieldDescription>
                                <Textarea
                                    {...field}
                                    value={field.value ?? ""}
                                    id="review-message"
                                    rows={4}
                                    disabled={applying}
                                    aria-invalid={fieldState.invalid}
                                />
                                <FormFieldError error={fieldState.error} />
                            </Field>
                        )}
                    />
                    <Button type="submit" className="self-start" disabled={applying}>
                        {applying && <Spinner data-icon="inline-start" />}
                        {t("save")}
                    </Button>
                </FieldGroup>
            </form>

            <AlertDialog open={Boolean(confirming)} onOpenChange={(open) => !open && !applying && setConfirming(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t("confirmTitle", { status: confirming ? ts(confirming.status) : "" })}
                        </AlertDialogTitle>
                        <AlertDialogDescription>{t("confirmText")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={applying}>{tc("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            variant={confirming?.status === "rejected" ? "destructive" : "default"}
                            disabled={applying}
                            onClick={(event) => {
                                event.preventDefault();
                                if (confirming) void apply(confirming);
                            }}
                        >
                            {applying && <Spinner data-icon="inline-start" />}
                            {t("confirm")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
}
