import { randomUUID } from "node:crypto";
import { hasPermission } from "@/lib/access";
import { getClientIp, maskPhone } from "@/lib/audit";
import { db } from "@/lib/db";
import { donationConfirmSchema, donationListInputSchema, donationStartSchema } from "@/lib/donate.schemas";
import { donationWhere, settlePayment } from "@/lib/donations.server";
import { razorpayConfigured } from "@/lib/env";
import { allowDonationConfirm, allowDonationStart } from "@/lib/rate-limit";
import { createOrder, fetchPayment, isValidPaymentSignature, publicKeyId } from "@/lib/razorpay";
import { baseProcedure, createTRPCRouter, fail, protectedProcedure, staffProcedure } from "../init";

function maskEmail(value: string) {
    const [local, domain] = value.split("@");
    return domain ? `${local.slice(0, 1)}•••@${domain}` : "•••";
}

export const donationsRouter = createTRPCRouter({
    start: baseProcedure.input(donationStartSchema).mutation(async ({ ctx, input }) => {
        if (!razorpayConfigured()) return fail(ctx.locale, "PRECONDITION_FAILED", "donationsUnavailable");
        if (!(await allowDonationStart(await getClientIp()))) {
            return fail(ctx.locale, "TOO_MANY_REQUESTS", "tooManyDonationAttempts");
        }

        const id = randomUUID();

        let order;
        try {
            order = await createOrder({
                amountPaise: input.amountPaise,
                receipt: id,
                notes: { donationId: id, programme: input.programme },
            });
        } catch (error) {
            console.error("[donation] order:", error instanceof Error ? error.message : "unknown error");
            return fail(ctx.locale, "INTERNAL_SERVER_ERROR", "donationsUnavailable");
        }

        await db.donation.create({
            data: {
                id,
                userId: ctx.auth?.user?.id ?? null,
                name: input.name,
                phoneNumber: input.mobile,
                email: input.email,
                programme: input.programme,
                amountPaise: input.amountPaise,
                razorpayOrderId: order.id,
            },
        });

        return {
            keyId: publicKeyId(),
            orderId: order.id,
            amountPaise: order.amount,
            name: input.name,
            email: input.email,
            contact: input.mobile,
        };
    }),

    confirm: baseProcedure.input(donationConfirmSchema).mutation(async ({ ctx, input }) => {
        if (!razorpayConfigured()) return fail(ctx.locale, "PRECONDITION_FAILED", "donationsUnavailable");
        if (!(await allowDonationConfirm(await getClientIp()))) {
            return fail(ctx.locale, "TOO_MANY_REQUESTS", "tooManyDonationAttempts");
        }

        if (!isValidPaymentSignature(input.orderId, input.paymentId, input.signature)) {
            return fail(ctx.locale, "BAD_REQUEST", "paymentNotConfirmed");
        }

        let status;
        try {
            const payment = await fetchPayment(input.paymentId);
            if (payment.order_id !== input.orderId) return fail(ctx.locale, "BAD_REQUEST", "paymentNotConfirmed");
            status = await settlePayment(payment);
        } catch (error) {
            console.error("[donation] confirm:", error instanceof Error ? error.message : "unknown error");
            status = "pending" as const;
        }

        const donation = await db.donation.findUnique({
            where: { razorpayOrderId: input.orderId },
            select: { status: true, receiptNumber: true, amountPaise: true, programme: true },
        });
        if (!donation) return fail(ctx.locale, "NOT_FOUND", "paymentNotConfirmed");

        return {
            status: donation.status === "paid" ? ("paid" as const) : status === "failed" ? ("failed" as const) : ("pending" as const),
            receiptNumber: donation.receiptNumber,
            amountPaise: donation.amountPaise,
            programme: donation.programme,
        };
    }),

    mine: protectedProcedure.query(async ({ ctx }) => {
        const phoneNumber = ctx.auth.user.phoneNumber;

        return db.donation.findMany({
            where: {
                status: "paid",
                OR: [{ userId: ctx.userId }, ...(phoneNumber ? [{ phoneNumber }] : [])],
            },
            orderBy: { paidAt: "desc" },
            select: {
                id: true,
                receiptNumber: true,
                programme: true,
                amountPaise: true,
                method: true,
                paidAt: true,
                razorpayPaymentId: true,
            },
        });
    }),

    list: staffProcedure({ donation: ["read"] })
        .input(donationListInputSchema)
        .query(async ({ ctx, input }) => {
            const role = ctx.auth.user.role;
            const canSeeContact = hasPermission(role, { member: ["readContact"] });
            const where = donationWhere(input, canSeeContact);

            const [total, paid, rows] = await Promise.all([
                db.donation.count({ where }),
                db.donation.aggregate({
                    where: { AND: [where, { status: "paid" }] },
                    _count: { _all: true },
                    _sum: { amountPaise: true },
                }),
                db.donation.findMany({
                    where,
                    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                    skip: (input.page - 1) * input.pageSize,
                    take: input.pageSize,
                    select: {
                        id: true,
                        receiptNumber: true,
                        name: true,
                        phoneNumber: true,
                        email: true,
                        programme: true,
                        amountPaise: true,
                        status: true,
                        method: true,
                        razorpayPaymentId: true,
                        failureReason: true,
                        paidAt: true,
                        createdAt: true,
                        user: { select: { memberId: true } },
                    },
                }),
            ]);

            return {
                page: input.page,
                pageSize: input.pageSize,
                total,
                paidCount: paid._count._all,
                paidAmountPaise: paid._sum.amountPaise ?? 0,
                canSeeContact,
                canExport: hasPermission(role, { donation: ["export"] }),
                rows: rows.map(({ user, ...row }) => ({
                    ...row,
                    memberId: user?.memberId ?? null,
                    phoneNumber: canSeeContact ? row.phoneNumber : maskPhone(row.phoneNumber),
                    email: canSeeContact ? row.email : maskEmail(row.email),
                })),
            };
        }),
});
