"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FormFieldError } from "@/components/form/form-field-error";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Link } from "@/i18n/navigation";
import {
    DONATION_PRESETS_PAISE,
    DONATION_PROGRAMMES,
    donationFormSchema,
    isDonationProgramme,
    type DonationFormValues,
} from "@/lib/donate.schemas";
import { formatMobileInput } from "@/lib/phone";
import { useTRPC } from "@/trpc/client";

const CHOICE =
    "min-h-12 rounded-[10px] border px-3.5 py-2.5 text-center text-[15px] transition-all duration-200";
const CHOICE_ON = `${CHOICE} border-green bg-green font-semibold text-cream`;
const CHOICE_OFF = `${CHOICE} border-green/20 bg-white font-medium text-ink hover:border-green/50`;
const LEGEND = "display p-0 text-[24px] text-green";
const LABEL = "text-[14px] font-semibold text-ink";
const INPUT = "w-full bg-transparent px-3.5 py-[13px] text-[16px] text-ink outline-none";
const PANEL =
    "intro d2 min-w-0 flex-[1_1_480px] border border-gold/45 bg-paper p-[clamp(28px,3.4vw,48px)] shadow-[0_30px_60px_rgba(6,63,53,0.1)]";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const CONFIRM_ATTEMPTS = 10;
const CONFIRM_DELAY_MS = 3000;

type CheckoutResponse = {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
};

type CheckoutOptions = {
    key: string;
    order_id: string;
    amount: number;
    currency: "INR";
    name: string;
    description: string;
    prefill: { name: string; email: string; contact: string };
    theme: { color: string };
    handler: (response: CheckoutResponse) => void;
    modal: { ondismiss: () => void };
};

type CheckoutInstance = {
    open: () => void;
    on: (event: "payment.failed", handler: () => void) => void;
};

declare global {
    interface Window {
        Razorpay?: new (options: CheckoutOptions) => CheckoutInstance;
    }
}

function loadCheckout() {
    if (window.Razorpay) return Promise.resolve(true);

    return new Promise<boolean>((resolve) => {
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`);
        const script = existing ?? document.createElement("script");

        script.addEventListener("load", () => resolve(true), { once: true });
        script.addEventListener(
            "error",
            () => {
                script.remove();
                resolve(false);
            },
            { once: true },
        );

        if (!existing) {
            script.src = CHECKOUT_SRC;
            script.async = true;
            document.body.appendChild(script);
        }
    });
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function errorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback;
}

type Notice = "cancelled" | "failed" | "pending" | "unavailable" | { message: string };
type Receipt = { receiptNumber: string | null; amountPaise: number; programme: string };

export function DonateForm() {
    const t = useTranslations("Donate");
    const tc = useTranslations("Common");
    const locale = useLocale();
    const trpc = useTRPC();
    const start = useMutation(trpc.donations.start.mutationOptions());
    const confirm = useMutation(trpc.donations.confirm.mutationOptions());

    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);
    const [receipt, setReceipt] = useState<Receipt | null>(null);

    const form = useForm<DonationFormValues>({
        resolver: zodResolver(donationFormSchema),
        defaultValues: {
            programme: "need",
            amountPaise: 500_000,
            custom: "",
            name: "",
            mobile: "",
            email: "",
        },
    });

    const { control, setValue, handleSubmit } = form;
    const [programme, amountPaise, custom] = useWatch({
        control,
        name: ["programme", "amountPaise", "custom"],
    });
    const useCustom = custom !== "";

    const formatter = new Intl.NumberFormat(locale === "gu" ? "gu-IN" : "en-IN");
    const rupees = (paise: number) => `₹${formatter.format(paise / 100)}`;
    const amountLabel = rupees(amountPaise);
    const payLabel = amountPaise > 0 ? t("pay", { amount: amountLabel }) : t("payEmpty");

    const pickPreset = (paise: number) => {
        setValue("custom", "");
        setValue("amountPaise", paise, { shouldValidate: true });
    };

    async function confirmPayment(response: CheckoutResponse) {
        setBusy(true);

        try {
            for (let attempt = 0; attempt < CONFIRM_ATTEMPTS; attempt += 1) {
                const result = await confirm.mutateAsync({
                    orderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                });

                if (result.status === "paid") {
                    setReceipt(result);
                    return;
                }

                if (result.status === "failed") {
                    setNotice("failed");
                    return;
                }

                await wait(CONFIRM_DELAY_MS);
            }

            setNotice("pending");
        } catch (error) {
            setNotice({ message: errorMessage(error, tc("genericError")) });
        } finally {
            setBusy(false);
        }
    }

    async function pay(values: DonationFormValues) {
        setNotice(null);
        setBusy(true);
        let opened = false;
        let failed = false;

        try {
            const ready = await loadCheckout();
            if (!ready || !window.Razorpay) {
                setNotice("unavailable");
                return;
            }

            const order = await start.mutateAsync({
                programme: values.programme,
                amountPaise: values.amountPaise,
                name: values.name,
                mobile: values.mobile,
                email: values.email,
            });

            const checkout = new window.Razorpay({
                key: order.keyId,
                order_id: order.orderId,
                amount: order.amountPaise,
                currency: "INR",
                name: t("checkoutName"),
                description: t(`programmes.${values.programme}`),
                prefill: { name: order.name, email: order.email, contact: order.contact },
                theme: { color: "#063F35" },
                handler: (response) => void confirmPayment(response),
                modal: {
                    ondismiss: () => {
                        setBusy(false);
                        setNotice(failed ? "failed" : "cancelled");
                    },
                },
            });

            checkout.on("payment.failed", () => {
                failed = true;
            });
            checkout.open();
            opened = true;
        } catch (error) {
            setNotice({ message: errorMessage(error, tc("genericError")) });
        } finally {
            if (!opened) setBusy(false);
        }
    }

    if (receipt) {
        const programmeLabel = isDonationProgramme(receipt.programme) ? t(`programmes.${receipt.programme}`) : receipt.programme;

        return (
            <div role="status" className={PANEL}>
                <div className="label inline-flex rounded-full bg-gold/20 px-3.5 py-1.5 font-semibold text-gold-ink [--ls:.14em]">
                    {t("thanks.eyebrow")}
                </div>
                <h2 className="display mt-[18px] text-[clamp(36px,3.6vw,52px)] leading-[1.05] text-green">{t("thanks.title")}</h2>
                <p className="mt-3 text-[17px] leading-[1.7] text-ink-soft">
                    {t("thanks.text", { amount: rupees(receipt.amountPaise), programme: programmeLabel })}
                </p>
                <dl className="mt-7 grid gap-3 rounded-[10px] bg-gold/12 px-5 py-[18px] text-[15px]">
                    <div className="flex flex-wrap justify-between gap-3">
                        <dt className="text-ink-soft">{t("thanks.receipt")}</dt>
                        <dd className="font-mono font-semibold text-green">{receipt.receiptNumber ?? t("thanks.receiptPending")}</dd>
                    </div>
                    <div className="flex flex-wrap justify-between gap-3">
                        <dt className="text-ink-soft">{t("thanks.amount")}</dt>
                        <dd className="font-semibold text-green">{rupees(receipt.amountPaise)}</dd>
                    </div>
                </dl>
                <p className="mt-4 text-[14px] leading-[1.6] text-muted-ink">{t("thanks.keep")}</p>
                <button
                    type="button"
                    onClick={() => {
                        setReceipt(null);
                        form.reset();
                    }}
                    className="button button-gold mt-6 w-full text-[17px]"
                    style={{ padding: 16 }}
                >
                    {t("thanks.again")}
                </button>
            </div>
        );
    }

    return (
        <form noValidate aria-label={t("formLabel")} aria-busy={busy} onSubmit={handleSubmit(pay)} className={PANEL}>
            <FieldSet className="gap-0">
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
                <span className="text-ink-soft">{t("summaryOnce", { programme: t(`programmes.${programme}`) })}</span>
                <span className="font-semibold text-green">{amountLabel}</span>
            </div>

            <button
                type="submit"
                disabled={busy}
                className="button button-gold mt-[18px] w-full text-[18px] disabled:cursor-wait disabled:opacity-80"
                style={{ padding: 18 }}
            >
                {busy ? (
                    <Spinner className="size-[18px]" />
                ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                )}
                {busy ? t("processing") : payLabel}
            </button>

            {notice ? (
                <div role="alert" className="mt-4 border-l-[3px] border-gold bg-gold/12 px-4 py-3.5 text-[14px] leading-[1.7] text-ink">
                    {typeof notice === "string" ? t(`notices.${notice}`) : notice.message}
                    {notice === "unavailable" && (
                        <>
                            {" "}
                            <Link href="/contact" className="font-semibold text-green underline underline-offset-4">
                                {t("contactLink")}
                            </Link>
                        </>
                    )}
                </div>
            ) : (
                <p className="mt-3.5 text-center text-[13px] leading-[1.6] text-muted-ink">{t("secureNote")}</p>
            )}
        </form>
    );
}
