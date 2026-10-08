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
    programme_manager: ac.newRole({
        member: ["read"],
        application: ["read", "review", "decide", "export"],
        report: ["read", "export"],
    }),
    finance: ac.newRole({
        member: ["read"],
        donation: ["read", "refund", "export"],
        report: ["read", "export"],
    }),
    jamaat_verifier: ac.newRole({
        member: ["read"],
        application: ["read", "verify"],
    }),
    content_editor: ac.newRole({
        content: ["read", "write", "publish"],
    }),
    auditor: ac.newRole({
        member: ["read"],
        donation: ["read"],
        application: ["read"],
        content: ["read"],
        report: ["read", "export"],
        auditLog: ["read"],
    }),
};

export type AppRole = keyof typeof roles;

export const STAFF_ROLES = [
    "super_admin",
    "admin",
    "programme_manager",
    "finance",
    "jamaat_verifier",
    "content_editor",
    "auditor",
] as const satisfies readonly AppRole[];

export const MEMBER_STATUSES = ["pending", "approved", "rejected"] as const;

export type MemberStatus = (typeof MEMBER_STATUSES)[number];
