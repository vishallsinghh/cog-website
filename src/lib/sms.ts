import { env } from "./env";

export async function sendOtpSms(phoneNumber: string, code: string) {
    if (env.NODE_ENV !== "production" || !env.MSG91_AUTH_KEY || !env.MSG91_OTP_TEMPLATE_ID) {
        console.log(`[dev-otp] ${phoneNumber}: ${code}`);
        return;
    }

    const params = new URLSearchParams({
        template_id: env.MSG91_OTP_TEMPLATE_ID,
        mobile: phoneNumber.replace("+", ""),
        otp: code,
    });

    const response = await fetch(`https://control.msg91.com/api/v5/otp?${params}`, {
        method: "POST",
        headers: { authkey: env.MSG91_AUTH_KEY, "content-type": "application/json" },
        body: JSON.stringify({}),
    });

    if (!response.ok) {
        throw new Error(`MSG91 request failed with status ${response.status}`);
    }
}
