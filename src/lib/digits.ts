const GUJARATI_DIGITS = "૦૧૨૩૪૫૬૭૮૯";

export function localizeDigits(value: string, locale: string) {
    if (locale !== "gu") return value;
    return value.replace(/[0-9]/g, (digit) => GUJARATI_DIGITS[Number(digit)]);
}
