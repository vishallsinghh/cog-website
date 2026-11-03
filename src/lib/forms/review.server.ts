import { getTranslations } from "next-intl/server";
import type { Prisma } from "@/generated/prisma/client";
import { hasPermission } from "@/lib/access";
import { getClientIp, maskPhone, writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { dayRange } from "@/lib/list.schemas";
import { sendApplicationSms } from "@/lib/sms";
import type { Answers } from "./answers";
import {
    isFormAccessLevel,
    lowerAccessLevel,
    type ApplicationStatus,
    type FormAccessLevel,
} from "./application-status";
import { allFields, type FormDefinition, type PrefillSource } from "./definition";
import type { ReviewFilters } from "./review.schemas";

export function roleAccessLevel(role: string | null | undefined): FormAccessLevel | null {
    if (hasPermission(role, { application: ["decide"] })) return "decide";
    if (hasPermission(role, { application: ["review"] })) return "review";
    if (hasPermission(role, { application: ["read"] })) return "view";
    return null;
}

export function seesAllForms(role: string | null | undefined) {
    return hasPermission(role, { form: ["assign"] });
}

export function canSeeContact(role: string | null | undefined) {
    return hasPermission(role, { member: ["readContact"] });
}

export async function formAccessLevels(userId: string, role: string | null | undefined) {
    const levels = new Map<string, FormAccessLevel>();
    const roleLevel = roleAccessLevel(role);
    if (!roleLevel) return levels;

    if (seesAllForms(role)) {
        const forms = await db.form.findMany({ select: { id: true } });
        for (const form of forms) levels.set(form.id, roleLevel);
        return levels;
    }

    const grants = await db.formAccess.findMany({ where: { userId }, select: { formId: true, level: true } });
    for (const grant of grants) {
        if (isFormAccessLevel(grant.level)) levels.set(grant.formId, lowerAccessLevel(roleLevel, grant.level));
    }

    return levels;
}

export async function formAccessLevel(userId: string, role: string | null | undefined, formId: string) {
    const roleLevel = roleAccessLevel(role);
    if (!roleLevel) return null;
    if (seesAllForms(role)) return roleLevel;

    const grant = await db.formAccess.findUnique({
        where: { formId_userId: { formId, userId } },
        select: { level: true },
    });

    return isFormAccessLevel(grant?.level) ? lowerAccessLevel(roleLevel, grant.level) : null;
}

export async function auditFormDenied(actorId: string, formId: string, needed: FormAccessLevel, entity: string) {
    await writeAuditLog({
        actorId,
        action: "access.denied",
        entityType: "form",
        entityId: formId,
        metadata: { needed, entity },
        ipAddress: await getClientIp(),
    });
}

export function reviewWhere(filters: ReviewFilters, canSearchPhone: boolean): Prisma.ApplicationWhereInput {
    const and: Prisma.ApplicationWhereInput[] = [
        { formId: filters.formId },
        { status: filters.status ?? { not: "draft" } },
    ];

    const search = filters.search?.trim();
    if (search) {
        const or: Prisma.ApplicationWhereInput[] = [
            { number: { contains: search.toUpperCase() } },
            { user: { name: { contains: search } } },
            { user: { memberId: { contains: search } } },
        ];

        const digits = search.replace(/\D/g, "");
        if (canSearchPhone && digits.length >= 3) or.push({ user: { phoneNumber: { contains: digits } } });

        and.push({ OR: or });
    }

    if (filters.jamaat) and.push({ jamaat: filters.jamaat });
    if (filters.city) and.push({ city: filters.city });

    const submitted = dayRange(filters.submitted);
    if (submitted) and.push({ submittedAt: submitted });

    return { AND: and };
}

const CONTACT_SOURCES = new Set<PrefillSource>(["phoneNumber", "contactEmail", "addressLine1", "addressLine2", "pincode"]);

export function hideContactAnswers(definition: FormDefinition, answers: Answers): Answers {
    const hidden = { ...answers };

    for (const field of allFields(definition)) {
        if (field.type !== "short_text" && field.type !== "long_text") continue;
        if (!field.prefill || !CONTACT_SOURCES.has(field.prefill)) continue;

        const value = hidden[field.id];
        if (typeof value !== "string" || !value) continue;

        hidden[field.id] = field.prefill === "phoneNumber" ? maskPhone(value) : "••••••";
    }

    return hidden;
}

export async function notifyApplicant(userId: string, number: string, status: ApplicationStatus) {
    try {
        const user = await db.user.findUnique({ where: { id: userId }, select: { phoneNumber: true } });
        if (!user?.phoneNumber) return false;

        const ts = await getTranslations({ locale: "en", namespace: "ApplicationStatuses" });
        await sendApplicationSms(user.phoneNumber, { number, status: ts(status) });
        return true;
    } catch (error) {
        console.error(`[sms] application ${number}:`, error instanceof Error ? error.message : "unknown error");
        return false;
    }
}
