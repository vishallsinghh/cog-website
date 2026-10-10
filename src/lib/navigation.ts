import { hasPermission, type RequiredPermissions } from "./access";

export type NavIconName =
    | "dashboard"
    | "profile"
    | "members"
    | "applications"
    | "donations"
    | "reports"
    | "content"
    | "audit"
    | "team";

export type NavItem = {
    title: string;
    href: string;
    icon: NavIconName;
    description: string;
    permission?: RequiredPermissions;
};

export type NavGroup = {
    label: string;
    items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
    {
        label: "Overview",
        items: [
            {
                title: "Dashboard",
                href: "/dashboard",
                icon: "dashboard",
                description: "Your account at a glance.",
            },
            {
                title: "Profile",
                href: "/profile",
                icon: "profile",
                description: "Update your details and connected accounts.",
            },
        ],
    },
    {
        label: "Community",
        items: [
            {
                title: "Members",
                href: "/members",
                icon: "members",
                description: "Review sign-ups, approve accounts and search the member list.",
                permission: { member: ["read"] },
            },
            {
                title: "Applications",
                href: "/applications",
                icon: "applications",
                description: "Verify and review assistance applications.",
                permission: { application: ["read"] },
            },
        ],
    },
    {
        label: "Finance",
        items: [
            {
                title: "Donations",
                href: "/donations",
                icon: "donations",
                description: "One-time and monthly donations, receipts and refunds.",
                permission: { donation: ["read"] },
            },
            {
                title: "Reports",
                href: "/reports",
                icon: "reports",
                description: "Donor statistics and CSV exports.",
                permission: { report: ["read"] },
            },
        ],
    },
    {
        label: "Content",
        items: [
            {
                title: "Content",
                href: "/content",
                icon: "content",
                description: "Landing page, notices, blogs and emergency appeals.",
                permission: { content: ["read"] },
            },
        ],
    },
    {
        label: "Administration",
        items: [
            {
                title: "Audit log",
                href: "/audit-log",
                icon: "audit",
                description: "A record of every admin action.",
                permission: { auditLog: ["read"] },
            },
            {
                title: "Team",
                href: "/team",
                icon: "team",
                description: "Invite staff, change roles and remove access.",
                permission: { user: ["set-role"] },
            },
        ],
    },
];

export function navForRole(role: string | null | undefined): NavGroup[] {
    return NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.permission || hasPermission(role, item.permission)),
    })).filter((group) => group.items.length > 0);
}

export function findNavItem(href: string) {
    return NAV_GROUPS.flatMap((group) => group.items).find((item) => item.href === href);
}
