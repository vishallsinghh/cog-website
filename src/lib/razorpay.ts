import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { razorpayEnv } from "./env";

const API = "https://api.razorpay.com/v1";

const orderSchema = z.object({
    id: z.string(),
    amount: z.number().int(),
    currency: z.string(),
});

export const paymentSchema = z.object({
    id: z.string(),
    order_id: z.string().nullable(),
    amount: z.number().int(),
    currency: z.string(),
    status: z.string(),
    method: z.string().nullish(),
    error_description: z.string().nullish(),
});

export type RazorpayPayment = z.infer<typeof paymentSchema>;

function authHeader() {
    const env = razorpayEnv();
    return `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64")}`;
}

async function call<T>(path: string, schema: z.ZodType<T>, init?: { method?: string; body?: unknown }) {
    const response = await fetch(`${API}${path}`, {
        method: init?.method ?? "GET",
        headers: { authorization: authHeader(), "content-type": "application/json" },
        body: init?.body === undefined ? undefined : JSON.stringify(init.body),
        cache: "no-store",
    });

    const json: unknown = await response.json().catch(() => null);

    if (!response.ok) {
        const description = z
            .object({ error: z.object({ description: z.string() }) })
            .safeParse(json);
        throw new Error(`Razorpay ${path} failed: ${description.success ? description.data.error.description : response.status}`);
    }

    return schema.parse(json);
}

export function createOrder(input: { amountPaise: number; receipt: string; notes: Record<string, string> }) {
    return call("/orders", orderSchema, {
        method: "POST",
        body: { amount: input.amountPaise, currency: "INR", receipt: input.receipt, notes: input.notes },
    });
}

export function fetchPayment(paymentId: string) {
    return call(`/payments/${encodeURIComponent(paymentId)}`, paymentSchema);
}

export function capturePayment(paymentId: string, amountPaise: number) {
    return call(`/payments/${encodeURIComponent(paymentId)}/capture`, paymentSchema, {
        method: "POST",
        body: { amount: amountPaise, currency: "INR" },
    });
}

function sameSignature(expected: string, received: string) {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(received, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
}

export function isValidPaymentSignature(orderId: string, paymentId: string, signature: string) {
    const expected = createHmac("sha256", razorpayEnv().RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
    return sameSignature(expected, signature);
}

export function isValidWebhookSignature(body: string, signature: string) {
    const expected = createHmac("sha256", razorpayEnv().RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex");
    return sameSignature(expected, signature);
}

export function publicKeyId() {
    return razorpayEnv().RAZORPAY_KEY_ID;
}
