"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PhoneIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormFieldError } from "@/components/form/form-field-error";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatDateTime, formatPhone } from "@/lib/format";
import { formatMobileInput, normalizeIndianMobile } from "@/lib/phone";
import {
    ASSIGNABLE_ROLES,
    assignableRoleSchema,
    inviteFormSchema,
    type InviteFormValues,
} from "@/lib/team.schemas";
import { useTRPC } from "@/trpc/client";

function errorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback;
}

function useRoleLabel() {
    const t = useTranslations("Roles");

    return (role: string) => (t.has(role as "member") ? t(role as "member") : role);
}

type Notice = { phoneNumber: string; role: string; expiresAt: Date };

function InviteForm({ onInvited }: { onInvited: (notice: Notice) => void }) {
    const t = useTranslations("Team");
    const tc = useTranslations("Common");
    const roleLabel = useRoleLabel();
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const invite = useMutation(trpc.team.invite.mutationOptions());

    const form = useForm<InviteFormValues>({
        resolver: zodResolver(inviteFormSchema),
        defaultValues: { mobile: "", role: "viewer" },
    });

    async function onSubmit(values: InviteFormValues) {
        const phoneNumber = normalizeIndianMobile(values.mobile);
        if (!phoneNumber) return;

        try {
            const result = await invite.mutateAsync({ phoneNumber, role: values.role });
            await queryClient.invalidateQueries({ queryKey: trpc.team.overview.queryKey() });
            form.reset({ mobile: "", role: values.role });
            onInvited({ phoneNumber, role: values.role, expiresAt: result.expiresAt });
        } catch (error) {
            toast.error(errorMessage(error, tc("genericError")));
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup className="gap-4 sm:flex-row sm:items-start">
                <Controller
                    name="mobile"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="sm:flex-1">
                            <FieldLabel htmlFor="invite-mobile">{t("mobile")}</FieldLabel>
                            <InputGroup>
                                <InputGroupAddon>
                                    <PhoneIcon />
                                    <span className="font-semibold text-foreground">+91</span>
                                </InputGroupAddon>
                                <InputGroupInput
                                    {...field}
                                    id="invite-mobile"
                                    type="tel"
                                    inputMode="numeric"
                                    placeholder="98765 43210"
                                    onChange={(event) => field.onChange(formatMobileInput(event.target.value))}
                                    aria-invalid={fieldState.invalid}
                                />
                            </InputGroup>
                            {fieldState.invalid && <FormFieldError error={fieldState.error} />}
                        </Field>
                    )}
                />
                <Controller
                    name="role"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="sm:w-44">
                            <FieldLabel htmlFor="invite-role">{t("role")}</FieldLabel>
                            <NativeSelect
                                {...field}
                                id="invite-role"
                                className="w-full"
                                aria-invalid={fieldState.invalid}
                            >
                                {ASSIGNABLE_ROLES.map((role) => (
                                    <option key={role} value={role}>
                                        {roleLabel(role)}
                                    </option>
                                ))}
                            </NativeSelect>
                            {fieldState.invalid && <FormFieldError error={fieldState.error} />}
                        </Field>
                    )}
                />
                <Field className="sm:w-auto sm:pt-[1.625rem]">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Spinner data-icon="inline-start" />}
                        {t("sendInvite")}
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    );
}

export function TeamManager({ currentUserId }: { currentUserId: string }) {
    const t = useTranslations("Team");
    const tc = useTranslations("Common");
    const locale = useLocale();
    const roleLabel = useRoleLabel();
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const overview = useQuery(trpc.team.overview.queryOptions());

    const [notice, setNotice] = useState<Notice | null>(null);

    const changeRole = useMutation(trpc.team.changeRole.mutationOptions());
    const remove = useMutation(trpc.team.remove.mutationOptions());
    const revoke = useMutation(trpc.team.revokeInvite.mutationOptions());

    const refresh = () => queryClient.invalidateQueries({ queryKey: trpc.team.overview.queryKey() });

    async function run(action: () => Promise<unknown>, success: string) {
        try {
            await action();
            toast.success(success);
        } catch (error) {
            toast.error(errorMessage(error, tc("genericError")));
        } finally {
            await refresh();
        }
    }

    return (
        <div className="flex flex-col gap-10">
            <section className="flex flex-col gap-4 rounded-2xl border border-green/10 bg-field p-6" aria-labelledby="invite-heading">
                <h2 id="invite-heading" className="font-heading text-[26px] font-medium text-green">
                    {t("inviteTitle")}
                </h2>
                <InviteForm onInvited={setNotice} />
                {notice && (
                    <Alert>
                        <AlertTitle>{t("inviteCreated", { phone: formatPhone(notice.phoneNumber) })}</AlertTitle>
                        <AlertDescription>
                            {t("inviteHelp", {
                                date: formatDate(notice.expiresAt, locale),
                                role: roleLabel(notice.role),
                            })}
                        </AlertDescription>
                    </Alert>
                )}
            </section>

            {overview.isError ? (
                <Alert variant="destructive">
                    <AlertTitle>{t("loadError")}</AlertTitle>
                    <AlertDescription>{tc("refreshError")}</AlertDescription>
                </Alert>
            ) : !overview.data ? (
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
                <>
                    <section className="flex flex-col gap-4" aria-labelledby="staff-heading">
                        <h2 id="staff-heading" className="font-heading text-[26px] font-medium text-green">
                            {t("currentTeam")}
                        </h2>
                        <div className="overflow-hidden rounded-2xl border border-green/10 bg-field">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("name")}</TableHead>
                                        <TableHead>{t("mobile")}</TableHead>
                                        <TableHead>{t("role")}</TableHead>
                                        <TableHead className="text-right">{t("actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {overview.data.staff.map((person) => {
                                        const isSuperAdmin = person.role === "super_admin";
                                        const busy = changeRole.isPending || remove.isPending;

                                        return (
                                            <TableRow key={person.id}>
                                                <TableCell className="font-medium">
                                                    {person.name}
                                                    {person.id === currentUserId && (
                                                        <Badge variant="outline" className="ml-2">
                                                            {t("you")}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {formatPhone(person.phoneNumber ?? "")}
                                                </TableCell>
                                                <TableCell>
                                                    <NativeSelect
                                                        size="sm"
                                                        aria-label={t("roleFor", { name: person.name })}
                                                        value={person.role}
                                                        disabled={busy}
                                                        onChange={(event) => {
                                                            const role = assignableRoleSchema.safeParse(event.target.value);
                                                            if (!role.success) return;

                                                            void run(
                                                                () =>
                                                                    changeRole.mutateAsync({
                                                                        userId: person.id,
                                                                        role: role.data,
                                                                    }),
                                                                t("roleChanged", { name: person.name, role: roleLabel(role.data) }),
                                                            );
                                                        }}
                                                    >
                                                        {isSuperAdmin && (
                                                            <option value="super_admin" disabled>
                                                                {roleLabel("super_admin")}
                                                            </option>
                                                        )}
                                                        {ASSIGNABLE_ROLES.map((role) => (
                                                            <option key={role} value={role}>
                                                                {roleLabel(role)}
                                                            </option>
                                                        ))}
                                                    </NativeSelect>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm" disabled={busy}>
                                                                {t("remove")}
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    {t("removeTitle", { name: person.name })}
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    {t("removeText")}
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() =>
                                                                        void run(
                                                                            () => remove.mutateAsync({ userId: person.id }),
                                                                            t("removed", { name: person.name }),
                                                                        )
                                                                    }
                                                                >
                                                                    {t("remove")}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </section>

                    <section className="flex flex-col gap-4" aria-labelledby="invites-heading">
                        <h2 id="invites-heading" className="font-heading text-[26px] font-medium text-green">
                            {t("pendingInvites")}
                        </h2>
                        <div className="overflow-hidden rounded-2xl border border-green/10 bg-field">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("mobile")}</TableHead>
                                        <TableHead>{t("role")}</TableHead>
                                        <TableHead>{t("invitedBy")}</TableHead>
                                        <TableHead>{t("expires")}</TableHead>
                                        <TableHead className="text-right">{t("actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {overview.data.invites.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                                {t("noInvites")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        overview.data.invites.map((invite) => (
                                            <TableRow key={invite.id}>
                                                <TableCell className="whitespace-nowrap">
                                                    {formatPhone(invite.phoneNumber)}
                                                </TableCell>
                                                <TableCell>{roleLabel(invite.role)}</TableCell>
                                                <TableCell>{invite.invitedByName}</TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {invite.expired ? (
                                                        <Badge variant="secondary">{t("expired")}</Badge>
                                                    ) : (
                                                        formatDateTime(invite.expiresAt, locale)
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={revoke.isPending}
                                                        onClick={() =>
                                                            void run(
                                                                () => revoke.mutateAsync({ inviteId: invite.id }),
                                                                t("revoked"),
                                                            )
                                                        }
                                                    >
                                                        {t("revoke")}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
