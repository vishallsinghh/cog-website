import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { hasPermission, type RequiredPermissions } from "./access";
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
        return redirect("/member");
    }
    
    return session;
});


export const requireUnAuth = cache(async () => {
    const session = await getSession();

    if (session?.user) {
        return redirect("/dashboard");
    }

    return session;
});


export async function requirePermission(required: RequiredPermissions) {
    const session = await requireAuth();

    if (!hasPermission(session.user.role, required)) {
        return redirect("/dashboard");
    }

    return session;
}


export async function requireNavAccess(href: string) {
    const item = findNavItem(href);

    if (!item) return notFound();

    if (item.permission) {
        await requirePermission(item.permission);
    } else {
        await requireAuth();
    }

    return item;
}
