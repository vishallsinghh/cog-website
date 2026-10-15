"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/navigation";
import type { NavGroup } from "@/lib/navigation";
import { NavIcon } from "./nav-icon";
import { NavUser, type NavUserData } from "./nav-user";

const ITEM =
    "min-h-11 gap-3 rounded-[10px] px-3 text-[15px] font-medium text-cream/80 hover:bg-cream/10 hover:text-cream data-active:bg-cream/12 data-active:text-cream data-active:shadow-[inset_3px_0_0_var(--gold)]";

export function AppSidebar({ groups, user }: { groups: NavGroup[]; user: NavUserData }) {
    const pathname = usePathname();
    const t = useTranslations("Dashboard");
    const tn = useTranslations("Nav");

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="gap-0 px-3.5 pt-5">
                <div className="flex items-center justify-between gap-3 group-data-[collapsible=icon]:flex-col">
                    <Link
                        href="/dashboard"
                        title={t("brandTooltip")}
                        className="flex min-h-11 min-w-0 items-center gap-3 text-cream"
                    >
                        <Image
                            src="/brand/cog-emblem.jpg"
                            alt={t("emblemAlt")}
                            width={44}
                            height={44}
                            className="size-11 flex-none rounded-full"
                        />
                        <span className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                            <span className="font-heading text-[19px]">{t("brandName")}</span>
                            <span className="label text-gold-light [--fs:12px] [--ls:.14em]">{t("brandPortal")}</span>
                        </span>
                    </Link>
                    <SidebarTrigger className="size-9 flex-none rounded-lg border border-cream/20 text-cream hover:bg-cream/10 hover:text-cream" />
                </div>
            </SidebarHeader>

            <SidebarContent className="gap-4 px-3.5 pt-6">
                {groups.map((group) => (
                    <SidebarGroup key={group.key} className="gap-0.5 p-0">
                        <SidebarGroupLabel className="label h-auto px-3 pb-1.5 text-gold-light/85 [--fs:11px] [--ls:.18em]">
                            {tn(`groups.${group.key}`)}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-0.5">
                                {group.items.map((item) => {
                                    const title = tn(`items.${item.key}.title`);
                                    const active = pathname === item.href;

                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton asChild tooltip={title} isActive={active} className={ITEM}>
                                                <Link href={item.href} aria-current={active ? "page" : undefined}>
                                                    <NavIcon name={item.key} />
                                                    <span className="flex-1">{title}</span>
                                                    {item.soon && !active && (
                                                        <span className="text-[11px] font-normal text-cream/50 group-data-[collapsible=icon]:hidden">
                                                            {t("soon")}
                                                        </span>
                                                    )}
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter className="p-3.5">
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
