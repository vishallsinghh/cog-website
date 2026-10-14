import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { aadhaarEnv } from "./env";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

function key() {
    return Buffer.from(aadhaarEnv().AADHAAR_ENCRYPTION_KEY, "base64");
}

export function encryptSecret(plain: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, key(), iv);
    const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);

    return [VERSION, iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}

export function decryptSecret(payload: string) {
    const [version, iv, tag, data] = payload.split(":");

    if (version !== VERSION || !iv || !tag || !data) throw new Error("Unsupported encrypted payload");

    const decipher = createDecipheriv(ALGORITHM, key(), Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));

    return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
