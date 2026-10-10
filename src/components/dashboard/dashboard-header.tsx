"use client";

import { usePathname } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { findNavItem } from "@/lib/navigation";

export function DashboardHeader() {
    const pathname = usePathname();
    const current = findNavItem(pathname);
    const onDashboard = pathname === "/dashboard";

    return (
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-5" />
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        {onDashboard ? (
                            <BreadcrumbPage>Dashboard</BreadcrumbPage>
                        ) : (
                            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                        )}
                    </BreadcrumbItem>
                    {!onDashboard && current && (
                        <>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{current.title}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </>
                    )}
                </BreadcrumbList>
            </Breadcrumb>
        </header>
    );
}
