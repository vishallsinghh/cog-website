export const INDIAN_MOBILE = /^\+91[6-9]\d{9}$/;

export function isIndianMobile(value: string) {
    return INDIAN_MOBILE.test(value);
}

export function normalizeIndianMobile(input: string) {
    const digits = input.replace(/\D/g, "");
    const national = digits.length === 12 && digits.startsWith("91")
        ? digits.slice(2)
        : digits.length === 11 && digits.startsWith("0")
          ? digits.slice(1)
          : digits;

    const candidate = `+91${national}`;
    return isIndianMobile(candidate) ? candidate : null;
}

export function tempEmailForPhone(phoneNumber: string) {
    return `${phoneNumber.replace("+", "")}@members.cog.invalid`;
}
