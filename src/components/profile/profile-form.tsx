"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { authClient } from "@/lib/auth.client";
import { INDIAN_STATES } from "@/lib/indian-states";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LANGUAGES, profileFormSchema, type ProfileFormValues } from "@/lib/profile.schemas";
import { useTRPC } from "@/trpc/client";
import { FormFieldError } from "@/components/form/form-field-error";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ProfileForm({ defaultValues }: { defaultValues: ProfileFormValues }) {
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations("Profile");
    const tc = useTranslations("Common");
    const trpc = useTRPC();
    const updateProfile = useMutation(trpc.profile.update.mutationOptions());

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues,
    });

    const { isSubmitting, isDirty } = form.formState;

    async function onSubmit(values: ProfileFormValues) {
        try {
            await updateProfile.mutateAsync(values);
            await authClient.getSession({ query: { disableCookieCache: true } });
            form.reset(values);
            toast.success(t("saved"));

            // Choosing a different preferred language also switches the dashboard to it.
            if (values.preferredLanguage !== locale) {
                router.replace(pathname, { locale: values.preferredLanguage });
            } else {
                router.refresh();
            }
        } catch {
            toast.error(t("saveError"));
        }
    }

    return (
        <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup className="gap-10">
                <FieldSet>
                    <FieldLegend className="font-heading font-medium text-green data-[variant=legend]:text-[26px]">{t("personal")}</FieldLegend>
                    <FieldDescription>{t("personalHelp")}</FieldDescription>
                    <FieldGroup>
                        <Controller
                            name="name"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="profile-name">{t("fullName")}</FieldLabel>
                                    <Input
                                        {...field}
                                        id="profile-name"
                                        autoComplete="name"
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && <FormFieldError error={fieldState.error} />}
                                </Field>
                            )}
                        />
                        <Controller
                            name="preferredLanguage"
                            control={form.control}
                            render={({ field }) => (
                                <Field>
                                    <FieldLabel>{t("preferredLanguage")}</FieldLabel>
                                    <ToggleGroup
                                        type="single"
                                        variant="outline"
                                        value={field.value}
                                        onValueChange={(value) => value && field.onChange(value)}
                                        className="w-fit"
                                    >
                                        {LANGUAGES.map((language) => (
                                            <ToggleGroupItem
                                                key={language}
                                                value={language}
                                                className="h-11 px-5"
                                            >
                                                {tc(`languages.${language}`)}
                                            </ToggleGroupItem>
                                        ))}
                                    </ToggleGroup>
                                </Field>
                            )}
                        />
                    </FieldGroup>
                </FieldSet>

                <FieldSet>
                    <FieldLegend className="font-heading font-medium text-green data-[variant=legend]:text-[26px]">{t("contact")}</FieldLegend>
                    <FieldDescription>{t("contactHelp")}</FieldDescription>
                    <FieldGroup>
                        <Controller
                            name="contactEmail"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="profile-email">{t("email")}</FieldLabel>
                                    <Input
                                        {...field}
                                        id="profile-email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder={t("emailPlaceholder")}
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && <FormFieldError error={fieldState.error} />}
                                </Field>
                            )}
                        />
                    </FieldGroup>
                </FieldSet>

                <FieldSet>
                    <FieldLegend className="font-heading font-medium text-green data-[variant=legend]:text-[26px]">{t("address")}</FieldLegend>
                    <FieldDescription>{t("addressHelp")}</FieldDescription>
                    <FieldGroup>
                        <Controller
                            name="addressLine1"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="profile-address1">{t("address1")}</FieldLabel>
                                    <Input
                                        {...field}
                                        id="profile-address1"
                                        autoComplete="address-line1"
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && <FormFieldError error={fieldState.error} />}
                                </Field>
                            )}
                        />
                        <Controller
                            name="addressLine2"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="profile-address2">{t("address2")}</FieldLabel>
                                    <Input
                                        {...field}
                                        id="profile-address2"
                                        autoComplete="address-line2"
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && <FormFieldError error={fieldState.error} />}
                                </Field>
                            )}
                        />
                        <FieldGroup className="sm:grid sm:grid-cols-3">
                            <Controller
                                name="city"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="profile-city">{t("city")}</FieldLabel>
                                        <Input
                                            {...field}
                                            id="profile-city"
                                            autoComplete="address-level2"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        {fieldState.invalid && <FormFieldError error={fieldState.error} />}
                                    </Field>
                                )}
                            />
                            <Controller
                                name="state"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="profile-state">{t("state")}</FieldLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            name={field.name}
                                        >
                                            <SelectTrigger
                                                id="profile-state"
                                                className="w-full"
                                                aria-invalid={fieldState.invalid}
                                            >
                                                <SelectValue placeholder={t("statePlaceholder")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {INDIAN_STATES.map((state) => (
                                                        <SelectItem key={state} value={state}>
                                                            {state}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        {fieldState.invalid && <FormFieldError error={fieldState.error} />}
                                    </Field>
                                )}
                            />
                            <Controller
                                name="pincode"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="profile-pincode">{t("pincode")}</FieldLabel>
                                        <Input
                                            {...field}
                                            id="profile-pincode"
                                            inputMode="numeric"
                                            autoComplete="postal-code"
                                            maxLength={6}
                                            onChange={(event) =>
                                                field.onChange(event.target.value.replace(/\D/g, ""))
                                            }
                                            aria-invalid={fieldState.invalid}
                                        />
                                        {fieldState.invalid && <FormFieldError error={fieldState.error} />}
                                    </Field>
                                )}
                            />
                        </FieldGroup>
                    </FieldGroup>
                </FieldSet>

                <FieldSet>
                    <FieldLegend className="font-heading font-medium text-green data-[variant=legend]:text-[26px]">{t("community")}</FieldLegend>
                    <FieldDescription>{t("communityHelp")}</FieldDescription>
                    <FieldGroup>
                        <Controller
                            name="jamaat"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="profile-jamaat">{t("jamaat")}</FieldLabel>
                                    <Input
                                        {...field}
                                        id="profile-jamaat"
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && <FormFieldError error={fieldState.error} />}
                                </Field>
                            )}
                        />
                    </FieldGroup>
                </FieldSet>

                <Field orientation="horizontal">
                    <Button type="submit" size="lg" disabled={isSubmitting || !isDirty}>
                        {isSubmitting && <Spinner data-icon="inline-start" />}
                        {t("save")}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        disabled={isSubmitting || !isDirty}
                        onClick={() => form.reset()}
                    >
                        {t("discard")}
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    );
}
