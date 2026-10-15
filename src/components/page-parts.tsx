import Image from "next/image";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export function ArrowIcon({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
    );
}

export function Eyebrow({
    children,
    light = false,
    center = false,
    className = "",
}: {
    children: ReactNode;
    light?: boolean;
    center?: boolean;
    className?: string;
}) {
    const classes = ["label", "eyebrow-line", light ? "eyebrow-light" : "", center ? "eyebrow-center" : "", className]
        .filter(Boolean)
        .join(" ");

    return <div className={classes}>{children}</div>;
}

export function ArrowLink({
    href,
    children,
    light = false,
    className = "",
}: {
    href: string;
    children: ReactNode;
    light?: boolean;
    className?: string;
}) {
    return (
        <Link href={href} className={`text-link ${light ? "text-link-light" : ""} ${className}`}>
            {children}
            <ArrowIcon />
        </Link>
    );
}

export function Arch({
    src,
    alt,
    radius,
    className = "",
    imageClassName = "zoom-scroll",
    position,
    sizes = "(max-width: 900px) 100vw, 520px",
    priority = false,
    heroZoom = false,
}: {
    src: string;
    alt: string;
    radius: number;
    heroZoom?: boolean;
    className?: string;
    imageClassName?: string;
    position?: string;
    sizes?: string;
    priority?: boolean;
}) {
    return (
        <div className={`relative overflow-hidden ${className}`} style={{ borderRadius: `${radius}px ${radius}px 0 0` }}>
            <div className={heroZoom ? "hero-zoom absolute inset-0" : "absolute inset-0"}>
                <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes={sizes}
                    priority={priority}
                    className={`object-cover ${imageClassName}`}
                    style={position ? { objectPosition: position } : undefined}
                />
            </div>
        </div>
    );
}

export function Backdrop({ src, position, className = "zoom-scroll" }: { src: string; position?: string; className?: string }) {
    return (
        <Image
            src={src}
            alt=""
            fill
            sizes="100vw"
            className={`object-cover ${className}`}
            style={position ? { objectPosition: position } : undefined}
        />
    );
}

export function ArchPattern({ opacity }: { opacity: number }) {
    return <div className="arch-bg absolute inset-0" aria-hidden="true" style={{ opacity }} />;
}

export function Section({
    children,
    className = "",
    id,
}: {
    children: ReactNode;
    className?: string;
    id?: string;
}) {
    return (
        <section id={id} className={`wrap ${className}`}>
            {children}
        </section>
    );
}
