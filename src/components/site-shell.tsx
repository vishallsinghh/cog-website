"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { LangSwitch } from "@/components/lang-switch";
import { CONTACT, COPYRIGHT_YEAR, SOCIAL_LINKS } from "@/content/site";
import { Link } from "@/i18n/navigation";

export function Brand() {
    const t = useTranslations("Common");

    return (
        <Link href="/" className="brand" aria-label={t("brandHome")}>
            <span className="brand-mark">
                COG<span className="brand-leaf">✦</span>
            </span>
            <span className="brand-caption">
                {t("brandCaption")} <small>{t("brandSub")}</small>
            </span>
        </Link>
    );
}

const NAV = [
    { key: "about", href: "/about" },
    { key: "work", href: "/our-work" },
    { key: "journey", href: "/our-journey" },
    { key: "leadership", href: "/leadership" },
    { key: "impact", href: "/impact" },
    { key: "contact", href: "/contact" },
] as const;

export function Header() {
    const t = useTranslations("Header");
    const [open, setOpen] = useState(false);

    return (
        <>
            <div className="announcement">
                <span>{t("announcement")}</span>
                <Link href="/our-journey">{t("announcementLink")}</Link>
            </div>
            <header className="header">
                <div className="container header-inner">
                    <Brand />
                    <nav className={open ? "nav active" : "nav"} aria-label={t("mainNav")}>
                        {NAV.map((item) => (
                            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                                {t(`nav.${item.key}`)}
                            </Link>
                        ))}
                        <Link href="/member" className="mobile-member" onClick={() => setOpen(false)}>
                            {t("memberPortal")}
                        </Link>
                    </nav>
                    <div className="header-actions">
                        <LangSwitch />
                        <Link className="header-login" href="/member">
                            {t("memberLogin")}
                        </Link>
                        <Link className="button button-dark header-donate" href="/donate">
                            {t("donate")} <span>↗</span>
                        </Link>
                        <button
                            className="menu-toggle"
                            aria-label={t("toggleNav")}
                            aria-expanded={open}
                            onClick={() => setOpen(!open)}
                        >
                            {open ? "✕" : "☰"}
                        </button>
                    </div>
                </div>
            </header>
        </>
    );
}

export function Footer() {
    const t = useTranslations("Footer");

    return (
        <footer className="footer">
            <div className="container footer-top">
                <div>
                    <Brand />
                    <p>{t("tagline")}</p>
                    <div className="footer-social">
                        {SOCIAL_LINKS.map((link) => (
                            <a key={link.id} href={link.href}>
                                {t(`social.${link.id}`)}
                            </a>
                        ))}
                    </div>
                </div>
                <div>
                    <h4>{t("explore")}</h4>
                    <Link href="/about">{t("links.about")}</Link>
                    <Link href="/our-work">{t("links.work")}</Link>
                    <Link href="/our-journey">{t("links.journey")}</Link>
                    <Link href="/leadership">{t("links.leadership")}</Link>
                    <Link href="/impact">{t("links.impact")}</Link>
                    <Link href="/next-generation">{t("links.nextGeneration")}</Link>
                    <Link href="/updates">{t("links.updates")}</Link>
                </div>
                <div>
                    <h4>{t("getInvolved")}</h4>
                    <Link href="/donate">{t("links.donate")}</Link>
                    <Link href="/assistance">{t("links.assistance")}</Link>
                    <Link href="/member">{t("links.member")}</Link>
                    <Link href="/contact">{t("links.contact")}</Link>
                </div>
                <div>
                    <h4>{t("contact")}</h4>
                    <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
                    <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                    <span>{t("address")}</span>
                </div>
            </div>
            <div className="container footer-bottom">
                <span>{t("copyright", { year: COPYRIGHT_YEAR })}</span>
                <span className="footer-legal">
                    <Link href="/privacy">{t("privacy")}</Link>
                    <Link href="/terms">{t("terms")}</Link>
                </span>
            </div>
        </footer>
    );
}

export function Shell({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Header />
            {children}
            <Footer />
        </>
    );
}

export function PageBanner({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <section className="page-banner">
            <div className="container">
                <div className="eyebrow light">{eyebrow}</div>
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
        </section>
    );
}
