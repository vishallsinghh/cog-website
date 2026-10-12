import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, userAc } from "better-auth/plugins/admin/access";

export const statement = {
    ...defaultStatements,
    member: ["read", "approve", "reject", "update"],
    donation: ["read", "refund", "export"],
    application: ["read", "review", "verify", "decide", "export"],
    content: ["read", "write", "publish"],
    report: ["read", "export"],
    auditLog: ["read"],
} as const;

export const ac = createAccessControl(statement);

export const roles = {
    member: ac.newRole({ ...userAc.statements }),
    super_admin: ac.newRole({
        ...adminAc.statements,
        member: ["read", "approve", "reject", "update"],
        donation: ["read", "refund", "export"],
        application: ["read", "review", "verify", "decide", "export"],
        content: ["read", "write", "publish"],
        report: ["read", "export"],
        auditLog: ["read"],
    }),
    admin: ac.newRole({
        user: ["list", "get"],
        member: ["read", "approve", "reject", "update"],
        donation: ["read", "refund", "export"],
        application: ["read", "review", "verify", "decide", "export"],
        content: ["read", "write", "publish"],
        report: ["read", "export"],
        auditLog: ["read"],
    }),
    editor: ac.newRole({
        member: ["read"],
        content: ["read", "write", "publish"],
    }),
    viewer: ac.newRole({
        member: ["read"],
        donation: ["read"],
        application: ["read"],
        content: ["read"],
        report: ["read"],
        auditLog: ["read"],
    }),
};

export type AppRole = keyof typeof roles;

export const ROLE_LABELS: Record<AppRole, string> = {
    member: "Member",
    super_admin: "Super Admin",
    admin: "Admin",
    editor: "Editor",
    viewer: "Viewer",
};

export const STAFF_ROLES = [
    "super_admin",
    "admin",
    "editor",
    "viewer",
] as const satisfies readonly AppRole[];

export const MEMBER_STATUSES = ["pending", "approved", "rejected"] as const;

export type MemberStatus = (typeof MEMBER_STATUSES)[number];
