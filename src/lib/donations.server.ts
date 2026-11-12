import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import type { DonationFilters } from "./donate.schemas";
import { dayRange } from "./list.schemas";
import { capturePayment, fetchPayment, type RazorpayPayment } from "./razorpay";

const RECEIPT_COUNTER = "donation";

export type SettleResult = "paid" | "failed" | "pending" | "unknown";

export function formatReceiptNumber(value: number) {
    return `DON-${String(value).padStart(6, "0")}`;
}

async function markPaid(donationId: string, payment: RazorpayPayment) {
    await db.$transaction(async (tx) => {
        const claimed = await tx.donation.updateMany({
            where: { id: donationId, status: { not: "paid" } },
            data: {
                status: "paid",
                razorpayPaymentId: payment.id,
                method: payment.method ?? null,
                failureReason: null,
                paidAt: new Date(),
            },
        });
        if (claimed.count === 0) return;

        const counter = await tx.applicationCounter.upsert({
            where: { key: RECEIPT_COUNTER },
            create: { key: RECEIPT_COUNTER, value: 1 },
            update: { value: { increment: 1 } },
        });

        await tx.donation.update({
            where: { id: donationId },
            data: { receiptNumber: formatReceiptNumber(counter.value) },
        });
    });
}

async function markFailed(donationId: string, payment: RazorpayPayment) {
    await db.donation.updateMany({
        where: { id: donationId, status: { not: "paid" } },
        data: {
            status: "failed",
            method: payment.method ?? null,
            failureReason: payment.error_description?.slice(0, 300) ?? null,
        },
    });
}

async function captureIfAuthorized(payment: RazorpayPayment, amountPaise: number) {
    if (payment.status !== "authorized") return payment;

    try {
        return await capturePayment(payment.id, amountPaise);
    } catch {
        return fetchPayment(payment.id);
    }
}

export async function settlePayment(payment: RazorpayPayment): Promise<SettleResult> {
    if (!payment.order_id) return "unknown";

    const donation = await db.donation.findUnique({
        where: { razorpayOrderId: payment.order_id },
        select: { id: true, status: true, amountPaise: true },
    });
    if (!donation) return "unknown";
    if (donation.status === "paid") return "paid";

    if (payment.amount !== donation.amountPaise || payment.currency !== "INR") {
        console.error(`[donation] ${donation.id}: payment ${payment.id} does not match the order amount`);
        return "unknown";
    }

    const current = await captureIfAuthorized(payment, donation.amountPaise);

    if (current.status === "captured") {
        await markPaid(donation.id, current);
        return "paid";
    }

    if (current.status === "failed") {
        await markFailed(donation.id, current);
        return "failed";
    }

    return "pending";
}

export function donationWhere(filters: DonationFilters, canSeeContact: boolean): Prisma.DonationWhereInput {
    const and: Prisma.DonationWhereInput[] = [];

    const search = filters.search?.trim();
    if (search) {
        const or: Prisma.DonationWhereInput[] = [
            { receiptNumber: { contains: search } },
            { name: { contains: search } },
            { razorpayPaymentId: { contains: search } },
        ];

        if (canSeeContact) {
            or.push({ email: { contains: search } });
            const digits = search.replace(/\D/g, "");
            if (digits.length >= 4) or.push({ phoneNumber: { contains: digits } });
        }

        and.push({ OR: or });
    }

    if (filters.status) and.push({ status: filters.status });
    if (filters.programme) and.push({ programme: filters.programme });

    const created = dayRange(filters.dates);
    if (created) and.push({ createdAt: created });

    return { AND: and };
}
