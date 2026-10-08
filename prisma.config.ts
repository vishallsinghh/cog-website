import { listLocalDatabases } from "@prisma/adapter-d1";
import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

const localD1Directory = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";
const localDatabase = existsSync(localD1Directory)
  ? listLocalDatabases()
      .filter((path) => !path.endsWith("metadata.sqlite"))
      .pop()
  : undefined;

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: `file:${localDatabase ?? "./.wrangler/local.db"}`,
  },
});
