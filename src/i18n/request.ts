import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale: explicit }) => {
    let requested: string | undefined = explicit;

    // Root params exist only while rendering under app/[locale]. Route handlers
    // (api/trpc, api/auth) have none, so they fall back to the default locale.
    if (!requested) {
        try {
            requested = await rootLocale();
        } catch {
            requested = undefined;
        }
    }

    const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

    return {
        locale,
        timeZone: "Asia/Kolkata",
        messages: (await import(`../../messages/${locale}.json`)).default,
    };
});
