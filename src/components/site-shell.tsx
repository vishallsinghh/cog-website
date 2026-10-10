"use client";
import Link from "next/link";
import { useState } from "react";

export function Brand() {
    return (
        <Link href="/" className="brand" aria-label="Council of Gujarat home">
            <span className="brand-mark">
                COG<span className="brand-leaf">✦</span>
            </span>
            <span className="brand-caption">
                THE COUNCIL OF GUJARAT <small>KSI JAMAATS · SINCE 1987</small>
            </span>
        </Link>
    );
}
const nav = [
    { label: "About us", href: "/about" },
    { label: "Our work", href: "/programmes" },
    { label: "Our legacy", href: "/legacy" },
    { label: "News & updates", href: "/updates" },
    { label: "Contact", href: "/contact" },
];
export function Header() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <div className="announcement">
                <span>CELEBRATING FOUR DECADES OF SERVICE · 1987–2027</span>
                <Link href="/legacy">Explore our story ↗</Link>
            </div>
            <header className="header">
                <div className="container header-inner">
                    <Brand />
                    <nav
                        className={open ? "nav active" : "nav"}
                        aria-label="Main navigation"
                    >
                        {nav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <Link href="/member" className="mobile-member">
                            Member portal
                        </Link>
                    </nav>
                    <div className="header-actions">
                        <Link className="header-login" href="/member">
                            Member login ↗
                        </Link>
                        <Link className="button button-dark header-donate" href="/donate">
                            Donate now <span>↗</span>
                        </Link>
                        <button
                            className="menu-toggle"
                            aria-label="Toggle navigation"
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
    return (
        <footer className="footer">
            <div className="container footer-top">
                <div>
                    <Brand />
                    <p>
                        Uniting the KSI Jamaats of Gujarat to build stronger, more resilient
                        communities since 1987.
                    </p>
                </div>
                <div>
                    <h4>Explore</h4>
                    <Link href="/about">About the Council</Link>
                    <Link href="/programmes">Our programmes</Link>
                    <Link href="/legacy">40 years of service</Link>
                    <Link href="/updates">News & updates</Link>
                </div>
                <div>
                    <h4>Get involved</h4>
                    <Link href="/donate">Make a donation</Link>
                    <Link href="/assistance">Request assistance</Link>
                    <Link href="/member">Member portal</Link>
                    <Link href="/contact">Contact us</Link>
                </div>
                <div>
                    <h4>Contact</h4>
                    <a href="tel:+919662786186">+91 96627 86186</a>
                    <a href="mailto:admin@councilofgujarat.org">
                        admin@councilofgujarat.org
                    </a>
                    <span>Gujarat, India</span>
                </div>
            </div>
            <div className="container footer-bottom">
                <span>© 2026 The Council of Gujarat. All rights reserved.</span>
                <span>UNITY · SERVICE · PROGRESS</span>
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
