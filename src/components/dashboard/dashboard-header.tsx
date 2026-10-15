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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/navigation";
import { findNavItem } from "@/lib/navigation";
import { DashboardLanguageSwitch } from "./language-switch";

export function DashboardHeader() {
    const pathname = usePathname();
    const t = useTranslations("Nav.items");
    const td = useTranslations("Dashboard");
    const current = findNavItem(pathname);
    const onDashboard = pathname === "/dashboard";

    return (
        <header className="flex flex-wrap items-center justify-between gap-4 px-[clamp(20px,3vw,48px)] pt-7">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1 md:hidden" />
                <Breadcrumb>
                    <BreadcrumbList className="gap-1.5 text-[14px] text-muted-ink sm:gap-1.5">
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
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <DashboardLanguageSwitch />
                <Link href="/" className="px-1.5 py-2.5 text-[14px] font-semibold text-green hover:text-gold-ink">
                    {td("viewWebsite")}
                </Link>
            </div>
        </header>
    );
}
