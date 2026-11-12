import { z } from "zod";
import { settlePayment } from "@/lib/donations.server";
import { razorpayConfigured } from "@/lib/env";
import { isValidWebhookSignature, paymentSchema } from "@/lib/razorpay";

const HANDLED = new Set(["payment.authorized", "payment.captured", "payment.failed", "order.paid"]);

const eventSchema = z.object({
    event: z.string(),
    payload: z.object({
        payment: z.object({ entity: paymentSchema }).optional(),
    }),
});

export async function POST(request: Request) {
    if (!razorpayConfigured()) return new Response(null, { status: 503 });

    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    if (!signature || !isValidWebhookSignature(body, signature)) return new Response(null, { status: 401 });

    let json: unknown;
    try {
        json = JSON.parse(body);
    } catch {
        return new Response(null, { status: 400 });
    }

    const parsed = eventSchema.safeParse(json);
    if (!parsed.success) return new Response(null, { status: 400 });

    const payment = parsed.data.payload.payment?.entity;
    if (!HANDLED.has(parsed.data.event) || !payment) return new Response(null, { status: 200 });

    try {
        await settlePayment(payment);
    } catch (error) {
        console.error(`[donation] webhook ${parsed.data.event}:`, error instanceof Error ? error.message : "unknown error");
        return new Response(null, { status: 500 });
    }

    return new Response(null, { status: 200 });
}
