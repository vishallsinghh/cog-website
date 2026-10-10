import { superjson } from "./transformer";
import { cache } from "react";
import { initTRPC, TRPCError } from "@trpc/server";
import { getSession } from "@/lib/auth.utils";
import { roles, type AppRole } from "@/lib/permissions";

export const createTRPCContext = cache(async () => {
    return {
        auth: await getSession()
    };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

export const t = initTRPC.context<Context>().create({
    transformer: superjson
});

type RequiredPermissions = Parameters<(typeof roles)[AppRole]["authorize"]>[0];

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

const hasPermission = (required: RequiredPermissions) =>
    t.middleware(({ ctx, next }) => {
        const userRoles = (ctx.auth?.user?.role ?? "").split(",").map((role) => role.trim());

        const allowed = userRoles.some(
            (role) => role in roles && roles[role as AppRole].authorize(required).success
        );

        if (!allowed) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You do not have permission to access this resource."
            });
        }

        return next();
    });

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(hasSession);
export const permissionProcedure = (required: RequiredPermissions) =>
    protectedProcedure.use(hasPermission(required));
export const superAdminProcedure = permissionProcedure({ user: ["set-role"] });
