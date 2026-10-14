"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/** EN / ગુ toggle for the public site. The locale cookie remembers the choice. */
export function LangSwitch() {
    const locale = useLocale();
    const pathname = usePathname();
    const t = useTranslations("Common");

    return (
        <nav className="lang-switch" aria-label={t("switchLanguage")}>
            {routing.locales.map((value) => (
                <Link
                    key={value}
                    href={pathname}
                    locale={value}
                    lang={value}
                    aria-current={value === locale ? "true" : undefined}
                    title={t(`languages.${value}`)}
                >
                    {t(`languageShort.${value}`)}
                </Link>
            ))}
        </nav>
    );
}
