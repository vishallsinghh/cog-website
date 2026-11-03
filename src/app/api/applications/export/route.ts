import ExcelJS from "exceljs";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { routing } from "@/i18n/routing";
import { hasPermission } from "@/lib/access";
import { getClientIp, maskPhone, writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth.utils";
import { db } from "@/lib/db";
import { answerText, type YesNoLabels } from "@/lib/forms/answer-text";
import { parseAnswers, type AnswerValue, type TableRow } from "@/lib/forms/answers";
import { accessLevelAllows, isApplicationStatus } from "@/lib/forms/application-status";
import { allFields, localize, parseDefinition, type FormField } from "@/lib/forms/definition";
import { reviewFiltersSchema } from "@/lib/forms/review.schemas";
import {
    auditFormDenied,
    canSeeContact,
    formAccessLevel,
    hideContactAnswers,
    reviewWhere,
} from "@/lib/forms/review.server";
import { isApproved } from "@/lib/permissions";

const MAX_ROWS = 5000;
const IST_OFFSET_MS = 330 * 60 * 1000;
const NO_STORE = { "cache-control": "private, no-store" };

const querySchema = z.object({
    formId: z.string().trim().min(1).max(100),
    search: z.string().trim().max(100).optional(),
    status: z.string().trim().max(50).optional(),
    jamaat: z.string().trim().max(200).optional(),
    city: z.string().trim().max(200).optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    locale: z.enum(routing.locales).default(routing.defaultLocale),
});

const forbidden = () => new Response(null, { status: 403, headers: NO_STORE });

const istDate = (value: Date | null) => (value ? new Date(value.getTime() + IST_OFFSET_MS) : null);

type DocumentNames = Map<string, string>;

function cellValue(
    field: FormField,
    value: AnswerValue | undefined,
    locale: string,
    labels: YesNoLabels,
    documents: DocumentNames,
): ExcelJS.CellValue {
    if (value === null || value === undefined || value === "") return null;

    switch (field.type) {
        case "number":
            if (typeof value !== "number") return null;
            return field.money ? value / 100 : value;
        case "date":
            return typeof value === "string" ? new Date(`${value}T00:00:00Z`) : null;
        case "document":
            return Array.isArray(value)
                ? value.map((id) => documents.get(String(id))).filter(Boolean).join(", ") || null
                : null;
        case "table":
            if (!Array.isArray(value)) return null;
            return (
                (value as TableRow[])
                    .map((row) =>
                        field.columns
                            .map((column) => `${localize(column.label, locale)}: ${answerText(column, row[column.id], locale, labels) ?? "—"}`)
                            .join(", "),
                    )
                    .join("\n") || null
            );
        default:
            return answerText(field, value, locale, labels);
    }
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const query = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!query.success) return new Response(null, { status: 400, headers: NO_STORE });

    const { from, to, locale, ...rest } = query.data;
    const filters = reviewFiltersSchema.safeParse({
        ...rest,
        search: rest.search || undefined,
        status: rest.status || undefined,
        jamaat: rest.jamaat || undefined,
        city: rest.city || undefined,
        submitted: from || to ? { from, to } : undefined,
    });
    if (!filters.success) return new Response(null, { status: 400, headers: NO_STORE });

    const session = await getSession();
    if (!session?.user) return new Response(null, { status: 401, headers: NO_STORE });

    const user = session.user;
    if (!isApproved(user.status)) return forbidden();

    if (!hasPermission(user.role, { application: ["export"] })) {
        await writeAuditLog({
            actorId: user.id,
            action: "access.denied",
            entityType: "route",
            entityId: "/api/applications/export",
            metadata: { required: JSON.stringify({ application: ["export"] }), role: user.role ?? null },
            ipAddress: await getClientIp(),
        });
        return forbidden();
    }

    const formId = filters.data.formId;
    const level = await formAccessLevel(user.id, user.role, formId);
    if (!accessLevelAllows(level, "view")) {
        await auditFormDenied(user.id, formId, "view", "export");
        return forbidden();
    }

    const form = await db.form.findUnique({
        where: { id: formId },
        select: {
            id: true,
            code: true,
            versions: {
                where: { publishedAt: { not: null } },
                orderBy: { version: "desc" },
                select: { id: true, definition: true },
            },
        },
    });
    if (!form) return new Response(null, { status: 404, headers: NO_STORE });

    const contact = canSeeContact(user.role);
    const applications = await db.application.findMany({
        where: reviewWhere(filters.data, contact),
        orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
        take: MAX_ROWS,
        select: {
            id: true,
            number: true,
            status: true,
            formVersionId: true,
            answers: true,
            jamaat: true,
            city: true,
            submittedAt: true,
            decidedAt: true,
            user: { select: { name: true, memberId: true, phoneNumber: true } },
            documents: { where: { uploadedAt: { not: null } }, select: { id: true, fileName: true } },
        },
    });

    const definitions = new Map(form.versions.map((version) => [version.id, parseDefinition(version.definition)]));
    const usedVersions = new Set(applications.map((application) => application.formVersionId));
    const columns: FormField[] = [];
    const seen = new Set<string>();
    for (const version of form.versions) {
        if (version !== form.versions[0] && !usedVersions.has(version.id)) continue;
        for (const field of allFields(definitions.get(version.id)!)) {
            if (seen.has(field.id)) continue;
            seen.add(field.id);
            columns.push(field);
        }
    }

    const t = await getTranslations({ locale, namespace: "Review.export" });
    const ts = await getTranslations({ locale, namespace: "ApplicationStatuses" });
    const tf = await getTranslations({ locale, namespace: "ApplicationForm" });
    const labels = { yes: tf("yes"), no: tf("no") };

    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();
    const sheet = workbook.addWorksheet(form.code);

    sheet.columns = [
        { header: t("number"), width: 18 },
        { header: t("status"), width: 18 },
        { header: t("submitted"), width: 18, style: { numFmt: "dd-mm-yyyy hh:mm" } },
        { header: t("decided"), width: 18, style: { numFmt: "dd-mm-yyyy hh:mm" } },
        { header: t("applicant"), width: 24 },
        { header: t("memberId"), width: 14 },
        { header: t("mobile"), width: 16 },
        { header: t("jamaat"), width: 20 },
        { header: t("city"), width: 16 },
        ...columns.map((field) => ({
            header: localize(field.label, locale),
            width: field.type === "table" || field.type === "long_text" ? 40 : 20,
            style:
                field.type === "number" && field.money
                    ? { numFmt: '"₹"#,##0.00' }
                    : field.type === "date"
                      ? { numFmt: "dd-mm-yyyy" }
                      : field.type === "table" || field.type === "long_text"
                        ? { alignment: { wrapText: true, vertical: "top" as const } }
                        : {},
        })),
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    for (const application of applications) {
        const definition = definitions.get(application.formVersionId);
        const fieldIds = new Set(definition ? allFields(definition).map((field) => field.id) : []);
        const stored = parseAnswers(application.answers);
        const answers = contact || !definition ? stored : hideContactAnswers(definition, stored);
        const documents: DocumentNames = new Map(application.documents.map((document) => [document.id, document.fileName]));

        sheet.addRow([
            application.number,
            isApplicationStatus(application.status) ? ts(application.status) : application.status,
            istDate(application.submittedAt),
            istDate(application.decidedAt),
            application.user.name,
            application.user.memberId,
            contact ? application.user.phoneNumber : maskPhone(application.user.phoneNumber),
            application.jamaat,
            application.city,
            ...columns.map((field) =>
                fieldIds.has(field.id) ? cellValue(field, answers[field.id], locale, labels, documents) : null,
            ),
        ]);
    }

    const buffer = await workbook.xlsx.writeBuffer();

    await writeAuditLog({
        actorId: user.id,
        action: "application.exported",
        entityType: "form",
        entityId: form.id,
        metadata: {
            form: form.code,
            rows: applications.length,
            status: filters.data.status ?? null,
            jamaat: filters.data.jamaat ?? null,
            city: filters.data.city ?? null,
            from: from ?? null,
            to: to ?? null,
            searched: Boolean(filters.data.search),
        },
        ipAddress: await getClientIp(),
    });

    const today = new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);

    return new Response(new Uint8Array(buffer as ArrayBuffer), {
        status: 200,
        headers: {
            ...NO_STORE,
            "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "content-disposition": `attachment; filename="${form.code}-applications-${today}.xlsx"`,
        },
    });
}
