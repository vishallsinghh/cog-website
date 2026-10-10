export const INDIAN_MOBILE = /^\+91[6-9]\d{9}$/;

export function isIndianMobile(value: string) {
    return INDIAN_MOBILE.test(value);
}

export function formatMobileInput(input: string) {
    let digits = input.replace(/\D/g, "");

    if (digits.length >= 12 && digits.startsWith("91")) digits = digits.slice(2);
    else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);

    digits = digits.slice(0, 10);

    return digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
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
