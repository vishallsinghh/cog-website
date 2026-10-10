import { ROLE_LABELS, roles, type AppRole } from "./permissions";

export type RequiredPermissions = Parameters<(typeof roles)[AppRole]["authorize"]>[0];

export function hasPermission(role: string | null | undefined, required: RequiredPermissions) {
    return (role ?? "")
        .split(",")
        .map((value) => value.trim())
        .some((value) => value in roles && roles[value as AppRole].authorize(required).success);
}

export function primaryRoleLabel(role: string | null | undefined) {
    const first = (role ?? "").split(",")[0]?.trim() as AppRole;

    return ROLE_LABELS[first] ?? ROLE_LABELS.member;
}
