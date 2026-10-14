import { db } from "./db";

/**
 * The newest invite for this number that is neither accepted nor expired.
 * One indexed lookup (staff_invite.phoneNumber); runs on every OTP login.
 */
export function findOpenInvite(phoneNumber: string) {
    return db.staffInvite.findFirst({
        where: { phoneNumber, acceptedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
    });
}

/**
 * Deletes every open invite for a number. Used when staff are removed, a role is
 * changed by hand, or an invite is revoked, so an old invite can never grant a
 * role again afterwards. Safe to repeat. The audit log keeps the history.
 */
export async function closeOpenInvites(phoneNumber: string | null | undefined) {
    if (!phoneNumber) return 0;

    const result = await db.staffInvite.deleteMany({
        where: { phoneNumber, acceptedAt: null },
    });

    return result.count;
}

/**
 * Marks one invite accepted. Returns true only for the call that actually flipped it,
 * so the caller writes the audit row exactly once even if the hook runs twice.
 */
export async function markInviteAccepted(inviteId: string) {
    const result = await db.staffInvite.updateMany({
        where: { id: inviteId, acceptedAt: null },
        data: { acceptedAt: new Date() },
    });

    return result.count === 1;
}
