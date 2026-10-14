import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
    locales: ["en", "gu"],
    defaultLocale: "en",
    localePrefix: "always",
    // Remember the visitor's language for a year, so a return visit to "/" lands on it.
    localeCookie: { maxAge: 60 * 60 * 24 * 365 },
});

export type AppLocale = (typeof routing.locales)[number];
