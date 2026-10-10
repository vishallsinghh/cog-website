import { Suspense } from "react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { primaryRoleLabel } from "@/lib/access";
import { requireAuth } from "@/lib/auth.utils";
import { navForRole } from "@/lib/navigation";
import { TRPCReactProvider } from "@/trpc/client";

export const instant = false;

async function ProtectedShell({ children }: { children: React.ReactNode }) {
    const { user } = await requireAuth();

    return (
        <TRPCReactProvider>
            <TooltipProvider>
                <SidebarProvider>
                    <AppSidebar
                        groups={navForRole(user.role)}
                        user={{
                            name: user.name,
                            phoneNumber: user.phoneNumber ?? "",
                            roleLabel: primaryRoleLabel(user.role),
                        }}
                    />
                    <SidebarInset>
                        <DashboardHeader />
                        <div className="flex flex-1 flex-col p-4 sm:p-6 lg:p-10">{children}</div>
                    </SidebarInset>
                </SidebarProvider>
                <Toaster position="top-right" />
            </TooltipProvider>
        </TRPCReactProvider>
    );
}

function ShellSkeleton() {
    return (
        <div className="flex min-h-svh">
            <div className="hidden w-64 shrink-0 flex-col gap-4 border-r bg-sidebar p-4 md:flex">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
            <div className="flex flex-1 flex-col gap-6 p-6 lg:p-10">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-80" />
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
    );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<ShellSkeleton />}>
            <ProtectedShell>{children}</ProtectedShell>
        </Suspense>
    );
}
