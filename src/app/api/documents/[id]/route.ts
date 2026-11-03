import { z } from "zod";
import { getClientIp, writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth.utils";
import { db } from "@/lib/db";
import { accessLevelAllows } from "@/lib/forms/application-status";
import { auditFormDenied, formAccessLevel } from "@/lib/forms/review.server";
import { isApproved } from "@/lib/permissions";
import { createDownloadUrl, storageConfigured } from "@/lib/storage";

const paramsSchema = z.object({ id: z.string().trim().min(1).max(100) });

const NO_STORE = { "cache-control": "private, no-store" };

const notFound = () => new Response(null, { status: 404, headers: NO_STORE });

export async function GET(_request: Request, ctx: RouteContext<"/api/documents/[id]">) {
    const params = paramsSchema.safeParse(await ctx.params);
    if (!params.success) return notFound();

    const session = await getSession();
    if (!session?.user) return new Response(null, { status: 401, headers: NO_STORE });

    const document = await db.applicationDocument.findUnique({
        where: { id: params.data.id },
        include: { application: { select: { id: true, userId: true, formId: true, status: true, number: true } } },
    });

    if (!document?.uploadedAt) return notFound();

    const application = document.application;
    const owner = application.userId === session.user.id;

    if (!owner) {
        if (!isApproved(session.user.status) || application.status === "draft") return notFound();

        const level = await formAccessLevel(session.user.id, session.user.role, application.formId);
        if (!accessLevelAllows(level, "view")) {
            await auditFormDenied(session.user.id, application.formId, "view", `document:${document.id}`);
            return notFound();
        }
    }

    if (!storageConfigured()) return new Response(null, { status: 503, headers: NO_STORE });

    if (!owner) {
        await writeAuditLog({
            actorId: session.user.id,
            action: "application.document.viewed",
            entityType: "application",
            entityId: application.id,
            metadata: { number: application.number, documentId: document.id },
            ipAddress: await getClientIp(),
        });
    }

    const url = await createDownloadUrl(document.storageKey, document.fileName, document.contentType);

    return new Response(null, { status: 302, headers: { ...NO_STORE, location: url } });
}
