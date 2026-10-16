import type { useTranslations } from "next-intl";

type AuthError = { code?: string; message?: string; status?: number } | null | undefined;

export type AuthErrorsT = ReturnType<typeof useTranslations<"AuthErrors">>;

const CODE_MESSAGES = [
    "INVALID_PHONE_NUMBER",
    "INVALID_OTP",
    "OTP_EXPIRED",
    "TOO_MANY_ATTEMPTS",
    "SIGNUP_DETAILS_REQUIRED",
    "ACCOUNT_REJECTED",
] as const;

// Rate-limit errors from src/lib/rate-limit.ts end in "Try again in N seconds."
const WAIT_CODES = ["OTP_RESEND_COOLDOWN", "OTP_SEND_LIMIT", "OTP_IP_LIMIT", "OTP_NUMBER_LOCKED"] as const;

function find<T extends string>(list: readonly T[], code: string | undefined): T | undefined {
    return list.find((value) => value === code);
}

function retrySeconds(message: string | undefined) {
    const match = /(\d+) seconds?/.exec(message ?? "");
    return match ? Number(match[1]) : 60;
}

export function authErrorMessage(error: AuthError, t: AuthErrorsT) {
    if (!error) return t("generic");

    const code = find(CODE_MESSAGES, error.code);
    if (code) return t(code);

    const waitCode = find(WAIT_CODES, error.code);
    if (waitCode) return t(waitCode, { seconds: retrySeconds(error.message) });

    if (error.status === 429) return t("tooMany");

    return t("generic");
}

const LINK_CODES = [
    "account_already_linked_to_different_user",
    "unable_to_link_account",
    "email_not_verified",
    "access_denied",
] as const;

export function linkErrorMessage(code: string, t: AuthErrorsT) {
    const known = find(LINK_CODES, code);
    return known ? t(`link.${known}`) : t("link.generic");
}

export function oauthErrorMessage(code: string, t: AuthErrorsT) {
    if (code === "signup_disabled") return t("signup_disabled");
    if (code === "ACCOUNT_REJECTED") return t("ACCOUNT_REJECTED");

    return t("googleIncomplete");
}
