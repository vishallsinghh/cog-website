import { Suspense } from "react";
import { Shell } from "@/components/site-shell";
import { requireUnAuth } from "@/lib/auth.utils";

async function RequireUnAuth({ children }: { children: React.ReactNode }) {
    await requireUnAuth();
    return children;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <Shell>
            <Suspense fallback={null}>
                <RequireUnAuth>{children}</RequireUnAuth>
            </Suspense>
        </Shell>
    );
}
