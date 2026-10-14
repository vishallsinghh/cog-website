"use client";

import { useTransition } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { useTRPC } from "@/trpc/client";

/**
 * Language toggle for signed-in users. Saves the choice to the account
 * (user.preferredLanguage) and then switches the route locale, which also
 * updates the locale cookie.
 */
export function DashboardLanguageSwitch() {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const t = useTranslations("Common");
    const trpc = useTRPC();
    const setLanguage = useMutation(trpc.profile.setLanguage.mutationOptions());
    const [switching, startTransition] = useTransition();

    function change(value: string) {
        const next = routing.locales.find((item) => item === value);
        if (!next || next === locale) return;

        startTransition(async () => {
            // A failed save must not block the switch; the cookie still remembers it.
            await setLanguage.mutateAsync({ language: next }).catch(() => undefined);
            router.replace(pathname, { locale: next as AppLocale });
        });
    }

    return (
        <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={locale}
            onValueChange={change}
            disabled={switching}
            aria-label={t("switchLanguage")}
        >
            {routing.locales.map((value) => (
                <ToggleGroupItem key={value} value={value} lang={value} aria-label={t(`languages.${value}`)}>
                    {t(`languageShort.${value}`)}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    );
}
