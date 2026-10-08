import { superjson } from "./transformer";
import { cache } from "react";
import { initTRPC, TRPCError } from "@trpc/server";
import { getSession } from "@/lib/auth.utils";

export const createTRPCContext = cache(async () => {
    return {
        auth: await getSession()
    };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

export const t = initTRPC.context<Context>().create({
    transformer: superjson
});

const hasSession = t.middleware(({ ctx, next }) => {
    const session = ctx.auth;

    if (!session?.user?.id) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to access this resource."
        });
    }

    return next({
        ctx: {
            ...ctx,
            auth: session,
            userId: session.user.id
        }
    });
});

const isAdmin = t.middleware(({ ctx, next }) => {
    const role = ctx.auth?.user?.role;

    if (role !== "INTERNAL" && role !== "SUPERADMIN") {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins and super admins can access this resource."
        });
    }

    return next();
});

const isSuperAdmin = t.middleware(({ ctx, next }) => {
    if (ctx.auth?.user?.role !== "SUPERADMIN") {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only super admins can access this resource."
        });
    }

    return next();
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(hasSession);
export const internalUserProcedure = protectedProcedure.use(isAdmin);
export const superAdminProcedure = protectedProcedure.use(isSuperAdmin);
