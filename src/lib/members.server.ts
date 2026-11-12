import { db } from "./db";
import { sendApprovalSms } from "./sms";

const MEMBER_COUNTER = "member";

export function formatMemberId(value: number) {
    return `COG-${String(value).padStart(6, "0")}`;
}

export async function approveMember(userId: string) {
    return db.$transaction(async (tx) => {
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { memberId: true } });

        if (user.memberId) {
            await tx.user.update({ where: { id: userId }, data: { status: "approved" } });
            return { memberId: user.memberId, issued: false };
        }

        const counter = await tx.applicationCounter.upsert({
            where: { key: MEMBER_COUNTER },
            create: { key: MEMBER_COUNTER, value: 1 },
            update: { value: { increment: 1 } },
        });

        const memberId = formatMemberId(counter.value);
        await tx.user.update({ where: { id: userId }, data: { status: "approved", memberId } });

        return { memberId, issued: true };
    });
}

export async function notifyApproved(phoneNumber: string | null, memberId: string) {
    if (!phoneNumber) return false;

    try {
        await sendApprovalSms(phoneNumber, memberId);
        return true;
    } catch (error) {
        console.error(`[sms] approval ${memberId}:`, error instanceof Error ? error.message : "unknown error");
        return false;
    }
}
