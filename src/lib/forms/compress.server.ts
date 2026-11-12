import sharp from "sharp";

// HEIC and HEIF are left out: the prebuilt sharp cannot decode them.
const COMPRESSIBLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 80;

export const COMPRESSED_CONTENT_TYPE = "image/webp";

export function canCompress(contentType: string) {
    return COMPRESSIBLE_TYPES.has(contentType);
}

// Turns the photo upright, fits it within 2000px and re-encodes it as WebP. sharp drops
// EXIF data by default, which also removes any GPS location. Returns null when the
// result would not be smaller, so the original is kept.
export async function compressImage(input: Uint8Array) {
    const output = await sharp(input)
        .rotate()
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

    return output.length < input.length ? new Uint8Array(output) : null;
}

export function compressedFileName(fileName: string) {
    const base = fileName.replace(/\.[^.]*$/, "") || "document";
    return `${base}.webp`;
}
