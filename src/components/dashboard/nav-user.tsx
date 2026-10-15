"use client";

import { ChevronsUpDownIcon, GlobeIcon, LogOutIcon, UserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth.client";
import { formatPhone } from "@/lib/format";
import { Link, useRouter } from "@/i18n/navigation";
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
    const t = useTranslations("Dashboard");
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
                        <SidebarMenuButton
                            size="lg"
                            tooltip={user.name}
                            aria-label={t("accountMenu", { name: user.name })}
                            className="min-h-14 rounded-xl border border-cream/15 bg-cream/5 p-2.5 text-cream hover:bg-cream/10 hover:text-cream data-open:bg-cream/10 data-[state=open]:bg-cream/10 data-[state=open]:text-cream"
                        >
                            <Avatar className="size-9">
                                <AvatarFallback className="bg-gold text-[14px] font-bold text-green-ink">
                                    {initials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="flex min-w-0 flex-col text-left leading-tight">
                                <span className="truncate text-[15px] font-semibold">{user.name}</span>
                                <span className="truncate text-[13px] font-normal text-cream/70">
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
                            <span className="text-xs text-muted-foreground">{formatPhone(user.phoneNumber)}</span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link href="/profile">
                                    <UserRoundIcon />
                                    {t("profileMenu")}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/">
                                    <GlobeIcon />
                                    {t("publicSite")}
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem onSelect={signOut}>
                                <LogOutIcon />
                                {t("signOut")}
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
