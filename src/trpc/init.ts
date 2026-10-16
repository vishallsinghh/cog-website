import { superjson } from "./transformer";
import { cache } from "react";
import { headers } from "next/headers";
import { initTRPC, TRPCError } from "@trpc/server";
import { hasLocale } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { routing, type AppLocale } from "@/i18n/routing";
import { getSession } from "@/lib/auth.utils";
import { hasPermission as roleHasPermission, type RequiredPermissions } from "@/lib/access";
import { getClientIp, writeAuditLog } from "@/lib/audit";
import { isApproved } from "@/lib/permissions";

export const LOCALE_HEADER = "x-cog-locale";

// The browser client sends its locale in a header because /api/trpc sits outside
// the [locale] segment. Server-side callers fall back to the rendering locale.
async function requestLocale(): Promise<AppLocale> {
    const sent = (await headers()).get(LOCALE_HEADER);
    if (hasLocale(routing.locales, sent)) return sent;

    const current = await getLocale();
    return hasLocale(routing.locales, current) ? current : routing.defaultLocale;
}

export const createTRPCContext = cache(async () => {
    return {
        auth: await getSession(),
        locale: await requestLocale(),
    };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

export const t = initTRPC.context<Context>().create({
    transformer: superjson
});

/** Error messages for the caller's language (messages.Errors). */
export function errorsFor(locale: AppLocale) {
    return getTranslations({ locale, namespace: "Errors" });
}

const hasSession = t.middleware(async ({ ctx, next }) => {
    const session = ctx.auth;

    if (!session?.user?.id) {
        const e = await errorsFor(ctx.locale);
        throw new TRPCError({ code: "UNAUTHORIZED", message: e("unauthorized") });
    }

    return next({
        ctx: {
            ...ctx,
            auth: session,
            userId: session.user.id
        }
    });
});

const isApprovedAccount = t.middleware(async ({ ctx, next, path, type }) => {
    if (!isApproved(ctx.auth?.user?.status)) {
        await writeAuditLog({
            actorId: ctx.auth?.user?.id,
            action: "access.denied",
            entityType: "trpc",
            entityId: path,
            metadata: { procedure: path, type, status: ctx.auth?.user?.status ?? null },
            ipAddress: await getClientIp(),
        });

        const e = await errorsFor(ctx.locale);
        throw new TRPCError({ code: "FORBIDDEN", message: e("forbidden") });
    }

    return next();
});

const hasPermission = (required: RequiredPermissions) =>
    t.middleware(async ({ ctx, next, path, type }) => {
        if (!roleHasPermission(ctx.auth?.user?.role, required)) {
            await writeAuditLog({
                actorId: ctx.auth?.user?.id,
                action: "access.denied",
                entityType: "trpc",
                entityId: path,
                metadata: {
                    procedure: path,
                    type,
                    required: JSON.stringify(required),
                    role: ctx.auth?.user?.role ?? null,
                },
                ipAddress: await getClientIp(),
            });

            const e = await errorsFor(ctx.locale);
            throw new TRPCError({ code: "FORBIDDEN", message: e("forbidden") });
        }

        return next();
    });

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const sessionProcedure = t.procedure.use(hasSession);
export const protectedProcedure = sessionProcedure.use(isApprovedAccount);
export const permissionProcedure = (required: RequiredPermissions) =>
    protectedProcedure.use(hasPermission(required));
export const staffProcedure = permissionProcedure;
export const superAdminProcedure = permissionProcedure({ user: ["set-role"] });
