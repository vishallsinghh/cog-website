"use client";

import { useTransition } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { useTRPC } from "@/trpc/client";

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
            await setLanguage.mutateAsync({ language: next }).catch(() => undefined);
            router.replace(pathname, { locale: next as AppLocale });
        });
    }

    return (
        <div
            role="group"
            aria-label={t("switchLanguage")}
            className="flex rounded-full border border-green/20 bg-field p-[3px] text-[13px]"
        >
            {routing.locales.map((value) => {
                const on = value === locale;

                return (
                    <button
                        key={value}
                        type="button"
                        lang={value}
                        aria-pressed={on}
                        aria-label={t(`languages.${value}`)}
                        disabled={switching}
                        onClick={() => change(value)}
                        className={`min-h-8 rounded-full px-3 font-semibold transition-colors disabled:opacity-60 ${
                            on ? "bg-green text-cream" : "text-green hover:text-gold-ink"
                        }`}
                    >
                        {t(`languageShort.${value}`)}
                    </button>
                );
            })}
        </div>
    );
}
