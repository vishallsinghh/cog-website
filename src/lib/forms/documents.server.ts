import { db } from "@/lib/db";
import { deleteObject, storageConfigured } from "@/lib/storage";

// Removes every file a member uploaded, across all of their applications. It throws if
// any file is left behind, so callers delete the account only once its files are gone.
// Running it again is safe: R2 treats an already-deleted file as removed.
export async function deleteUserDocuments(userId: string) {
    const documents = await db.applicationDocument.findMany({
        where: { application: { userId } },
        select: { storageKey: true },
    });

    if (documents.length === 0) return;
    if (!storageConfigured()) throw new Error("Document storage is not configured");

    const results = await Promise.allSettled(documents.map((document) => deleteObject(document.storageKey)));
    const failed = results.filter((result) => result.status === "rejected").length;

    if (failed > 0) throw new Error(`${failed} of ${documents.length} documents could not be deleted`);
}
