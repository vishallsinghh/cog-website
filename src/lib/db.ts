import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "../generated/prisma/client";
import { dbEnv } from "./env";

function createClient() {
    const env = dbEnv();

    const adapter = new PrismaD1({
        CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID,
        CLOUDFLARE_DATABASE_ID: env.CLOUDFLARE_DATABASE_ID,
        CLOUDFLARE_D1_TOKEN: env.CLOUDFLARE_D1_TOKEN,
    });

    return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
