"use client";

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
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/navigation";
import type { NavGroup } from "@/lib/navigation";
import { NavIcon } from "./nav-icon";
import { NavUser, type NavUserData } from "./nav-user";

export function AppSidebar({ groups, user }: { groups: NavGroup[]; user: NavUserData }) {
    const pathname = usePathname();
    const t = useTranslations("Dashboard");
    const tn = useTranslations("Nav");

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild tooltip={t("brandTooltip")}>
                            <Link href="/dashboard">
                                <span className="font-heading text-2xl font-bold tracking-tighter text-primary">
                                    COG
                                </span>
                                <span className="flex min-w-0 flex-col leading-tight">
                                    <span className="truncate text-[0.7rem] font-bold tracking-wider text-primary">
                                        {t("brandLine1")}
                                    </span>
                                    <span className="truncate text-[0.65rem] tracking-widest text-muted-foreground">
                                        {t("brandLine2")}
                                    </span>
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {groups.map((group) => (
                    <SidebarGroup key={group.key}>
                        <SidebarGroupLabel>{tn(`groups.${group.key}`)}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const title = tn(`items.${item.key}.title`);

                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                tooltip={title}
                                                isActive={pathname === item.href}
                                            >
                                                <Link href={item.href}>
                                                    <NavIcon name={item.key} />
                                                    <span>{title}</span>
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

            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
