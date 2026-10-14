import {
    ChartColumnIcon,
    ClipboardListIcon,
    HandCoinsIcon,
    LayoutDashboardIcon,
    NewspaperIcon,
    ScrollTextIcon,
    ShieldCheckIcon,
    UserRoundIcon,
    UsersIcon,
    type LucideIcon,
} from "lucide-react";
import type { NavKey } from "@/lib/navigation";

const ICONS: Record<NavKey, LucideIcon> = {
    dashboard: LayoutDashboardIcon,
    profile: UserRoundIcon,
    members: UsersIcon,
    applications: ClipboardListIcon,
    donations: HandCoinsIcon,
    reports: ChartColumnIcon,
    content: NewspaperIcon,
    audit: ScrollTextIcon,
    team: ShieldCheckIcon,
};

export function NavIcon({ name }: { name: NavKey }) {
    const Icon = ICONS[name];
    return <Icon />;
}
