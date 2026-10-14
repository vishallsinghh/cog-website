import { aadhaarLast4, normalizeAadhaar } from "./aadhaar";
import { decryptSecret, encryptSecret } from "./crypto";
import { db } from "./db";

export async function storeAadhaarForUser(userId: string, aadhaar: string) {
    const digits = normalizeAadhaar(aadhaar);
    const data = {
        aadhaarEncrypted: encryptSecret(digits),
        aadhaarLast4: aadhaarLast4(digits),
    };

    await db.memberProfile.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
    });
}

export async function readFullAadhaar(userId: string) {
    const profile = await db.memberProfile.findUnique({
        where: { userId },
        select: { aadhaarEncrypted: true },
    });

    return profile?.aadhaarEncrypted ? decryptSecret(profile.aadhaarEncrypted) : null;
}

export async function purgeFullAadhaar(userId: string) {
    await db.memberProfile.updateMany({
        where: { userId },
        data: { aadhaarEncrypted: null },
    });
}
