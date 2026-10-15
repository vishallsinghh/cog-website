"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FormFieldError } from "@/components/form/form-field-error";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Link } from "@/i18n/navigation";
import {
    DONATION_FREQUENCIES,
    DONATION_PRESETS_PAISE,
    DONATION_PROGRAMMES,
    donationFormSchema,
    type DonationFormValues,
} from "@/lib/donate.schemas";
import { formatMobileInput } from "@/lib/phone";

const CHOICE =
    "min-h-12 rounded-[10px] border px-3.5 py-2.5 text-center text-[15px] transition-all duration-200";
const CHOICE_ON = `${CHOICE} border-green bg-green font-semibold text-cream`;
const CHOICE_OFF = `${CHOICE} border-green/20 bg-white font-medium text-ink hover:border-green/50`;
const LEGEND = "display p-0 text-[24px] text-green";
const LABEL = "text-[14px] font-semibold text-ink";
const INPUT = "w-full bg-transparent px-3.5 py-[13px] text-[16px] text-ink outline-none";

export function DonateForm() {
    const t = useTranslations("Donate");
    const locale = useLocale();
    const [submitted, setSubmitted] = useState(false);

    const form = useForm<DonationFormValues>({
        resolver: zodResolver(donationFormSchema),
        defaultValues: {
            frequency: "once",
            programme: "need",
            amountPaise: 500_000,
            custom: "",
            name: "",
            mobile: "",
            email: "",
        },
    });

    const { control, setValue, handleSubmit } = form;
    const [frequency, programme, amountPaise, custom] = useWatch({
        control,
        name: ["frequency", "programme", "amountPaise", "custom"],
    });
    const monthly = frequency === "monthly";
    const useCustom = custom !== "";

    const formatter = new Intl.NumberFormat(locale === "gu" ? "gu-IN" : "en-IN");
    const rupees = (paise: number) => `₹${formatter.format(paise / 100)}`;
    const amountLabel = rupees(amountPaise);
    const payLabel =
        amountPaise > 0 ? t(monthly ? "payMonthly" : "pay", { amount: amountLabel }) : t("payEmpty");

    const pickPreset = (paise: number) => {
        setValue("custom", "");
        setValue("amountPaise", paise, { shouldValidate: true });
    };

    return (
        <form
            noValidate
            aria-label={t("formLabel")}
            onSubmit={handleSubmit(() => setSubmitted(true))}
            className="intro d2 min-w-0 flex-[1_1_480px] border border-gold/45 bg-paper p-[clamp(28px,3.4vw,48px)] shadow-[0_30px_60px_rgba(6,63,53,0.1)]"
        >
            <Controller
                control={control}
                name="frequency"
                render={({ field }) => (
                    <div role="group" aria-label={t("frequencyLabel")} className="grid grid-cols-2 rounded-full bg-green/7 p-1">
                        {DONATION_FREQUENCIES.map((value) => {
                            const on = field.value === value;
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() => field.onChange(value)}
                                    className={`min-h-11 rounded-full text-[15px] transition-all duration-200 ${
                                        on
                                            ? "bg-white font-semibold text-green shadow-[0_2px_8px_rgba(6,63,53,0.12)]"
                                            : "bg-transparent font-medium text-ink-soft"
                                    }`}
                                >
                                    {t(`frequency.${value}`)}
                                </button>
                            );
                        })}
                    </div>
                )}
            />

            <FieldSet className="mt-8 gap-0">
                <legend className={LEGEND}>{t("programmeTitle")}</legend>
                <Controller
                    control={control}
                    name="programme"
                    render={({ field }) => (
                        <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5">
                            {DONATION_PROGRAMMES.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    aria-pressed={field.value === value}
                                    onClick={() => field.onChange(value)}
                                    className={field.value === value ? CHOICE_ON : CHOICE_OFF}
                                >
                                    {t(`programmes.${value}`)}
                                </button>
                            ))}
                        </div>
                    )}
                />
            </FieldSet>

            <FieldSet className="mt-[30px] gap-0">
                <legend className={LEGEND}>{t("amountTitle")}</legend>
                <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-2.5">
                    {DONATION_PRESETS_PAISE.map((paise) => {
                        const on = !useCustom && amountPaise === paise;
                        return (
                            <button
                                key={paise}
                                type="button"
                                aria-pressed={on}
                                onClick={() => pickPreset(paise)}
                                className={`${on ? CHOICE_ON : CHOICE_OFF} display !text-[20px]`}
                            >
                                {rupees(paise)}
                            </button>
                        );
                    })}
                </div>
                <Controller
                    control={control}
                    name="amountPaise"
                    render={({ fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="mt-4 gap-2">
                            <FieldLabel htmlFor="custom-amount" className={LABEL}>
                                {t("customLabel")}
                            </FieldLabel>
                            <div className="field-box flex items-center" data-invalid={fieldState.invalid}>
                                <span className="px-3.5 text-[18px] font-semibold text-green">₹</span>
                                <input
                                    id="custom-amount"
                                    type="text"
                                    inputMode="numeric"
                                    value={custom}
                                    placeholder={t("customPlaceholder")}
                                    aria-invalid={fieldState.invalid}
                                    onChange={(event) => {
                                        const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
                                        setValue("custom", digits);
                                        setValue("amountPaise", Number(digits) * 100, { shouldValidate: true });
                                    }}
                                    className={`${INPUT} pl-0`}
                                />
                            </div>
                            <FormFieldError error={fieldState.error} />
                        </Field>
                    )}
                />
            </FieldSet>

            <FieldSet className="mt-[30px] gap-0">
                <legend className={LEGEND}>{t("detailsTitle")}</legend>
                <FieldGroup className="mt-3.5 gap-3.5">
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
                        <Controller
                            control={control}
                            name="name"
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid} className="gap-2">
                                    <FieldLabel htmlFor="donor-name" className={LABEL}>
                                        {t("name")}
                                    </FieldLabel>
                                    <div className="field-box" data-invalid={fieldState.invalid}>
                                        <input
                                            {...field}
                                            id="donor-name"
                                            type="text"
                                            autoComplete="name"
                                            aria-invalid={fieldState.invalid}
                                            className={INPUT}
                                        />
                                    </div>
                                    <FormFieldError error={fieldState.error} />
                                </Field>
                            )}
                        />
                        <Controller
                            control={control}
                            name="mobile"
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid} className="gap-2">
                                    <FieldLabel htmlFor="donor-mobile" className={LABEL}>
                                        {t("mobile")}
                                    </FieldLabel>
                                    <div className="field-box flex items-center" data-invalid={fieldState.invalid}>
                                        <span className="border-r border-green/15 px-3.5 font-semibold text-green">+91</span>
                                        <input
                                            {...field}
                                            id="donor-mobile"
                                            type="tel"
                                            inputMode="numeric"
                                            autoComplete="tel-national"
                                            placeholder="98765 43210"
                                            aria-invalid={fieldState.invalid}
                                            onChange={(event) => field.onChange(formatMobileInput(event.target.value))}
                                            className={INPUT}
                                        />
                                    </div>
                                    <FormFieldError error={fieldState.error} />
                                </Field>
                            )}
                        />
                    </div>
                    <Controller
                        control={control}
                        name="email"
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid} className="gap-2">
                                <FieldLabel htmlFor="donor-email" className={LABEL}>
                                    {t("email")}
                                </FieldLabel>
                                <div className="field-box" data-invalid={fieldState.invalid}>
                                    <input
                                        {...field}
                                        id="donor-email"
                                        type="email"
                                        autoComplete="email"
                                        aria-invalid={fieldState.invalid}
                                        className={INPUT}
                                    />
                                </div>
                                <FormFieldError error={fieldState.error} />
                            </Field>
                        )}
                    />
                </FieldGroup>
            </FieldSet>

            <div className="mt-[30px] flex flex-wrap justify-between gap-3 rounded-[10px] bg-gold/12 px-5 py-[18px] text-[15px]">
                <span className="text-ink-soft">
                    {t(monthly ? "summaryMonthly" : "summaryOnce", { programme: t(`programmes.${programme}`) })}
                </span>
                <span className="font-semibold text-green">
                    {monthly ? t("perMonth", { amount: amountLabel }) : amountLabel}
                </span>
            </div>

            <button type="submit" className="button button-gold mt-[18px] w-full text-[18px]" style={{ padding: 18 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                {payLabel}
            </button>

            {submitted ? (
                <div role="status" className="mt-4 border-l-[3px] border-gold bg-gold/12 px-4 py-3.5 text-[14px] leading-[1.7] text-ink">
                    {t("notice")}{" "}
                    <Link href="/contact" className="font-semibold text-green underline underline-offset-4">
                        {t("contactLink")}
                    </Link>
                </div>
            ) : (
                <p className="mt-3.5 text-center text-[13px] leading-[1.6] text-muted-ink">{t("secureNote")}</p>
            )}
        </form>
    );
}
