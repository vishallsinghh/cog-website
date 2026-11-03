import { AwsClient } from "aws4fetch";
import { storageEnv } from "./env";

export function storageConfigured() {
    try {
        storageEnv();
        return true;
    } catch {
        return false;
    }
}
import { safeFileName } from "./forms/documents";

const UPLOAD_URL_TTL_SECONDS = 300;
const DOWNLOAD_URL_TTL_SECONDS = 120;

let client: AwsClient | undefined;

function r2() {
    const env = storageEnv();

    client ??= new AwsClient({
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        service: "s3",
        region: "auto",
    });

    return client;
}

function objectUrl(key: string) {
    const env = storageEnv();
    const path = key.split("/").map(encodeURIComponent).join("/");

    return new URL(`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${path}`);
}

export function documentStorageKey(applicationId: string) {
    return `applications/${applicationId}/${crypto.randomUUID()}`;
}

export async function createUploadUrl(key: string, contentType: string) {
    const url = objectUrl(key);
    url.searchParams.set("X-Amz-Expires", String(UPLOAD_URL_TTL_SECONDS));

    const signed = await r2().sign(url.toString(), {
        method: "PUT",
        headers: { "content-type": contentType },
        aws: { signQuery: true },
    });

    return signed.url;
}

export async function createDownloadUrl(key: string, fileName: string, contentType: string) {
    const url = objectUrl(key);
    url.searchParams.set("X-Amz-Expires", String(DOWNLOAD_URL_TTL_SECONDS));
    url.searchParams.set(
        "response-content-disposition",
        `inline; filename*=UTF-8''${encodeURIComponent(safeFileName(fileName))}`,
    );
    url.searchParams.set("response-content-type", contentType);
    url.searchParams.set("response-cache-control", "private, no-store");

    const signed = await r2().sign(url.toString(), { method: "GET", aws: { signQuery: true } });

    return signed.url;
}

export async function headObject(key: string) {
    const response = await r2().fetch(objectUrl(key).toString(), { method: "HEAD" });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`R2 HEAD failed with ${response.status}`);

    return {
        size: Number(response.headers.get("content-length") ?? 0),
        contentType: response.headers.get("content-type") ?? "",
    };
}

export async function deleteObject(key: string) {
    const response = await r2().fetch(objectUrl(key).toString(), { method: "DELETE" });

    if (!response.ok && response.status !== 404) throw new Error(`R2 DELETE failed with ${response.status}`);
}
