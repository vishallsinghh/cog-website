"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormFieldError } from "@/components/form/form-field-error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { formatDate, formatPhone } from "@/lib/format";
import { memberStatusSchema } from "@/lib/members.schemas";
import { MEMBER_STATUSES, type MemberStatus } from "@/lib/permissions";
import { routing } from "@/i18n/routing";
import { useTRPC } from "@/trpc/client";
import { StatusBadge } from "./status-badge";

const statusFormSchema = z.object({ status: memberStatusSchema });

type StatusFormValues = z.infer<typeof statusFormSchema>;

type Abilities = { canUpdate: boolean; canApprove: boolean; canReject: boolean };

function canMove(from: string, to: MemberStatus, abilities: Abilities) {
    if (from === to) return true;
    if (from === "approved" || to === "approved") return abilities.canApprove;
    if (from === "rejected" || to === "rejected") return abilities.canReject;
    return abilities.canUpdate;
}

function errorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback;
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 py-2">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words font-medium">{value}</dd>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-1">
            <h3 className="font-heading text-[20px] text-green">{title}</h3>
            <dl className="flex flex-col">{children}</dl>
        </section>
    );
}

export function MemberSheet({ userId, onOpenChange }: { userId: string | null; onOpenChange: (open: boolean) => void }) {
    const t = useTranslations("Members.sheet");
    const tc = useTranslations("Common");
    const tr = useTranslations("Roles");
    const ts = useTranslations("Statuses");
    const locale = useLocale();
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const query = useQuery({
        ...trpc.members.get.queryOptions({ userId: userId ?? "" }),
        enabled: Boolean(userId),
    });
    const setStatus = useMutation(trpc.members.setStatus.mutationOptions());

    const member = query.data;

    const form = useForm<StatusFormValues>({
        resolver: zodResolver(statusFormSchema),
        defaultValues: { status: "pending" },
    });

    const currentStatus = member?.status;
    useEffect(() => {
        const parsed = memberStatusSchema.safeParse(currentStatus);
        if (parsed.success) form.reset({ status: parsed.data });
    }, [currentStatus, form]);

    async function onSubmit(values: StatusFormValues) {
        if (!member) return;

        try {
            await setStatus.mutateAsync({ userId: member.id, status: values.status });
            toast.success(t("statusSaved", { status: ts(values.status) }));
        } catch (error) {
            toast.error(errorMessage(error, tc("genericError")));
        } finally {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: trpc.members.get.queryKey({ userId: member.id }) }),
                queryClient.invalidateQueries({ queryKey: trpc.members.list.queryKey() }),
            ]);
        }
    }

    const missing = t("notProvided");
    const hidden = t("hidden");
    const orMissing = (value: string | null) => value || missing;
    const contact = (value: string | null) => (member?.canSeeContact ? orMissing(value) : hidden);
    const language = routing.locales.find((value) => value === member?.preferredLanguage);
    const canChange = Boolean(member && (member.canUpdate || member.canApprove || member.canReject));
    const submitting = form.formState.isSubmitting;
    const selectedStatus = useWatch({ control: form.control, name: "status" });

    return (
        <Sheet open={Boolean(userId)} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                <SheetHeader>
                    <SheetTitle className="font-heading text-[26px] text-green">{member?.name ?? t("title")}</SheetTitle>
                    <SheetDescription>{t("description")}</SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-6 px-4 pb-8">
                    {query.isError ? (
                        <Alert variant="destructive">
                            <AlertTitle>{t("loadError")}</AlertTitle>
                            <AlertDescription>{errorMessage(query.error, tc("refreshError"))}</AlertDescription>
                        </Alert>
                    ) : !member ? (
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    ) : (
                        <>
                            {member.staff ? (
                                <Alert>
                                    <AlertDescription>{t("staffNote")}</AlertDescription>
                                </Alert>
                            ) : canChange ? (
                                <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
                                    <FieldGroup className="gap-3">
                                        <Controller
                                            name="status"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field data-invalid={fieldState.invalid}>
                                                    <FieldLabel htmlFor="member-status">{t("changeStatus")}</FieldLabel>
                                                    <NativeSelect
                                                        {...field}
                                                        id="member-status"
                                                        className="w-full"
                                                        disabled={submitting}
                                                        aria-invalid={fieldState.invalid}
                                                    >
                                                        {MEMBER_STATUSES.map((value) => (
                                                            <option
                                                                key={value}
                                                                value={value}
                                                                disabled={!canMove(member.status, value, member)}
                                                            >
                                                                {ts(value)}
                                                            </option>
                                                        ))}
                                                    </NativeSelect>
                                                    {fieldState.invalid ? (
                                                        <FormFieldError error={fieldState.error} />
                                                    ) : (
                                                        <FieldDescription>{t("statusHelp")}</FieldDescription>
                                                    )}
                                                </Field>
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            className="self-start"
                                            disabled={submitting || selectedStatus === member.status}
                                        >
                                            {submitting && <Spinner data-icon="inline-start" />}
                                            {t("save")}
                                        </Button>
                                    </FieldGroup>
                                </form>
                            ) : null}

                            <Separator />

                            <Section title={t("account")}>
                                <Detail label={t("status")} value={<StatusBadge status={member.status} />} />
                                <Detail label={t("memberId")} value={member.memberId ?? tc("dash")} />
                                <Detail label={t("role")} value={tr.has(member.role as "member") ? tr(member.role as "member") : member.role} />
                                <Detail label={t("joined")} value={formatDate(member.joinedAt, locale)} />
                                <Detail
                                    label={t("consent")}
                                    value={member.consentAcceptedAt ? formatDate(member.consentAcceptedAt, locale) : missing}
                                />
                                <Detail label={t("language")} value={language ? tc(`languages.${language}`) : member.preferredLanguage} />
                            </Section>

                            <Section title={t("identity")}>
                                <Detail
                                    label={t("aadhaar")}
                                    value={member.aadhaarLast4 ? t("aadhaarMasked", { last4: member.aadhaarLast4 }) : missing}
                                />
                                <Detail label={t("aadhaarVerified")} value={member.aadhaarVerified ? t("verified") : t("notVerified")} />
                                <Detail label={t("google")} value={member.googleLinked ? t("linked") : t("notLinked")} />
                            </Section>

                            <Section title={t("contact")}>
                                <Detail label={t("mobile")} value={formatPhone(member.phone)} />
                                <Detail label={t("email")} value={contact(member.contactEmail)} />
                            </Section>

                            <Section title={t("address")}>
                                <Detail label={t("address1")} value={contact(member.addressLine1)} />
                                <Detail label={t("address2")} value={contact(member.addressLine2)} />
                                <Detail label={t("city")} value={orMissing(member.city)} />
                                <Detail label={t("state")} value={orMissing(member.state)} />
                                <Detail label={t("pincode")} value={contact(member.pincode)} />
                                <Detail label={t("jamaat")} value={orMissing(member.jamaat)} />
                            </Section>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
