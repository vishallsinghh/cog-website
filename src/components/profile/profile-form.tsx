"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { authClient } from "@/lib/auth.client";
import { INDIAN_STATES } from "@/lib/indian-states";
import {
    LANGUAGES,
    LANGUAGE_LABELS,
    profileFormSchema,
    type ProfileFormValues,
} from "@/lib/profile.schemas";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldError,
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
            router.refresh();
            toast.success("Profile updated");
        } catch {
            toast.error("We could not save your changes. Please try again.");
        }
    }

    return (
        <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup className="gap-10">
                <FieldSet>
                    <FieldLegend>Personal</FieldLegend>
                    <FieldDescription>How COG addresses you.</FieldDescription>
                    <FieldGroup>
                        <Controller
                            name="name"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="profile-name">Full name</FieldLabel>
                                    <Input
                                        {...field}
                                        id="profile-name"
                                        autoComplete="name"
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                        <Controller
                            name="preferredLanguage"
                            control={form.control}
                            render={({ field }) => (
                                <Field>
                                    <FieldLabel>Preferred language</FieldLabel>
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
                                                {LANGUAGE_LABELS[language]}
                                            </ToggleGroupItem>
                                        ))}
                                    </ToggleGroup>
                                </Field>
                            )}
                        />
                    </FieldGroup>
                </FieldSet>

                <FieldSet>
                    <FieldLegend>Contact</FieldLegend>
                    <FieldDescription>Where we send receipts and updates.</FieldDescription>
                    <FieldGroup>
                        <Controller
                            name="contactEmail"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="profile-email">Email address</FieldLabel>
                                    <Input
                                        {...field}
                                        id="profile-email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                    </FieldGroup>
                </FieldSet>

                <FieldSet>
                    <FieldLegend>Address</FieldLegend>
                    <FieldDescription>Your current residential address.</FieldDescription>
                    <FieldGroup>
                        <Controller
                            name="addressLine1"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="profile-address1">Address line 1</FieldLabel>
                                    <Input
                                        {...field}
                                        id="profile-address1"
                                        autoComplete="address-line1"
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                        <Controller
                            name="addressLine2"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="profile-address2">Address line 2</FieldLabel>
                                    <Input
                                        {...field}
                                        id="profile-address2"
                                        autoComplete="address-line2"
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                        <FieldGroup className="sm:grid sm:grid-cols-3">
                            <Controller
                                name="city"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="profile-city">City</FieldLabel>
                                        <Input
                                            {...field}
                                            id="profile-city"
                                            autoComplete="address-level2"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )}
                            />
                            <Controller
                                name="state"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="profile-state">State</FieldLabel>
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
                                                <SelectValue placeholder="Select a state" />
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
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )}
                            />
                            <Controller
                                name="pincode"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="profile-pincode">Pincode</FieldLabel>
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
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )}
                            />
                        </FieldGroup>
                    </FieldGroup>
                </FieldSet>

                <FieldSet>
                    <FieldLegend>Community</FieldLegend>
                    <FieldDescription>Your Jamaat helps COG route requests to the right team.</FieldDescription>
                    <FieldGroup>
                        <Controller
                            name="jamaat"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="profile-jamaat">Jamaat</FieldLabel>
                                    <Input
                                        {...field}
                                        id="profile-jamaat"
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                    </FieldGroup>
                </FieldSet>

                <Field orientation="horizontal">
                    <Button type="submit" size="lg" disabled={isSubmitting || !isDirty}>
                        {isSubmitting && <Spinner data-icon="inline-start" />}
                        Save changes
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        disabled={isSubmitting || !isDirty}
                        onClick={() => form.reset()}
                    >
                        Discard
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    );
}
