"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { LangSwitch } from "@/components/lang-switch";
import { CONTACT, COPYRIGHT_YEAR, SOCIAL_LINKS } from "@/content/site";
import { Link, usePathname } from "@/i18n/navigation";

const NAV = [
    { key: "about", href: "/about" },
    { key: "journey", href: "/our-journey" },
    { key: "leadership", href: "/leadership" },
    { key: "work", href: "/our-work" },
    { key: "impact", href: "/impact" },
    { key: "nextGeneration", href: "/next-generation" },
] as const;

const SOCIAL_ICONS = {
    facebook: <path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2V3Z" />,
    instagram: (
        <>
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
        </>
    ),
    youtube: (
        <>
            <rect x="2" y="5" width="20" height="14" rx="4" />
            <path d="m10 9 5 3-5 3V9Z" />
        </>
    ),
} as const;

export function Header() {
    const t = useTranslations("Header");
    const common = useTranslations("Common");
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    return (
        <>
            <div className="announcement-bar">
                <span className="announcement-mark" aria-hidden="true">
                    ✦
                </span>
                {t("announcement")}{" "}
                <Link href="/our-journey">{t("announcementLink")}</Link>
            </div>
            <header className="site-header">
                <div className="site-header-inner">
                    <Link href="/" className="site-logo" aria-label={common("brandHome")}>
                        <Image src="/brand/cog-logo.png" alt={common("logoAlt")} width={145} height={58} priority />
                    </Link>
                    <nav className={open ? "site-nav active" : "site-nav"} aria-label={t("mainNav")}>
                        {NAV.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={pathname === item.href ? "page" : undefined}
                                onClick={() => setOpen(false)}
                            >
                                {t(`nav.${item.key}`)}
                            </Link>
                        ))}
                        <Link href="/member" className="mobile-member" onClick={() => setOpen(false)}>
                            {t("memberLogin")}
                        </Link>
                    </nav>
                    <div className="site-actions">
                        <LangSwitch />
                        <Link className="site-login" href="/member">
                            {t("memberLogin")}
                        </Link>
                        <Link
                            className="button button-gold button-sm"
                            href="/donate"
                            aria-current={pathname === "/donate" ? "page" : undefined}
                        >
                            {t("donate")}
                        </Link>
                        <button
                            type="button"
                            className="menu-toggle"
                            aria-label={t("toggleNav")}
                            aria-expanded={open}
                            onClick={() => setOpen(!open)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                <path d={open ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>
        </>
    );
}

export function Footer() {
    const t = useTranslations("Footer");
    const common = useTranslations("Common");

    return (
        <footer className="site-footer">
            <div className="site-footer-top">
                <div>
                    <Image src="/brand/cog-emblem.jpg" alt={t("emblemAlt")} width={110} height={110} className="footer-emblem" />
                    <p className="footer-name">{t("name")}</p>
                    <div className="footer-motto">{common("motto")}</div>
                    <div className="footer-social">
                        {SOCIAL_LINKS.map((link) => (
                            <a key={link.id} href={link.href} aria-label={t(`social.${link.id}`)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                                    {SOCIAL_ICONS[link.id]}
                                </svg>
                            </a>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="footer-heading">{t("explore")}</div>
                    <ul className="footer-list">
                        <li><Link href="/about">{t("links.about")}</Link></li>
                        <li><Link href="/our-journey">{t("links.journey")}</Link></li>
                        <li><Link href="/leadership">{t("links.leadership")}</Link></li>
                        <li><Link href="/our-work">{t("links.work")}</Link></li>
                        <li><Link href="/impact">{t("links.impact")}</Link></li>
                        <li><Link href="/next-generation">{t("links.nextGeneration")}</Link></li>
                    </ul>
                </div>
                <div>
                    <div className="footer-heading">{t("getInvolved")}</div>
                    <ul className="footer-list">
                        <li><Link href="/donate">{t("links.donate")}</Link></li>
                        <li><Link href="/assistance">{t("links.assistance")}</Link></li>
                        <li><Link href="/member">{t("links.member")}</Link></li>
                        <li><Link href="/updates">{t("links.updates")}</Link></li>
                    </ul>
                </div>
                <div>
                    <div className="footer-heading">{t("contact")}</div>
                    <ul className="footer-list">
                        <li>{t("address")}</li>
                        <li><a href={CONTACT.phoneHref}>{CONTACT.phone}</a></li>
                        <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
                        <li><a href={CONTACT.websiteHref}>{CONTACT.website}</a></li>
                    </ul>
                </div>
            </div>
            <div className="site-footer-bottom">
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
