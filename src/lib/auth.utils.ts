import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { hasPermission, type RequiredPermissions } from "./access";
import { getClientIp, writeAuditLog } from "./audit";
import { auth } from "./auth";
import { findNavItem } from "./navigation";

export const getSession = cache(async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    return session;
});


export const requireAuth = cache(async () => {
    const session = await getSession();

    if (!session?.user) {
        return redirect({ href: "/member", locale: await getLocale() });
    }

    return session;
});


export const requireUnAuth = cache(async () => {
    const session = await getSession();

    if (session?.user) {
        return redirect({ href: "/dashboard", locale: await getLocale() });
    }

    return session;
});


export async function requirePermission(required: RequiredPermissions, page?: string) {
    const session = await requireAuth();

    if (!hasPermission(session.user.role, required)) {
        // Every denied access attempt is recorded, pages as well as tRPC calls.
        await writeAuditLog({
            actorId: session.user.id,
            action: "access.denied",
            entityType: "page",
            entityId: page ?? null,
            metadata: { required: JSON.stringify(required), role: session.user.role ?? null },
            ipAddress: await getClientIp(),
        });

        return redirect({ href: "/dashboard", locale: await getLocale() });
    }

    return session;
}


export async function requireNavAccess(href: string) {
    const item = findNavItem(href);

    if (!item) return notFound();

    if (item.permission) {
        await requirePermission(item.permission, href);
    } else {
        await requireAuth();
    }

    return item;
}
