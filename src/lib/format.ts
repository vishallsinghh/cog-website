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

const rupeeFormatters = new Map<string, Intl.NumberFormat>();

/** Money is held in paise; this renders it as rupees. */
export function formatRupees(paise: number, locale = "en") {
    let value = rupeeFormatters.get(locale);

    if (!value) {
        value = new Intl.NumberFormat(INTL_LOCALE[locale] ?? "en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
        rupeeFormatters.set(locale, value);
    }

    return value.format(paise / 100);
}

export function formatFileSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** "2026-03-14" -> "14 Mar 2026", read as a calendar date with no time zone shift. */
export const formatIsoDate = (value: string, locale = "en") => formatDate(new Date(`${value}T12:00:00Z`), locale);
