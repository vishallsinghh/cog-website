import { roles, type AppRole } from "./permissions";

export type RequiredPermissions = Parameters<(typeof roles)[AppRole]["authorize"]>[0];

export function hasPermission(role: string | null | undefined, required: RequiredPermissions) {
    return (role ?? "")
        .split(",")
        .map((value) => value.trim())
        .some((value) => value in roles && roles[value as AppRole].authorize(required).success);
}

/** The first known role in a comma-separated role string; labels live in messages under Roles. */
export function primaryRole(role: string | null | undefined): AppRole {
    const first = (role ?? "").split(",")[0]?.trim();

    return first && first in roles ? (first as AppRole) : "member";
}
