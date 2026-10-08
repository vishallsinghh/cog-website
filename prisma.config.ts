import { listLocalDatabases } from "@prisma/adapter-d1";
import { defineConfig } from "prisma/config";

const localDatabase = listLocalDatabases()
    .filter((path) => !path.endsWith("metadata.sqlite"))
    .pop();

export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        url: `file:${localDatabase ?? "./.wrangler/local.db"}`,
    },
});
