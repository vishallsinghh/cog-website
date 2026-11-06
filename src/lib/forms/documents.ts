export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export const DOCUMENT_CONTENT_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "application/pdf",
] as const;

export type DocumentContentType = (typeof DOCUMENT_CONTENT_TYPES)[number];

export function isDocumentContentType(value: string): value is DocumentContentType {
    return (DOCUMENT_CONTENT_TYPES as readonly string[]).includes(value);
}

export function safeFileName(name: string) {
    const cleaned = name
        .normalize("NFKC")
        .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
        .trim()
        .slice(-120);

    return cleaned || "document";
}
