import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../generated/prisma/client";
import { dbEnv } from "./env";

function createClient() {
    const env = dbEnv();

    const adapter = new PrismaLibSql({
        url: env.TURSO_DATABASE_URL,
        authToken: env.TURSO_AUTH_TOKEN,
    });

    return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
