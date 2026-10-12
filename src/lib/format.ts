const TIME_ZONE = "Asia/Kolkata";

const dateTime = new Intl.DateTimeFormat("en-IN", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

const dateOnly = new Intl.DateTimeFormat("en-IN", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
});

export const formatDateTime = (value: Date) => dateTime.format(value);

export const formatDate = (value: Date) => dateOnly.format(value);

/** "+919876543210" -> "+91 98765 43210". Masked values pass through unchanged. */
export function formatPhone(value: string) {
    const match = /^\+91(\d{5})(\d{5})$/.exec(value);

    return match ? `+91 ${match[1]} ${match[2]}` : value;
}
