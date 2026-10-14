const TIME_ZONE = "Asia/Kolkata";

const INTL_LOCALE: Record<string, string> = { en: "en-IN", gu: "gu-IN" };

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, withTime: boolean) {
    const id = `${locale}:${withTime}`;
    let value = formatters.get(id);

    if (!value) {
        value = new Intl.DateTimeFormat(INTL_LOCALE[locale] ?? "en-IN", {
            timeZone: TIME_ZONE,
            day: "2-digit",
            month: "short",
            year: "numeric",
            ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
        });
        formatters.set(id, value);
    }

    return value;
}

export const formatDateTime = (value: Date, locale = "en") => formatter(locale, true).format(value);

export const formatDate = (value: Date, locale = "en") => formatter(locale, false).format(value);

/** "+919876543210" -> "+91 98765 43210". Masked values pass through unchanged. */
export function formatPhone(value: string) {
    const match = /^\+91(\d{5})(\d{5})$/.exec(value);

    return match ? `+91 ${match[1]} ${match[2]}` : value;
}
