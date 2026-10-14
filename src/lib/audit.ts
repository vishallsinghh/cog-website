import { headers } from "next/headers";
import { db } from "./db";

export type AuditMetadata = Record<string, string | number | boolean | null>;

export type AuditLogInput = {
    actorId?: string | null;
    action: string;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: AuditMetadata;
    ipAddress?: string | null;
};

// Defence in depth: Aadhaar numbers, OTPs and tokens must never reach the log.
// Callers should not pass them in the first place; this drops them if they do.
const FORBIDDEN_KEY = /aadhaar|otp|token|secret|password|code|cookie/i;
const MAX_METADATA_LENGTH = 2000;

function cleanMetadata(metadata: AuditMetadata | undefined) {
    if (!metadata) return null;

    const entries = Object.entries(metadata).filter(([key]) => !FORBIDDEN_KEY.test(key));
    if (entries.length === 0) return null;

    return JSON.stringify(Object.fromEntries(entries)).slice(0, MAX_METADATA_LENGTH);
}

export async function getClientIp() {
    try {
        const list = await headers();
        const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();

        return forwarded || list.get("x-real-ip")?.trim() || null;
    } catch {
        return null;
    }
}

/**
 * Writes one audit row. Never throws: a failed audit write must not break the
 * action being audited, and must not mask an access-denied error.
 */
export async function writeAuditLog(input: AuditLogInput) {
    try {
        await db.auditLog.create({
            data: {
                actorId: input.actorId ?? null,
                action: input.action,
                entityType: input.entityType ?? null,
                entityId: input.entityId ?? null,
                metadata: cleanMetadata(input.metadata),
                ipAddress: input.ipAddress ?? null,
            },
        });
    } catch (error) {
        console.error(
            `[audit] failed to write "${input.action}":`,
            error instanceof Error ? error.message : "unknown error",
        );
    }
}

export function maskPhone(phoneNumber: string | null | undefined) {
    if (!phoneNumber) return "";
    const digits = phoneNumber.replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) return "••••••••••";

    return `+91 ${digits.slice(0, 2)}•••••${digits.slice(7)}`;
}
