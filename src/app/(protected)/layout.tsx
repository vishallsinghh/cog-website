import { Suspense } from "react";
import { Shell } from "@/components/site-shell";
import { requireAuth } from "@/lib/auth.utils";

async function RequireAuth({ children }: { children: React.ReactNode }) {
    await requireAuth();
    return children;
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    return (
        <Shell>
            <Suspense fallback={null}>
                <RequireAuth>{children}</RequireAuth>
            </Suspense>
        </Shell>
    );
}
