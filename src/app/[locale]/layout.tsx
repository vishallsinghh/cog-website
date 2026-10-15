import type { Metadata } from "next";
import { Hind_Vadodara, Rasa } from "next/font/google";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";

const hind = Hind_Vadodara({
    subsets: ["latin", "gujarati"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-hind",
    display: "swap",
});
const rasa = Rasa({
    subsets: ["latin", "gujarati"],
    style: ["normal", "italic"],
    variable: "--font-rasa",
    display: "swap",
});

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Metadata");

    return {
        title: { default: t("title"), template: t("titleTemplate") },
        description: t("description"),
    };
}

export default async function RootLayout({ children }: LayoutProps<"/[locale]">) {
    const locale = await rootLocale();
    if (!hasLocale(routing.locales, locale)) notFound();

    const fonts = [hind.variable, rasa.variable].join(" ");

    return (
        <html lang={locale} className={fonts} data-scroll-behavior="smooth">
            <body>
                <NextIntlClientProvider>{children}</NextIntlClientProvider>
            </body>
        </html>
    );
}
