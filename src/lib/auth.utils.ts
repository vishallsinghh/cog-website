import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export const getSession = cache(async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    return session;
});


export const requireAuth = cache(async () => {
    const session = await getSession();

    if (!session?.user) {
        return redirect("/sign-in");
    }
    
    return session;
});


export const requireUnAuth = cache(async () => {
    const session = await getSession();

    if (session?.user) {
        return redirect("/");
    }

    return session;
});