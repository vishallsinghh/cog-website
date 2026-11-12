import ExcelJS from "exceljs";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { routing } from "@/i18n/routing";
import { hasPermission } from "@/lib/access";
import { getClientIp, maskPhone, writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth.utils";
import { db } from "@/lib/db";
import { donationFiltersSchema, isDonationProgramme, isDonationStatus } from "@/lib/donate.schemas";
import { donationWhere } from "@/lib/donations.server";
import { isApproved } from "@/lib/permissions";

const MAX_ROWS = 10000;
const IST_OFFSET_MS = 330 * 60 * 1000;
const NO_STORE = { "cache-control": "private, no-store" };

const querySchema = z.object({
    search: z.string().trim().max(100).optional(),
    status: z.string().trim().max(20).optional(),
    programme: z.string().trim().max(20).optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    locale: z.enum(routing.locales).default(routing.defaultLocale),
});

const forbidden = () => new Response(null, { status: 403, headers: NO_STORE });

const istDate = (value: Date | null) => (value ? new Date(value.getTime() + IST_OFFSET_MS) : null);

export async function GET(request: Request) {
    const url = new URL(request.url);
    const query = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!query.success) return new Response(null, { status: 400, headers: NO_STORE });

    const { from, to, locale, ...rest } = query.data;
    const filters = donationFiltersSchema.safeParse({
        search: rest.search || undefined,
        status: rest.status || undefined,
        programme: rest.programme || undefined,
        dates: from || to ? { from, to } : undefined,
    });
    if (!filters.success) return new Response(null, { status: 400, headers: NO_STORE });

    const session = await getSession();
    if (!session?.user) return new Response(null, { status: 401, headers: NO_STORE });

    const user = session.user;
    if (!isApproved(user.status)) return forbidden();

    const required = { donation: ["export"] } as const;
    if (!hasPermission(user.role, required)) {
        await writeAuditLog({
            actorId: user.id,
            action: "access.denied",
            entityType: "route",
            entityId: "/api/donations/export",
            metadata: { required: JSON.stringify(required), role: user.role ?? null },
            ipAddress: await getClientIp(),
        });
        return forbidden();
    }

    const contact = hasPermission(user.role, { member: ["readContact"] });
    const donations = await db.donation.findMany({
        where: donationWhere(filters.data, contact),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: MAX_ROWS,
        select: {
            receiptNumber: true,
            name: true,
            phoneNumber: true,
            email: true,
            programme: true,
            amountPaise: true,
            status: true,
            method: true,
            razorpayOrderId: true,
            razorpayPaymentId: true,
            createdAt: true,
            paidAt: true,
            user: { select: { memberId: true } },
        },
    });

    const t = await getTranslations({ locale, namespace: "Donations.export" });
    const ts = await getTranslations({ locale, namespace: "Donations.statuses" });
    const tp = await getTranslations({ locale, namespace: "Donate.programmes" });

    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();
    const sheet = workbook.addWorksheet(t("sheet"));

    sheet.columns = [
        { header: t("receipt"), width: 14 },
        { header: t("status"), width: 16 },
        { header: t("created"), width: 18, style: { numFmt: "dd-mm-yyyy hh:mm" } },
        { header: t("paid"), width: 18, style: { numFmt: "dd-mm-yyyy hh:mm" } },
        { header: t("donor"), width: 24 },
        { header: t("memberId"), width: 14 },
        { header: t("mobile"), width: 16 },
        { header: t("email"), width: 28 },
        { header: t("programme"), width: 22 },
        { header: t("amount"), width: 14, style: { numFmt: '"₹"#,##0.00' } },
        { header: t("method"), width: 12 },
        { header: t("paymentId"), width: 22 },
        { header: t("orderId"), width: 22 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    for (const donation of donations) {
        sheet.addRow([
            donation.receiptNumber,
            isDonationStatus(donation.status) ? ts(donation.status) : donation.status,
            istDate(donation.createdAt),
            istDate(donation.paidAt),
            donation.name,
            donation.user?.memberId ?? null,
            contact ? donation.phoneNumber : maskPhone(donation.phoneNumber),
            contact ? donation.email : null,
            isDonationProgramme(donation.programme) ? tp(donation.programme) : donation.programme,
            donation.amountPaise / 100,
            donation.method,
            donation.razorpayPaymentId,
            donation.razorpayOrderId,
        ]);
    }

    const buffer = await workbook.xlsx.writeBuffer();

    await writeAuditLog({
        actorId: user.id,
        action: "donation.exported",
        entityType: "donation",
        entityId: null,
        metadata: {
            rows: donations.length,
            status: filters.data.status ?? null,
            programme: filters.data.programme ?? null,
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
            "content-disposition": `attachment; filename="donations-${today}.xlsx"`,
        },
    });
}
