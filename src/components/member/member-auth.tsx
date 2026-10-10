"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
    ArrowRightIcon,
    ChevronLeftIcon,
    CircleAlertIcon,
    ClockIcon,
    IdCardIcon,
    PhoneIcon,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { formatAadhaar, normalizeAadhaar } from "@/lib/aadhaar";
import { authClient } from "@/lib/auth.client";
import {
    detailsFormSchema,
    otpFormSchema,
    type DetailsFormValues,
    type OtpFormValues,
} from "@/lib/auth.schemas";
import { normalizeIndianMobile } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authErrorMessage, oauthErrorMessage } from "./auth-messages";

type Mode = "signin" | "signup";
type Step = "details" | "otp" | "pending";

const RESEND_SECONDS = 60;
const STEP_PROGRESS: Record<Step, number> = { details: 33, otp: 66, pending: 100 };

const COPY: Record<Mode, { title: string; description: string; submit: string }> = {
    signin: {
        title: "Welcome back",
        description: "Enter your mobile number and we will text you a one-time code.",
        submit: "Sign in",
    },
    signup: {
        title: "Join the community",
        description: "Create your COG account with your name, mobile number and Aadhaar.",
        submit: "Create account",
    },
};

function GoogleIcon(props: React.ComponentProps<"svg">) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
    );
}

function formatMobile(phoneNumber: string) {
    return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 8)} ${phoneNumber.slice(8)}`;
}

export function MemberAuth() {
    const router = useRouter();
    const oauthError = useSearchParams().get("error");
    const oauthOutcome = oauthError ? oauthErrorMessage(oauthError) : null;
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
        if (oauthError) window.history.replaceState(null, "", "/member");
    }, [oauthError]);

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
            setServerError(authErrorMessage(error));
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
            return setServerError(authErrorMessage(error));
        }

        detailsForm.reset();
        router.push("/");
        router.refresh();
    }

    async function signInWithGoogle() {
        setServerError(null);
        setGoogleLoading(true);

        const { error } = await authClient.signIn.social({
            provider: "google",
            callbackURL: "/",
            errorCallbackURL: "/member",
        });

        if (error) {
            setGoogleLoading(false);
            setServerError(authErrorMessage(error));
        }
    }

    async function resendCode() {
        setServerError(null);
        setResending(true);
        await requestCode(phoneNumber);
        setResending(false);
    }

    const copy = COPY[mode];
    const detailsSubmitting = detailsForm.formState.isSubmitting;
    const otpSubmitting = otpForm.formState.isSubmitting;

    return (
        <div className="flex w-full flex-col gap-6">
            <Progress value={STEP_PROGRESS[step]} aria-label="Sign in progress" className="h-1" />

            <div key={step} className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                {step === "pending" ? (
                    <div className="flex flex-col gap-6">
                        <div>
                            <Empty className="border-0 p-0">
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <ClockIcon />
                                    </EmptyMedia>
                                    <EmptyTitle className="font-heading text-2xl font-normal">
                                        {mode === "signup" ? "Request received" : "Awaiting approval"}
                                    </EmptyTitle>
                                    <EmptyDescription>
                                        Your account is awaiting approval from COG. You will be able
                                        to log in as soon as it is approved.
                                    </EmptyDescription>
                                </EmptyHeader>
                                <Button asChild variant="outline" size="lg">
                                    <Link href="/">Back to home</Link>
                                </Button>
                            </Empty>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4">
                            {step === "details" ? (
                                <Tabs value={mode} onValueChange={changeMode}>
                                    <TabsList className="relative w-full p-1 group-data-horizontal/tabs:h-12">
                                        <span
                                            aria-hidden
                                            className={cn(
                                                "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-md bg-background shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none",
                                                mode === "signup" && "translate-x-full",
                                            )}
                                        />
                                        <TabsTrigger value="signin" className="z-10 text-sm transition-colors duration-200 outline-none focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-none data-active:bg-transparent group-data-[variant=default]/tabs-list:data-active:shadow-none">
                                            Sign in
                                        </TabsTrigger>
                                        <TabsTrigger value="signup" className="z-10 text-sm transition-colors duration-200 outline-none focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-none data-active:bg-transparent group-data-[variant=default]/tabs-list:data-active:shadow-none">
                                            Sign up
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            ) : (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="-ml-2 justify-self-start"
                                    onClick={backToDetails}
                                    disabled={otpSubmitting}
                                >
                                    <ChevronLeftIcon data-icon="inline-start" />
                                    Change number
                                </Button>
                            )}
                            <div className="flex flex-col gap-1.5 pt-2">
                                <h2 className="font-heading text-3xl font-normal tracking-tight">
                                    {step === "details" ? copy.title : "Check your phone"}
                                </h2>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {step === "details"
                                        ? copy.description
                                        : `Enter the 6-digit code we sent to ${formatMobile(phoneNumber)}.`}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-5">
                            {serverError && (
                                <Alert variant="destructive" role="alert">
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
                                    >
                                        <FieldGroup>
                                            {mode === "signup" && (
                                                <Controller
                                                    name="name"
                                                    control={detailsForm.control}
                                                    render={({ field, fieldState }) => (
                                                        <Field data-invalid={fieldState.invalid}>
                                                            <FieldLabel htmlFor="member-name">
                                                                Full name
                                                            </FieldLabel>
                                                            <Input
                                                                {...field}
                                                                id="member-name"
                                                                autoComplete="name"
                                                                placeholder="As you would like us to address you"
                                                                aria-invalid={fieldState.invalid}
                                                            />
                                                            {fieldState.invalid && (
                                                                <FieldError errors={[fieldState.error]} />
                                                            )}
                                                        </Field>
                                                    )}
                                                />
                                            )}

                                            <Controller
                                                name="mobile"
                                                control={detailsForm.control}
                                                render={({ field, fieldState }) => (
                                                    <Field data-invalid={fieldState.invalid}>
                                                        <FieldLabel htmlFor="member-mobile">
                                                            Mobile number
                                                        </FieldLabel>
                                                        <InputGroup>
                                                            <InputGroupAddon>
                                                                <PhoneIcon />
                                                                <span className="font-semibold text-foreground">
                                                                    +91
                                                                </span>
                                                            </InputGroupAddon>
                                                            <InputGroupInput
                                                                {...field}
                                                                id="member-mobile"
                                                                type="tel"
                                                                inputMode="numeric"
                                                                autoComplete="tel-national"
                                                                placeholder="98765 43210"
                                                                aria-invalid={fieldState.invalid}
                                                            />
                                                        </InputGroup>
                                                        {fieldState.invalid ? (
                                                            <FieldError errors={[fieldState.error]} />
                                                        ) : (
                                                            <FieldDescription>
                                                                We only send a code to verify it is you.
                                                            </FieldDescription>
                                                        )}
                                                    </Field>
                                                )}
                                            />

                                            {mode === "signup" && (
                                                <Controller
                                                    name="aadhaar"
                                                    control={detailsForm.control}
                                                    render={({ field, fieldState }) => (
                                                        <Field data-invalid={fieldState.invalid}>
                                                            <FieldLabel htmlFor="member-aadhaar">Aadhaar number</FieldLabel>
                                                            <InputGroup>
                                                                <InputGroupAddon>
                                                                    <IdCardIcon />
                                                                </InputGroupAddon>
                                                                <InputGroupInput
                                                                    {...field}
                                                                    id="member-aadhaar"
                                                                    inputMode="numeric"
                                                                    autoComplete="off"
                                                                    placeholder="1234 5678 9012"
                                                                    onChange={(event) => field.onChange(formatAadhaar(event.target.value))}
                                                                    aria-invalid={fieldState.invalid}
                                                                />
                                                            </InputGroup>
                                                            {fieldState.invalid ? (
                                                                <FieldError errors={[fieldState.error]} />
                                                            ) : (
                                                                <FieldDescription>
                                                                    Stored encrypted and reduced to the last 4 digits once COG approves your
                                                                    account.
                                                                </FieldDescription>
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
                                                        <Field
                                                            orientation="horizontal"
                                                            data-invalid={fieldState.invalid}
                                                        >
                                                            <Checkbox
                                                                id="member-consent"
                                                                name={field.name}
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                                aria-invalid={fieldState.invalid}
                                                            />
                                                            <div className="flex flex-col gap-1.5">
                                                                <FieldLabel
                                                                    htmlFor="member-consent"
                                                                    className="leading-snug font-normal"
                                                                >
                                                                    I agree to COG storing my details, including my Aadhaar number until my account is approved, and contacting me about my membership, in line with the privacy policy and terms.
                                                                </FieldLabel>
                                                                {fieldState.invalid && (
                                                                    <FieldError errors={[fieldState.error]} />
                                                                )}
                                                            </div>
                                                        </Field>
                                                    )}
                                                />
                                            )}

                                            <Button
                                                type="submit"
                                                size="lg"
                                                className="w-full"
                                                disabled={detailsSubmitting}
                                            >
                                                {detailsSubmitting ? (
                                                    <Spinner data-icon="inline-start" />
                                                ) : null}
                                                Send code
                                                {!detailsSubmitting && (
                                                    <ArrowRightIcon data-icon="inline-end" />
                                                )}
                                            </Button>
                                        </FieldGroup>
                                    </form>
                                    {mode === "signin" && (
                                        <FieldGroup className="mt-5">
                                            <FieldSeparator>or</FieldSeparator>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="lg"
                                                className="w-full"
                                                onClick={signInWithGoogle}
                                                disabled={googleLoading || detailsSubmitting}
                                            >
                                                {googleLoading ? <Spinner data-icon="inline-start" /> : <GoogleIcon data-icon="inline-start" />}
                                                Continue with Google
                                            </Button>
                                        </FieldGroup>
                                    )}
                                </>
                            ) : (
                                <form
                                    id="member-otp-form"
                                    onSubmit={otpForm.handleSubmit(onOtpSubmit)}
                                    noValidate
                                >
                                    <FieldGroup>
                                        <Controller
                                            name="code"
                                            control={otpForm.control}
                                            render={({ field, fieldState }) => (
                                                <Field
                                                    data-invalid={fieldState.invalid}
                                                    className="items-center"
                                                >
                                                    <FieldLabel htmlFor="member-code" className="sr-only">
                                                        One-time code
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
                                                        onComplete={() =>
                                                            otpForm.handleSubmit(onOtpSubmit)()
                                                        }
                                                        disabled={otpSubmitting}
                                                        aria-invalid={fieldState.invalid}
                                                    >
                                                        <InputOTPGroup className="gap-2">
                                                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                                                <InputOTPSlot
                                                                    key={index}
                                                                    index={index}
                                                                    className="rounded-lg border"
                                                                />
                                                            ))}
                                                        </InputOTPGroup>
                                                    </InputOTP>
                                                    {fieldState.invalid && (
                                                        <FieldError errors={[fieldState.error]} />
                                                    )}
                                                </Field>
                                            )}
                                        />

                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-full"
                                            disabled={otpSubmitting}
                                        >
                                            {otpSubmitting ? <Spinner data-icon="inline-start" /> : null}
                                            {copy.submit}
                                            {!otpSubmitting && <ArrowRightIcon data-icon="inline-end" />}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="w-full"
                                            onClick={resendCode}
                                            disabled={otpSubmitting || resending || cooldown > 0}
                                        >
                                            {resending ? <Spinner data-icon="inline-start" /> : null}
                                            {cooldown > 0
                                                ? `Resend code in ${cooldown}s`
                                                : "Resend code"}
                                        </Button>
                                    </FieldGroup>
                                </form>
                            )}
                        </div>

                        <div className="flex justify-center">
                            <p className="text-center text-xs leading-relaxed text-muted-foreground">
                                {mode === "signin"
                                    ? "New to COG? Choose Sign up above to create your account."
                                    : "Your account will be reviewed and approved by COG before you can log in."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
