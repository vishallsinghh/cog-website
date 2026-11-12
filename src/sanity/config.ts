import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { sanityPublicEnv } from "@/lib/env";
import { STUDIO_PATH } from "./constants";
import { schemaTypes } from "./schema";

const env = sanityPublicEnv();

export default defineConfig({
    name: "cog",
    title: "COG Updates",
    basePath: STUDIO_PATH,
    projectId: env?.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "unconfigured",
    dataset: env?.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    plugins: [structureTool()],
    schema: { types: schemaTypes },
});
