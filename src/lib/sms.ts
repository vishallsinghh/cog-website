import { smsEnv } from "./env";

const MSG91_OTP_URL = "https://control.msg91.com/api/v5/otp";

export async function sendOtpSms(phoneNumber: string, code: string) {
    const env = smsEnv();

    if (!env.MSG91_AUTH_KEY || !env.MSG91_OTP_TEMPLATE_ID) {
        console.log(`[otp] ${phoneNumber}: ${code}`);
        return;
    }

    const params = new URLSearchParams({
        template_id: env.MSG91_OTP_TEMPLATE_ID,
        mobile: phoneNumber.replace("+", ""),
        otp: code,
    });

    const response = await fetch(`${MSG91_OTP_URL}?${params}`, {
        method: "POST",
        headers: { authkey: env.MSG91_AUTH_KEY, "content-type": "application/json" },
        body: JSON.stringify({}),
    });

    const result = (await response.json().catch(() => null)) as { type?: string; message?: string } | null;

    if (!response.ok || result?.type !== "success") {
        throw new Error(`MSG91 OTP request failed: ${result?.message ?? response.status}`);
    }
}

const MSG91_FLOW_URL = "https://control.msg91.com/api/v5/flow";

export async function sendApplicationSms(phoneNumber: string, values: { number: string; status: string }) {
    const env = smsEnv();

    if (!env.MSG91_AUTH_KEY || !env.MSG91_APPLICATION_TEMPLATE_ID) {
        console.log(`[sms] ${phoneNumber}: application ${values.number} is now ${values.status}`);
        return;
    }

    const response = await fetch(MSG91_FLOW_URL, {
        method: "POST",
        headers: { authkey: env.MSG91_AUTH_KEY, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
            template_id: env.MSG91_APPLICATION_TEMPLATE_ID,
            short_url: "0",
            recipients: [{ mobiles: phoneNumber.replace("+", ""), number: values.number, status: values.status }],
        }),
    });

    const result = (await response.json().catch(() => null)) as { type?: string; message?: string } | null;

    if (!response.ok || result?.type !== "success") {
        throw new Error(`MSG91 flow request failed: ${result?.message ?? response.status}`);
    }
}
