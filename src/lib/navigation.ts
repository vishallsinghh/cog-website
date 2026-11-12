import { hasPermission, type RequiredPermissions } from "./access";

// Each key names the item's icon and its messages under Nav.items.<key>.
export type NavKey =
    | "dashboard"
    | "profile"
    | "myApplications"
    | "members"
    | "applications"
    | "donations"
    | "content"
    | "forms"
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
            { key: "myApplications", href: "/my-applications" },
        ],
    },
    {
        key: "community",
        items: [
            { key: "members", href: "/members", permission: { member: ["read"] } },
            { key: "applications", href: "/applications", permission: { application: ["read"] } },
        ],
    },
    {
        key: "finance",
        items: [
            { key: "donations", href: "/donations", permission: { donation: ["read"] }, soon: true },
        ],
    },
    {
        key: "content",
        items: [{ key: "content", href: "/content", permission: { content: ["read"] }, soon: true }],
    },
    {
        key: "administration",
        items: [
            { key: "forms", href: "/forms", permission: { form: ["read"] } },
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

export function navForUser(role: string | null | undefined, approved: boolean): NavGroup[] {
    if (!approved) return [{ key: "overview", items: [NAV_GROUPS[0].items[0]] }];

    return navForRole(role);
}

export function findNavItem(href: string) {
    return NAV_GROUPS.flatMap((group) => group.items).find((item) => item.href === href);
}
