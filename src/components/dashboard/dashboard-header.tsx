"use client";

import { useTranslations } from "next-intl";
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
import { Link, usePathname } from "@/i18n/navigation";
import { findNavItem } from "@/lib/navigation";
import { DashboardLanguageSwitch } from "./language-switch";

export function DashboardHeader() {
    const pathname = usePathname();
    const t = useTranslations("Nav.items");
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
                            <BreadcrumbPage>{t("dashboard.title")}</BreadcrumbPage>
                        ) : (
                            <BreadcrumbLink asChild>
                                <Link href="/dashboard">{t("dashboard.title")}</Link>
                            </BreadcrumbLink>
                        )}
                    </BreadcrumbItem>
                    {!onDashboard && current && (
                        <>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{t(`${current.key}.title`)}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </>
                    )}
                </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto">
                <DashboardLanguageSwitch />
            </div>
        </header>
    );
}
