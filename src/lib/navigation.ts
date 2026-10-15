import { hasPermission, type RequiredPermissions } from "./access";

// Each key names the item's icon and its messages under Nav.items.<key>.
export type NavKey =
    | "dashboard"
    | "profile"
    | "members"
    | "applications"
    | "donations"
    | "reports"
    | "content"
    | "audit"
    | "team";

export type NavGroupKey = "overview" | "community" | "finance" | "content" | "administration";

export type NavItem = {
    key: NavKey;
    href: string;
    permission?: RequiredPermissions;
    soon?: boolean;
};

export type NavGroup = {
    key: NavGroupKey;
    items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
    {
        key: "overview",
        items: [
            { key: "dashboard", href: "/dashboard" },
            { key: "profile", href: "/profile" },
        ],
    },
    {
        key: "community",
        items: [
            { key: "members", href: "/members", permission: { member: ["read"] } },
            { key: "applications", href: "/applications", permission: { application: ["read"] }, soon: true },
        ],
    },
    {
        key: "finance",
        items: [
            { key: "donations", href: "/donations", permission: { donation: ["read"] }, soon: true },
            { key: "reports", href: "/reports", permission: { report: ["read"] }, soon: true },
        ],
    },
    {
        key: "content",
        items: [{ key: "content", href: "/content", permission: { content: ["read"] }, soon: true }],
    },
    {
        key: "administration",
        items: [
            { key: "audit", href: "/audit-log", permission: { auditLog: ["read"] } },
            { key: "team", href: "/team", permission: { user: ["set-role"] } },
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
