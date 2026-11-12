export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;

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

// How many leading bytes matchesClaimedType needs to read.
export const SIGNATURE_BYTES = 16;

// Brands an ISO media file names in its "ftyp" box when it holds a HEIC/HEIF image.
const HEIF_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1", "heif"]);

function startsWith(bytes: Uint8Array, signature: readonly number[]) {
    return signature.every((byte, index) => bytes[index] === byte);
}

function ascii(bytes: Uint8Array, start: number, end: number) {
    return String.fromCharCode(...bytes.subarray(start, end));
}

// Checks a file's first bytes against the type it claims to be. The name and the type
// the browser sends are only claims, so a renamed SVG or HTML page fails here.
export function matchesClaimedType(bytes: Uint8Array, contentType: DocumentContentType) {
    switch (contentType) {
        case "image/jpeg":
            return startsWith(bytes, [0xff, 0xd8, 0xff]);
        case "image/png":
            return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        case "image/webp":
            return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP";
        case "application/pdf":
            return ascii(bytes, 0, 5) === "%PDF-";
        case "image/heic":
        case "image/heif":
            return ascii(bytes, 4, 8) === "ftyp" && HEIF_BRANDS.has(ascii(bytes, 8, 12));
    }
}

export function safeFileName(name: string) {
    const cleaned = name
        .normalize("NFKC")
        .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
        .trim()
        .slice(-120);

    return cleaned || "document";
}
