"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { errorMessage } from "@/components/applications/error-message";
import { FormFieldError } from "@/components/form/form-field-error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { FORM_ACCESS_LEVELS, isFormAccessLevel, lowerAccessLevel } from "@/lib/forms/application-status";
import { grantFormSchema } from "@/lib/forms/review.schemas";
import { useTRPC } from "@/trpc/client";

type GrantValues = z.infer<typeof grantFormSchema>;

export function FormAccessSheet({
    open,
    onOpenChange,
    formId,
    formTitle,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formId: string;
    formTitle: string;
}) {
    const t = useTranslations("Review.access");
    const tl = useTranslations("Review.levels");
    const tr = useTranslations("Roles");
    const tc = useTranslations("Common");
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const access = useQuery({ ...trpc.applicationReview.access.queryOptions(), enabled: open });
    const grant = useMutation(trpc.applicationReview.grantAccess.mutationOptions());
    const revoke = useMutation(trpc.applicationReview.revokeAccess.mutationOptions());

    const form = useForm<GrantValues>({
        resolver: zodResolver(grantFormSchema),
        defaultValues: { userId: "", level: "view" },
    });

    const roleLabel = (role: string) => (tr.has(role as "member") ? tr(role as "member") : role);

    async function refresh() {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: trpc.applicationReview.access.queryKey() }),
            queryClient.invalidateQueries({ queryKey: trpc.applicationReview.forms.queryKey() }),
        ]);
    }

    async function save(userId: string, level: GrantValues["level"], name: string) {
        try {
            await grant.mutateAsync({ formId, userId, level });
            toast.success(t("granted", { name }));
            return true;
        } catch (error) {
            toast.error(errorMessage(error, tc("genericError")));
            return false;
        } finally {
            await refresh();
        }
    }

    async function remove(userId: string) {
        try {
            await revoke.mutateAsync({ formId, userId });
            toast.success(t("removed"));
        } catch (error) {
            toast.error(errorMessage(error, tc("genericError")));
        } finally {
            await refresh();
        }
    }

    const data = access.data;
    const current = data?.forms.find((item) => item.id === formId);
    const staff = data?.staff ?? [];
    const everyForm = staff.filter((person) => person.seesAll);
    const granted = (current?.access ?? [])
        .map((entry) => ({ ...entry, person: staff.find((person) => person.id === entry.userId) }))
        .filter((entry) => entry.person && !entry.person.seesAll && isFormAccessLevel(entry.level));
    const grantable = staff.filter(
        (person) => !person.seesAll && !current?.access.some((entry) => entry.userId === person.id),
    );
    const busy = grant.isPending || revoke.isPending;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                <SheetHeader>
                    <SheetTitle className="font-heading text-[26px] text-green">{t("title")}</SheetTitle>
                    <SheetDescription>{t("description", { form: formTitle })}</SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-6 px-4 pb-8">
                    {access.isError ? (
                        <Alert variant="destructive">
                            <AlertTitle>{t("loadError")}</AlertTitle>
                            <AlertDescription>{errorMessage(access.error, tc("refreshError"))}</AlertDescription>
                        </Alert>
                    ) : !data ? (
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    ) : (
                        <>
                            <ul className="flex flex-col gap-1 text-[14px] text-[#4A5451]">
                                {FORM_ACCESS_LEVELS.map((level) => (
                                    <li key={level}>
                                        <span className="font-semibold text-green">{tl(level)}</span>: {tl(`${level}Help`)}
                                    </li>
                                ))}
                            </ul>

                            <section className="flex flex-col gap-3">
                                <h3 className="font-heading text-[20px] text-green">{t("withAccess")}</h3>
                                {granted.length === 0 ? (
                                    <p className="text-[15px] text-muted-foreground">{t("none")}</p>
                                ) : (
                                    <ul className="flex flex-col gap-3">
                                        {granted.map(({ userId, level, person }) => {
                                            const name = person?.name ?? "";
                                            const wanted = isFormAccessLevel(level) ? level : "view";
                                            const effective =
                                                person?.roleLevel ? lowerAccessLevel(person.roleLevel, wanted) : wanted;

                                            return (
                                                <li
                                                    key={userId}
                                                    className="flex flex-col gap-2 rounded-[12px] border border-green/10 bg-white p-3"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <div className="font-medium">{name}</div>
                                                            <div className="text-[13px] text-muted-foreground">
                                                                {roleLabel(person?.role ?? "")}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            disabled={busy}
                                                            onClick={() => void remove(userId)}
                                                            aria-label={t("remove", { name })}
                                                        >
                                                            <Trash2Icon />
                                                        </Button>
                                                    </div>
                                                    <ResponsiveSelect
                                                        className="w-full"
                                                        aria-label={t("levelFor", { name })}
                                                        label={t("levelFor", { name })}
                                                        value={wanted}
                                                        disabled={busy}
                                                        onValueChange={(next) => {
                                                            if (isFormAccessLevel(next)) void save(userId, next, name);
                                                        }}
                                                        options={FORM_ACCESS_LEVELS.map((value) => ({ value, label: tl(value) }))}
                                                    />
                                                    {effective !== wanted && (
                                                        <p className="text-[13px] text-muted-foreground">
                                                            {t("limited", { level: tl(effective) })}
                                                        </p>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </section>

                            {grantable.length > 0 && (
                                <form
                                    noValidate
                                    onSubmit={form.handleSubmit(async (values) => {
                                        const name = staff.find((person) => person.id === values.userId)?.name ?? "";
                                        if (await save(values.userId, values.level, name)) {
                                            form.reset({ userId: "", level: "view" });
                                        }
                                    })}
                                >
                                    <FieldGroup className="gap-3">
                                        <Controller
                                            name="userId"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field data-invalid={fieldState.invalid}>
                                                    <FieldLabel htmlFor="access-person">{t("person")}</FieldLabel>
                                                    <ResponsiveSelect
                                                        id="access-person"
                                                        name={field.name}
                                                        ref={field.ref}
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        onBlur={field.onBlur}
                                                        className="w-full"
                                                        disabled={busy}
                                                        aria-invalid={fieldState.invalid}
                                                        label={t("person")}
                                                        placeholder={t("choose")}
                                                        options={grantable.map((person) => ({
                                                            value: person.id,
                                                            label: `${person.name} (${roleLabel(person.role)})`,
                                                        }))}
                                                    />
                                                    <FormFieldError error={fieldState.error} />
                                                </Field>
                                            )}
                                        />
                                        <Controller
                                            name="level"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field data-invalid={fieldState.invalid}>
                                                    <FieldLabel htmlFor="access-level">{t("level")}</FieldLabel>
                                                    <ResponsiveSelect
                                                        id="access-level"
                                                        name={field.name}
                                                        ref={field.ref}
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        onBlur={field.onBlur}
                                                        className="w-full"
                                                        disabled={busy}
                                                        aria-invalid={fieldState.invalid}
                                                        label={t("level")}
                                                        options={FORM_ACCESS_LEVELS.map((value) => ({ value, label: tl(value) }))}
                                                    />
                                                    <FormFieldError error={fieldState.error} />
                                                </Field>
                                            )}
                                        />
                                        <Button type="submit" className="self-start" disabled={busy}>
                                            {grant.isPending && <Spinner data-icon="inline-start" />}
                                            {t("add")}
                                        </Button>
                                    </FieldGroup>
                                </form>
                            )}

                            {everyForm.length > 0 && (
                                <>
                                    <Separator />
                                    <section className="flex flex-col gap-2">
                                        <h3 className="font-heading text-[20px] text-green">{t("allForms")}</h3>
                                        <FieldDescription>{t("allFormsHelp")}</FieldDescription>
                                        <ul className="flex flex-col gap-1 text-[15px]">
                                            {everyForm.map((person) => (
                                                <li key={person.id}>
                                                    {person.name}{" "}
                                                    <span className="text-muted-foreground">({roleLabel(person.role)})</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                </>
                            )}
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
