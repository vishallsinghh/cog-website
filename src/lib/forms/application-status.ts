export const APPLICATION_STATUSES = [
    "draft",
    "received",
    "under_review",
    "documents_required",
    "approved",
    "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const REVIEW_STATUSES = APPLICATION_STATUSES.filter(
    (status): status is Exclude<ApplicationStatus, "draft"> => status !== "draft",
);

export const DECISION_STATUSES = ["approved", "rejected"] as const satisfies readonly ApplicationStatus[];

export const MEMBER_EDITABLE_STATUSES = ["draft", "documents_required"] as const satisfies readonly ApplicationStatus[];

export const FORM_ACCESS_LEVELS = ["view", "review", "decide"] as const;

export type FormAccessLevel = (typeof FORM_ACCESS_LEVELS)[number];

export function isApplicationStatus(value: string | null | undefined): value is ApplicationStatus {
    return (APPLICATION_STATUSES as readonly (string | null | undefined)[]).includes(value);
}

export function canMemberEdit(status: string) {
    return (MEMBER_EDITABLE_STATUSES as readonly string[]).includes(status);
}

export function accessLevelAllows(level: string | null | undefined, needed: FormAccessLevel) {
    if (!level) return false;

    return FORM_ACCESS_LEVELS.indexOf(level as FormAccessLevel) >= FORM_ACCESS_LEVELS.indexOf(needed);
}

export function isFormAccessLevel(value: string | null | undefined): value is FormAccessLevel {
    return (FORM_ACCESS_LEVELS as readonly (string | null | undefined)[]).includes(value);
}

export function lowerAccessLevel(a: FormAccessLevel, b: FormAccessLevel): FormAccessLevel {
    return FORM_ACCESS_LEVELS.indexOf(a) <= FORM_ACCESS_LEVELS.indexOf(b) ? a : b;
}

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const STAFF_TARGET_STATUSES = [
    "under_review",
    "documents_required",
    "approved",
    "rejected",
] as const satisfies readonly ReviewStatus[];

export type StaffTargetStatus = (typeof STAFF_TARGET_STATUSES)[number];

const STAFF_TRANSITIONS: Record<ApplicationStatus, readonly StaffTargetStatus[]> = {
    draft: [],
    received: ["under_review", "documents_required", "approved", "rejected"],
    under_review: ["documents_required", "approved", "rejected"],
    documents_required: ["under_review", "approved", "rejected"],
    approved: [],
    rejected: [],
};

export function levelForStatus(status: StaffTargetStatus): FormAccessLevel {
    return (DECISION_STATUSES as readonly string[]).includes(status) ? "decide" : "review";
}

export function staffTransitions(from: string, level: FormAccessLevel | null): StaffTargetStatus[] {
    if (!isApplicationStatus(from)) return [];

    return STAFF_TRANSITIONS[from].filter((to) => accessLevelAllows(level, levelForStatus(to)));
}

export function statusNeedsMessage(status: string) {
    return status === "documents_required";
}
