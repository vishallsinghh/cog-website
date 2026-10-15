"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { ChevronLeftIcon, CircleAlertIcon, ClockIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { formatAadhaar, normalizeAadhaar } from "@/lib/aadhaar";
import { authClient } from "@/lib/auth.client";
import {
    detailsFormSchema,
    otpFormSchema,
    type DetailsFormValues,
    type OtpFormValues,
} from "@/lib/auth.schemas";
import { formatMobileInput, normalizeIndianMobile } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { getPathname, Link, useRouter } from "@/i18n/navigation";
import { FormFieldError } from "@/components/form/form-field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";
import { authErrorMessage, oauthErrorMessage } from "./auth-messages";
import { GoogleIcon } from "./google-icon";

type Mode = "signin" | "signup";
type Step = "details" | "otp" | "pending";

const RESEND_SECONDS = 60;
const INPUT = "w-full bg-transparent px-3.5 py-[15px] text-[17px] text-ink outline-none";
const STEP_PROGRESS: Record<Step, number> = { details: 33, otp: 66, pending: 100 };


function formatMobile(phoneNumber: string) {
    return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 8)} ${phoneNumber.slice(8)}`;
}

export function MemberAuth() {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations("Auth");
    const te = useTranslations("AuthErrors");
    const oauthError = useSearchParams().get("error");
    const oauthOutcome = oauthError ? oauthErrorMessage(oauthError, te) : null;
    const [mode, setMode] = useState<Mode>("signin");
    const [step, setStep] = useState<Step>(oauthOutcome?.pending ? "pending" : "details");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [serverError, setServerError] = useState<string | null>(
        oauthOutcome && !oauthOutcome.pending ? oauthOutcome.message : null,
    );
    const [googleLoading, setGoogleLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [resending, setResending] = useState(false);

    const detailsForm = useForm<DetailsFormValues>({
        resolver: zodResolver(detailsFormSchema(mode)),
        defaultValues: { name: "", mobile: "", aadhaar: "", consent: false },
    });

    const otpForm = useForm<OtpFormValues>({
        resolver: zodResolver(otpFormSchema),
        defaultValues: { code: "" },
    });

    useEffect(() => {
        if (oauthError) window.history.replaceState(null, "", getPathname({ href: "/member", locale }));
    }, [oauthError, locale]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    function changeMode(next: string) {
        setMode(next as Mode);
        setServerError(null);
        detailsForm.clearErrors();
    }

    function backToDetails() {
        setStep("details");
        setServerError(null);
        otpForm.reset();
    }

    async function requestCode(number: string) {
        const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber: number });

        if (error) {
            setServerError(authErrorMessage(error, te));
            return false;
        }

        setCooldown(RESEND_SECONDS);
        return true;
    }

    async function onDetailsSubmit(values: DetailsFormValues) {
        setServerError(null);

        const number = normalizeIndianMobile(values.mobile);
        if (!number) return;

        if (!(await requestCode(number))) return;

        setPhoneNumber(number);
        otpForm.reset();
        setStep("otp");
    }

    async function onOtpSubmit(values: OtpFormValues) {
        setServerError(null);

        const { name, consent, aadhaar } = detailsForm.getValues();

        const { error } = await authClient.phoneNumber.verify({
            phoneNumber,
            code: values.code,
            ...(mode === "signup"
                ? { name: name.trim(), consent, aadhaar: normalizeAadhaar(aadhaar) }
                : {}),
        });

        if (error?.code === "ACCOUNT_PENDING_APPROVAL") {
            detailsForm.reset();
            return setStep("pending");
        }

        if (error) {
            otpForm.reset();
            return setServerError(authErrorMessage(error, te));
        }

        detailsForm.reset();
        router.push("/dashboard");
        router.refresh();
    }

    async function signInWithGoogle() {
        setServerError(null);
        setGoogleLoading(true);

        const { error } = await authClient.signIn.social({
            provider: "google",
            callbackURL: getPathname({ href: "/dashboard", locale }),
            errorCallbackURL: getPathname({ href: "/member", locale }),
        });

        if (error) {
            setGoogleLoading(false);
            setServerError(authErrorMessage(error, te));
        }
    }

    async function resendCode() {
        setServerError(null);
        setResending(true);
        await requestCode(phoneNumber);
        setResending(false);
    }

    const copy =
        mode === "signin"
            ? { title: t("signinTitle"), description: t("signinDescription"), submit: t("signinSubmit") }
            : { title: t("signupTitle"), description: t("signupDescription"), submit: t("signupSubmit") };
    const detailsSubmitting = detailsForm.formState.isSubmitting;
    const otpSubmitting = otpForm.formState.isSubmitting;
    const stepNumber = step === "details" ? 1 : step === "otp" ? 2 : 3;
    const nextLabel = t(`stepNext.${step}`);

    const tabClass = (active: boolean) =>
        cn(
            "min-h-12 border-0 bg-transparent py-3.5 text-[16px] transition-colors",
            active ? "font-semibold text-green shadow-[inset_0_-2px_0_var(--gold)]" : "font-medium text-muted-ink hover:text-green",
        );

    return (
        <div className="flex w-full flex-col">
            {step === "details" && (
                <div role="tablist" aria-label={t("account")} className="mt-10 grid grid-cols-2 border-b border-green/15">
                    {(["signin", "signup"] as const).map((value) => (
                        <button
                            key={value}
                            type="button"
                            role="tab"
                            aria-selected={mode === value}
                            onClick={() => changeMode(value)}
                            className={tabClass(mode === value)}
                        >
                            {t(value)}
                        </button>
                    ))}
                </div>
            )}

            <div className={step === "details" ? "mt-7" : "mt-10"}>
                <div className="flex justify-between gap-3 text-[13px] text-muted-ink">
                    <span className="font-semibold text-green">
                        {t("stepOf", { step: stepNumber, name: t(`stepNames.${step}`) })}
                    </span>
                    <span>{nextLabel}</span>
                </div>
                <div
                    role="progressbar"
                    aria-label={t("progress")}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={STEP_PROGRESS[step]}
                    className="mt-2.5 h-1 overflow-hidden rounded-full bg-green/10"
                >
                    <div
                        className="h-full rounded-full bg-gold transition-[width] duration-500 motion-reduce:transition-none"
                        style={{ width: `${STEP_PROGRESS[step]}%` }}
                    />
                </div>
            </div>

            <div key={step} className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                {step === "pending" ? (
                    <div className="mt-8 flex flex-col items-start gap-4">
                        <span className="flex size-14 items-center justify-center rounded-full bg-gold/20 text-gold-ink">
                            <ClockIcon className="size-6" />
                        </span>
                        <h2 className="display text-[38px] leading-[1.1] text-green">
                            {mode === "signup" ? t("requestReceived") : t("awaitingApproval")}
                        </h2>
                        <p className="text-[16px] leading-[1.7] text-[#4A5451]">{t("pendingText")}</p>
                        <Link href="/" className="button button-outline mt-2" style={{ padding: "14px 32px" }}>
                            {t("backHome")}
                        </Link>
                    </div>
                ) : (
                    <div>
                        {step === "otp" && (
                            <button
                                type="button"
                                onClick={backToDetails}
                                disabled={otpSubmitting}
                                className="mt-6 -ml-1 inline-flex items-center gap-1 text-[15px] font-medium text-green hover:text-gold-ink disabled:opacity-50"
                            >
                                <ChevronLeftIcon className="size-4" />
                                {t("changeNumber")}
                            </button>
                        )}
                        <h2 className="display mt-8 text-[38px] leading-[1.1] text-green">
                            {step === "details" ? copy.title : t("checkPhone")}
                        </h2>
                        <p className="mt-2 text-[16px] text-[#4A5451]">
                            {step === "details" ? copy.description : t("codeSent", { phone: formatMobile(phoneNumber) })}
                        </p>

                        {serverError && (
                            <Alert variant="destructive" role="alert" className="mt-6">
                                <CircleAlertIcon />
                                <AlertDescription>{serverError}</AlertDescription>
                            </Alert>
                        )}

                        {step === "details" ? (
                            <>
                                <form
                                    id="member-details-form"
                                    onSubmit={detailsForm.handleSubmit(onDetailsSubmit)}
                                    noValidate
                                    className="mt-6"
                                >
                                    <FieldGroup className="gap-[18px]">
                                        {mode === "signup" && (
                                            <Controller
                                                name="name"
                                                control={detailsForm.control}
                                                render={({ field, fieldState }) => (
                                                    <Field data-invalid={fieldState.invalid} className="gap-2">
                                                        <FieldLabel htmlFor="member-name" className="text-[14px] font-semibold">
                                                            {t("fullName")}
                                                        </FieldLabel>
                                                        <div className="field-box" data-invalid={fieldState.invalid}>
                                                            <input
                                                                {...field}
                                                                id="member-name"
                                                                type="text"
                                                                autoComplete="name"
                                                                placeholder={t("fullNamePlaceholder")}
                                                                aria-invalid={fieldState.invalid}
                                                                className={INPUT}
                                                            />
                                                        </div>
                                                        {fieldState.invalid && <FormFieldError error={fieldState.error} />}
                                                    </Field>
                                                )}
                                            />
                                        )}

                                        <Controller
                                            name="mobile"
                                            control={detailsForm.control}
                                            render={({ field, fieldState }) => (
                                                <Field data-invalid={fieldState.invalid} className="gap-2">
                                                    <FieldLabel htmlFor="member-mobile" className="text-[14px] font-semibold">
                                                        {t("mobile")}
                                                    </FieldLabel>
                                                    <div className="field-box flex items-center" data-invalid={fieldState.invalid}>
                                                        <span className="border-r border-green/15 px-3.5 font-semibold text-green">+91</span>
                                                        <input
                                                            {...field}
                                                            id="member-mobile"
                                                            type="tel"
                                                            inputMode="numeric"
                                                            autoComplete="tel-national"
                                                            placeholder="98765 43210"
                                                            onChange={(event) => field.onChange(formatMobileInput(event.target.value))}
                                                            aria-invalid={fieldState.invalid}
                                                            className={INPUT}
                                                        />
                                                    </div>
                                                    {fieldState.invalid && <FormFieldError error={fieldState.error} />}
                                                </Field>
                                            )}
                                        />

                                        {mode === "signup" && (
                                            <Controller
                                                name="aadhaar"
                                                control={detailsForm.control}
                                                render={({ field, fieldState }) => (
                                                    <Field data-invalid={fieldState.invalid} className="gap-2">
                                                        <FieldLabel htmlFor="member-aadhaar" className="text-[14px] font-semibold">
                                                            {t("aadhaar")}
                                                        </FieldLabel>
                                                        <div className="field-box" data-invalid={fieldState.invalid}>
                                                            <input
                                                                {...field}
                                                                id="member-aadhaar"
                                                                type="text"
                                                                inputMode="numeric"
                                                                autoComplete="off"
                                                                placeholder="0000 0000 0000"
                                                                onChange={(event) => field.onChange(formatAadhaar(event.target.value))}
                                                                aria-invalid={fieldState.invalid}
                                                                className={`${INPUT} tracking-[0.12em]`}
                                                            />
                                                        </div>
                                                        {fieldState.invalid ? (
                                                            <FormFieldError error={fieldState.error} />
                                                        ) : (
                                                            <FieldDescription className="text-[13px]">{t("aadhaarHelp")}</FieldDescription>
                                                        )}
                                                    </Field>
                                                )}
                                            />
                                        )}

                                        {mode === "signup" && (
                                            <Controller
                                                name="consent"
                                                control={detailsForm.control}
                                                render={({ field, fieldState }) => (
                                                    <Field orientation="horizontal" data-invalid={fieldState.invalid} className="items-start gap-3">
                                                        <Checkbox
                                                            id="member-consent"
                                                            name={field.name}
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            aria-invalid={fieldState.invalid}
                                                            className="mt-px size-5"
                                                        />
                                                        <div className="flex flex-col gap-1.5">
                                                            <FieldLabel
                                                                htmlFor="member-consent"
                                                                className="text-[14px] leading-[1.5] font-normal text-ink-soft"
                                                            >
                                                                {t("consent")}
                                                            </FieldLabel>
                                                            {fieldState.invalid && <FormFieldError error={fieldState.error} />}
                                                        </div>
                                                    </Field>
                                                )}
                                            />
                                        )}

                                        <button
                                            type="submit"
                                            className="button button-dark mt-1 w-full disabled:opacity-60"
                                            style={{ padding: 16 }}
                                            disabled={detailsSubmitting}
                                        >
                                            {detailsSubmitting && <Spinner />}
                                            {mode === "signin" ? t("sendOtp") : t("signupContinue")}
                                        </button>
                                    </FieldGroup>
                                </form>

                                {mode === "signin" ? (
                                    <>
                                        <div className="my-6 flex items-center gap-3.5 text-[13px] text-muted-ink">
                                            <span className="h-px flex-1 bg-green/15" />
                                            {t("or")}
                                            <span className="h-px flex-1 bg-green/15" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={signInWithGoogle}
                                            disabled={googleLoading || detailsSubmitting}
                                            className="button w-full gap-3 border border-green/25 bg-white font-medium text-ink hover:bg-cream-deep disabled:opacity-60"
                                            style={{ padding: 14 }}
                                        >
                                            {googleLoading ? <Spinner /> : <GoogleIcon className="size-[18px]" />}
                                            {t("google")}
                                        </button>
                                        <p className="mt-3.5 text-center text-[13px] text-muted-ink">{t("googleNote")}</p>
                                    </>
                                ) : (
                                    <p className="mt-5 text-center text-[13px] leading-[1.6] text-muted-ink">{t("signupFoot")}</p>
                                )}
                            </>
                        ) : (
                            <form id="member-otp-form" onSubmit={otpForm.handleSubmit(onOtpSubmit)} noValidate className="mt-6">
                                <FieldGroup>
                                    <Controller
                                        name="code"
                                        control={otpForm.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid} className="items-center">
                                                <FieldLabel htmlFor="member-code" className="sr-only">
                                                    {t("otpLabel")}
                                                </FieldLabel>
                                                <InputOTP
                                                    id="member-code"
                                                    containerClassName="justify-center"
                                                    maxLength={6}
                                                    pattern={REGEXP_ONLY_DIGITS}
                                                    autoComplete="one-time-code"
                                                    autoFocus
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    onBlur={field.onBlur}
                                                    onComplete={() => otpForm.handleSubmit(onOtpSubmit)()}
                                                    disabled={otpSubmitting}
                                                    aria-invalid={fieldState.invalid}
                                                >
                                                    <InputOTPGroup className="gap-2">
                                                        {[0, 1, 2, 3, 4, 5].map((index) => (
                                                            <InputOTPSlot
                                                                key={index}
                                                                index={index}
                                                                className="size-12 rounded-[10px] border border-green/25 bg-white text-[18px] first:rounded-l-[10px] last:rounded-r-[10px]"
                                                            />
                                                        ))}
                                                    </InputOTPGroup>
                                                </InputOTP>
                                                {fieldState.invalid && <FormFieldError error={fieldState.error} />}
                                            </Field>
                                        )}
                                    />

                                    <button
                                        type="submit"
                                        className="button button-dark w-full disabled:opacity-60"
                                        style={{ padding: 16 }}
                                        disabled={otpSubmitting}
                                    >
                                        {otpSubmitting && <Spinner />}
                                        {copy.submit}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={resendCode}
                                        disabled={otpSubmitting || resending || cooldown > 0}
                                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 text-[15px] font-medium text-green hover:text-gold-ink disabled:opacity-50"
                                    >
                                        {resending && <Spinner />}
                                        {cooldown > 0 ? t("resendIn", { seconds: cooldown }) : t("resend")}
                                    </button>
                                </FieldGroup>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
