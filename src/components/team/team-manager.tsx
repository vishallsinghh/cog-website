"use client";

import { useState } from "react";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatDateTime, formatPhone } from "@/lib/format";
import { ROLE_LABELS, type AppRole } from "@/lib/permissions";
import { formatMobileInput, normalizeIndianMobile } from "@/lib/phone";
import {
    ASSIGNABLE_ROLES,
    assignableRoleSchema,
    inviteFormSchema,
    type InviteFormValues,
} from "@/lib/team.schemas";
import { useTRPC } from "@/trpc/client";

const roleLabel = (role: string) => ROLE_LABELS[role as AppRole] ?? role;

function errorMessage(error: unknown) {
    return error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";
}

type Notice = { phoneNumber: string; role: string; expiresAt: Date };

function InviteForm({ onInvited }: { onInvited: (notice: Notice) => void }) {
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
            toast.error(errorMessage(error));
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
                            <FieldLabel htmlFor="invite-mobile">Mobile number</FieldLabel>
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
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />
                <Controller
                    name="role"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="sm:w-44">
                            <FieldLabel htmlFor="invite-role">Role</FieldLabel>
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
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />
                <Field className="sm:w-auto sm:pt-[1.625rem]">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Spinner data-icon="inline-start" />}
                        Send invite
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    );
}

export function TeamManager({ currentUserId }: { currentUserId: string }) {
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
            toast.error(errorMessage(error));
        } finally {
            await refresh();
        }
    }

    return (
        <div className="flex flex-col gap-10">
            <section className="flex flex-col gap-4" aria-labelledby="invite-heading">
                <h2 id="invite-heading" className="font-heading text-2xl font-normal">
                    Invite someone
                </h2>
                <InviteForm onInvited={setNotice} />
                {notice && (
                    <Alert>
                        <AlertTitle>Invite created for {formatPhone(notice.phoneNumber)}</AlertTitle>
                        <AlertDescription>
                            No message is sent. Ask them to log in to the COG website with this number before{" "}
                            {formatDate(notice.expiresAt)}. They will be an {roleLabel(notice.role)} as soon as
                            they verify the code. New people fill in the normal sign-up form first.
                        </AlertDescription>
                    </Alert>
                )}
            </section>

            {overview.isError ? (
                <Alert variant="destructive">
                    <AlertTitle>Could not load the team</AlertTitle>
                    <AlertDescription>Please refresh the page and try again.</AlertDescription>
                </Alert>
            ) : !overview.data ? (
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
                <>
                    <section className="flex flex-col gap-4" aria-labelledby="staff-heading">
                        <h2 id="staff-heading" className="font-heading text-2xl font-normal">
                            Current team
                        </h2>
                        <div className="rounded-xl border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Mobile</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
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
                                                            You
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {formatPhone(person.phoneNumber ?? "")}
                                                </TableCell>
                                                <TableCell>
                                                    <NativeSelect
                                                        size="sm"
                                                        aria-label={`Role for ${person.name}`}
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
                                                                `${person.name} is now ${roleLabel(role.data)}`,
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
                                                                Remove
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Remove {person.name} from the team?
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    They keep their account but go back to being a
                                                                    regular member, and are logged out.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() =>
                                                                        void run(
                                                                            () => remove.mutateAsync({ userId: person.id }),
                                                                            `${person.name} was removed from the team`,
                                                                        )
                                                                    }
                                                                >
                                                                    Remove
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
                        <h2 id="invites-heading" className="font-heading text-2xl font-normal">
                            Pending invites
                        </h2>
                        <div className="rounded-xl border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mobile</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Invited by</TableHead>
                                        <TableHead>Expires</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {overview.data.invites.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                                No pending invites.
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
                                                        <Badge variant="secondary">Expired</Badge>
                                                    ) : (
                                                        formatDateTime(invite.expiresAt)
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
                                                                "Invite revoked",
                                                            )
                                                        }
                                                    >
                                                        Revoke
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
