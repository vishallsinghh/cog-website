"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDownIcon, GlobeIcon, LogOutIcon } from "lucide-react";
import { authClient } from "@/lib/auth.client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";

export type NavUserData = {
    name: string;
    phoneNumber: string;
    roleLabel: string;
};

function initials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

export function NavUser({ user }: { user: NavUserData }) {
    const router = useRouter();
    const { isMobile } = useSidebar();

    async function signOut() {
        await authClient.signOut();
        router.push("/member");
        router.refresh();
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton size="lg" tooltip={user.name}>
                            <Avatar className="size-8">
                                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                                    {initials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="flex min-w-0 flex-col text-left leading-tight">
                                <span className="truncate text-sm font-medium">{user.name}</span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {user.roleLabel}
                                </span>
                            </span>
                            <ChevronsUpDownIcon className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={8}
                        className="min-w-56"
                    >
                        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
                            <span className="text-sm font-medium">{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.phoneNumber}</span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link href="/">
                                    <GlobeIcon />
                                    Public website
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem onSelect={signOut}>
                                <LogOutIcon />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
