import {
    ClipboardListIcon,
    FileTextIcon,
    HandCoinsIcon,
    LayoutDashboardIcon,
    ListChecksIcon,
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
    myApplications: FileTextIcon,
    members: UsersIcon,
    applications: ClipboardListIcon,
    donations: HandCoinsIcon,
    content: NewspaperIcon,
    forms: ListChecksIcon,
    audit: ScrollTextIcon,
    team: ShieldCheckIcon,
};

export function NavIcon({ name }: { name: NavKey }) {
    const Icon = ICONS[name];
    return <Icon />;
}
