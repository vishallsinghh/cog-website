export const INDIAN_MOBILE = /^\+91[6-9]\d{9}$/;

export function isIndianMobile(value: string) {
    return INDIAN_MOBILE.test(value);
}

export function tempEmailForPhone(phoneNumber: string) {
    return `${phoneNumber.replace("+", "")}@members.cog.invalid`;
}
