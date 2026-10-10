"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import type { NavGroup } from "@/lib/navigation";
import { NavIcon } from "./nav-icon";
import { NavUser, type NavUserData } from "./nav-user";

export function AppSidebar({ groups, user }: { groups: NavGroup[]; user: NavUserData }) {
    const pathname = usePathname();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild tooltip="Council of Gujarat">
                            <Link href="/dashboard">
                                <span className="font-heading text-2xl font-bold tracking-tighter text-primary">
                                    COG
                                </span>
                                <span className="flex min-w-0 flex-col leading-tight">
                                    <span className="truncate text-[0.7rem] font-bold tracking-wider text-primary">
                                        COUNCIL OF GUJARAT
                                    </span>
                                    <span className="truncate text-[0.65rem] tracking-widest text-muted-foreground">
                                        MEMBER PORTAL
                                    </span>
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {groups.map((group) => (
                    <SidebarGroup key={group.label}>
                        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={item.title}
                                            isActive={pathname === item.href}
                                        >
                                            <Link href={item.href}>
                                                <NavIcon name={item.icon} />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
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
