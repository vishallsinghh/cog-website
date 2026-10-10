type AuthError = { code?: string; message?: string; status?: number } | null | undefined;

const MESSAGES: Record<string, string> = {
    INVALID_PHONE_NUMBER: "Enter a valid 10-digit Indian mobile number.",
    INVALID_OTP: "That code is not correct. Check it and try again.",
    OTP_EXPIRED: "That code has expired. Request a new one.",
    TOO_MANY_ATTEMPTS: "Too many wrong attempts. Request a new code.",
    SIGNUP_DETAILS_REQUIRED: "No account found for this number. Switch to Sign up to create one.",
};

const SERVER_MESSAGE_CODES = new Set([
    "OTP_RESEND_COOLDOWN",
    "OTP_SEND_LIMIT",
    "OTP_IP_LIMIT",
    "OTP_NUMBER_LOCKED",
    "ACCOUNT_REJECTED",
]);

const OAUTH_MESSAGES: Record<string, string> = {
    signup_disabled:
        "No account is linked to this Google account. Sign in with your mobile number first, then link Google from your account page.",
    ACCOUNT_REJECTED: "Your membership request was not approved. Please contact COG.",
};

export function authErrorMessage(error: AuthError) {
    if (!error) return "Something went wrong. Please try again.";

    if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
    if (error.code && SERVER_MESSAGE_CODES.has(error.code) && error.message) return error.message;
    if (error.status === 429) return "Too many requests. Please wait a moment and try again.";

    return "Something went wrong. Please try again.";
}

export function oauthErrorMessage(code: string) {
    if (code === "ACCOUNT_PENDING_APPROVAL") return { pending: true, message: "" };

    return {
        pending: false,
        message: OAUTH_MESSAGES[code] ?? "Google sign-in did not complete. Please try again.",
    };
}
