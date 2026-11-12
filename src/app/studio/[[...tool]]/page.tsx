import { sanityPublicEnv } from "@/lib/env";
import { Studio } from "@/sanity/studio";

export function generateStaticParams() {
    return [{ tool: [] }];
}

export default function StudioPage() {
    if (!sanityPublicEnv()) {
        return (
            <main style={{ fontFamily: "system-ui, sans-serif", padding: 48, maxWidth: 640 }}>
                <h1 style={{ fontSize: 24 }}>Sanity Studio is not set up</h1>
                <p style={{ lineHeight: 1.6 }}>
                    Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET, then reload this page.
                </p>
            </main>
        );
    }

    return <Studio />;
}
