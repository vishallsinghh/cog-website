import {
    ChartColumnIcon,
    ClipboardListIcon,
    HandCoinsIcon,
    LayoutDashboardIcon,
    NewspaperIcon,
    ScrollTextIcon,
    ShieldCheckIcon,
    UsersIcon,
    type LucideIcon,
} from "lucide-react";
import type { NavIconName } from "@/lib/navigation";

const ICONS: Record<NavIconName, LucideIcon> = {
    dashboard: LayoutDashboardIcon,
    members: UsersIcon,
    applications: ClipboardListIcon,
    donations: HandCoinsIcon,
    reports: ChartColumnIcon,
    content: NewspaperIcon,
    audit: ScrollTextIcon,
    team: ShieldCheckIcon,
};

export function NavIcon({ name }: { name: NavIconName }) {
    const Icon = ICONS[name];
    return <Icon />;
}
