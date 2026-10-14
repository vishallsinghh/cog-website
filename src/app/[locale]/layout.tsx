import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Noto_Sans_Gujarati, Noto_Serif_Gujarati } from "next/font/google";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cormorant = Cormorant_Garamond({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-cormorant",
    display: "swap",
});
const gujarati = Noto_Sans_Gujarati({
    subsets: ["gujarati"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-gujarati",
    display: "swap",
});
const gujaratiSerif = Noto_Serif_Gujarati({
    subsets: ["gujarati"],
    weight: ["400", "600"],
    variable: "--font-gujarati-serif",
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

    const fonts = [inter.variable, cormorant.variable, gujarati.variable, gujaratiSerif.variable].join(" ");

    return (
        <html lang={locale} className={fonts} data-scroll-behavior="smooth">
            <body>
                <NextIntlClientProvider>{children}</NextIntlClientProvider>
            </body>
        </html>
    );
}
