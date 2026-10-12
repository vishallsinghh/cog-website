import { superjson } from "./transformer";
import { cache } from "react";
import { initTRPC, TRPCError } from "@trpc/server";
import { getSession } from "@/lib/auth.utils";
import { hasPermission as roleHasPermission, type RequiredPermissions } from "@/lib/access";
import { getClientIp, writeAuditLog } from "@/lib/audit";

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
export const staffProcedure = permissionProcedure;
export const superAdminProcedure = permissionProcedure({ user: ["set-role"] });
