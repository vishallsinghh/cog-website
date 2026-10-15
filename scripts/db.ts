import { createClient } from "@libsql/client";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const MIGRATIONS_DIR = "migrations";

const targetSchema = z.object({
    TURSO_DATABASE_URL: z.string().min(1),
    TURSO_AUTH_TOKEN: z.string().optional(),
});

function splitStatements(sql: string) {
    return sql
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .split(";")
        .map((statement) => statement.trim())
        .filter(Boolean);
}

function migrationFiles() {
    return readdirSync(MIGRATIONS_DIR)
        .filter((file) => file.endsWith(".sql"))
        .sort();
}

function createMigration(name: string | undefined) {
    if (!name || !/^[a-z0-9_]+$/.test(name)) {
        throw new Error("Usage: npm run db:migration:new -- <snake_case_name>");
    }

    const files = migrationFiles();
    const last = files.at(-1);
    const next = String((last ? Number.parseInt(last.slice(0, 4), 10) : 0) + 1).padStart(4, "0");
    const path = join(MIGRATIONS_DIR, `${next}_${name}.sql`);

    mkdirSync(MIGRATIONS_DIR, { recursive: true });
    writeFileSync(path, "", { flag: "wx" });
    console.log(`Created ${path}`);
}

async function applyMigrations(url: string, authToken: string | undefined, track = true) {
    const client = createClient({ url, authToken });

    if (track) {
        await client.execute(
            `CREATE TABLE IF NOT EXISTS "_migration" ("name" TEXT NOT NULL PRIMARY KEY, "appliedAt" TEXT NOT NULL)`,
        );
    }

    const done = new Set(
        track
            ? (await client.execute(`SELECT "name" FROM "_migration"`)).rows.map((row) => String(row.name))
            : [],
    );

    let applied = 0;

    for (const file of migrationFiles()) {
        if (done.has(file)) continue;

        const statements = splitStatements(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));

        await client.batch(
            [
                ...statements,
                ...(track
                    ? [
                          {
                              sql: `INSERT INTO "_migration" ("name", "appliedAt") VALUES (?, ?)`,
                              args: [file, new Date().toISOString()],
                          },
                      ]
                    : []),
            ],
            "write",
        );

        console.log(`Applied ${file}`);
        applied++;
    }

    console.log(applied === 0 ? "Database is up to date." : `Applied ${applied} migration(s).`);
    client.close();
}

async function main() {
    const [command, argument] = process.argv.slice(2);

    if (command === "new") return createMigration(argument);

    if (command === "apply") {
        const target = targetSchema.parse(process.env);
        return applyMigrations(target.TURSO_DATABASE_URL, target.TURSO_AUTH_TOKEN);
    }

    if (command === "apply-schema-check") {
        mkdirSync(".local", { recursive: true });
        rmSync(".local/schema-check.db", { force: true });
        return applyMigrations("file:./.local/schema-check.db", undefined, false);
    }

    throw new Error("Commands: new <name> | apply | apply-schema-check");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
