import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Arch, ArchPattern, ArrowLink, Backdrop, Eyebrow } from "@/components/page-parts";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("OurWork");
    return { title: t("metaTitle"), description: t("description") };
}

const ITEMS = ["i1", "i2", "i3", "i4"] as const;

type FeatureProps = {
    id: "education" | "housing" | "healthcare" | "relief";
    number: string;
    slug: string;
    image: string;
    position?: string;
    reverse?: boolean;
    last?: boolean;
};

const FEATURES: FeatureProps[] = [
    { id: "education", number: "01", slug: "education", image: "/images/education.jpg" },
    { id: "housing", number: "02", slug: "housing", image: "/images/housing.jpg", reverse: true },
    { id: "healthcare", number: "03", slug: "healthcare-welfare", image: "/images/healthcare.jpg", position: "50% 30%" },
    { id: "relief", number: "05", slug: "relief", image: "/images/relief.jpg", reverse: true, last: true },
];

async function Feature({ id, number, slug, image, position, reverse = false, last = false }: FeatureProps) {
    const t = (await getTranslations("OurWork")) as unknown as ((key: string) => string) & { has: (key: string) => boolean };
    const base = `programmes.${id}`;

    const content = (
        <div className="reveal min-w-0 flex-[1_1_480px]">
            <div className="label text-gold-ink">{t(`${base}.label`)}</div>
            <h2 className="display mt-[18px] text-[clamp(40px,4.2vw,58px)] leading-[1.05] text-green">{t(`${base}.title`)}</h2>
            <p className="mt-[22px] text-[18px] leading-[1.75] font-light text-ink-soft">{t(`${base}.text`)}</p>
            <ul className="m-0 mt-8 grid list-none grid-cols-2 border-t border-gold/45 p-0">
                {ITEMS.map((item, index) => (
                    <li
                        key={item}
                        className={`border-b border-gold/45 py-[18px] ${index % 2 === 0 ? "pr-4" : "border-l pl-4"}`}
                    >
                        {t.has(`${base}.${item}.value`) ? (
                            <div className="display text-[34px] leading-none text-green">{t(`${base}.${item}.value`)}</div>
                        ) : (
                            <div className="font-semibold">{t(`${base}.${item}.title`)}</div>
                        )}
                        <div className={`text-[15px] text-[#4A5451] ${t.has(`${base}.${item}.value`) ? "mt-1.5" : "mt-1"}`}>
                            {t(`${base}.${item}.text`)}
                        </div>
                    </li>
                ))}
            </ul>
            <ArrowLink href={`/our-work/${slug}`} className="mt-8">
                {t(`${base}.link`)}
            </ArrowLink>
        </div>
    );

    const media = (
        <div className={`relative min-w-0 flex-[1_1_440px] ${reverse ? "flex justify-end" : ""}`}>
            <div
                aria-hidden="true"
                className={`drift display absolute -top-10 z-0 text-[240px] leading-none text-gold/[0.18] ${reverse ? "-right-2.5" : "-left-5"}`}
            >
                {number}
            </div>
            <Arch
                src={image}
                alt={t(`${base}.alt`)}
                radius={260}
                position={position}
                className={`z-[1] h-[580px] max-w-[520px] ${reverse ? "w-full" : ""}`}
                sizes="(max-width: 900px) 100vw, 520px"
            />
        </div>
    );

    return (
        <section
            id={id}
            className={`wrap flex items-center gap-20 pt-[130px] ${last ? "pb-[130px]" : ""} ${reverse ? "flex-wrap-reverse" : "flex-wrap"}`}
        >
            {reverse ? content : media}
            {reverse ? media : content}
        </section>
    );
}

export default async function Page() {
    const t = await getTranslations("OurWork");
    const chips = ["education", "housing", "healthcare", "marriages", "relief"] as const;

    return (
        <main className="overflow-x-hidden">
            <section className="relative overflow-hidden bg-green text-cream">
                <ArchPattern opacity={0.3} />
                <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(194,154,67,0.2), transparent 55%)" }}
                />
                <div className="wrap relative pt-[110px] pb-24">
                    <Eyebrow light className="intro">
                        {t("eyebrow")}
                    </Eyebrow>
                    <h1 className="intro d1 display mt-[26px] max-w-[980px] text-[clamp(52px,6.4vw,96px)] leading-[0.98]">
                        {t("title")}
                        <br />
                        <em className="text-gold-light">{t("titleEm")}</em>
                    </h1>
                    <p className="intro d2 mt-7 max-w-[620px] text-[19px] leading-[1.7] font-light text-cream/85">{t("description")}</p>
                    <nav aria-label={t("navLabel")} className="intro d3 mt-12 flex flex-wrap gap-3">
                        {chips.map((chip, index) => (
                            <a
                                key={chip}
                                href={`#${chip}`}
                                className="chip rounded-full border border-cream/40 px-[22px] py-3 text-[15px] text-cream"
                            >
                                {String(index + 1).padStart(2, "0")} {t(`chips.${chip}`)}
                            </a>
                        ))}
                    </nav>
                </div>
            </section>

            {FEATURES.slice(0, 3).map((feature) => (
                <Feature key={feature.id} {...feature} />
            ))}

            <section id="marriages" className="relative mt-[130px] overflow-hidden text-cream">
                <Backdrop src="/images/marriages.jpg" position="50% 55%" />
                <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(90deg, rgba(6,47,40,0.94) 0%, rgba(6,47,40,0.78) 50%, rgba(6,47,40,0.4) 100%)" }}
                />
                <div className="reveal wrap relative py-[130px]">
                    <div className="max-w-[640px]">
                        <div className="label text-gold-light">{t("programmes.marriages.label")}</div>
                        <h2 className="display mt-[18px] text-[clamp(40px,4.2vw,58px)] leading-[1.05]">
                            {t("programmes.marriages.title")}
                            <em className="text-gold-light">{t("programmes.marriages.titleEm")}</em>
                        </h2>
                        <p className="mt-[22px] text-[18px] leading-[1.75] font-light text-cream/85">{t("programmes.marriages.text")}</p>
                    </div>
                    <div className="mt-14 grid max-w-[860px] grid-cols-[repeat(auto-fit,minmax(180px,1fr))] border-t border-gold/50">
                        {(["s1", "s2", "s3"] as const).map((stat, index) => (
                            <div key={stat} className={`pt-7 ${index === 0 ? "pr-6" : index === 1 ? "border-l border-gold/50 px-6" : "border-l border-gold/50 pl-6"}`}>
                                <div className="display text-[72px] leading-[0.9]">{t(`programmes.marriages.${stat}.value`)}</div>
                                <div className="mt-2.5 text-[15px] text-cream/80">{t(`programmes.marriages.${stat}.text`)}</div>
                            </div>
                        ))}
                    </div>
                    <ArrowLink href="/our-work/group-marriages" light className="mt-11">
                        {t("programmes.marriages.link")}
                    </ArrowLink>
                </div>
            </section>

            <Feature {...FEATURES[3]} />

            <section className="wrap pb-[130px]">
                <div className="reveal relative flex flex-wrap items-center justify-between gap-10 overflow-hidden bg-green px-[clamp(28px,5vw,80px)] py-[72px] text-cream">
                    <ArchPattern opacity={0.2} />
                    <div className="relative min-w-0 flex-[1_1_460px]">
                        <h2 className="display m-0 text-[clamp(34px,3.4vw,48px)] leading-[1.1]">{t("cta.title")}</h2>
                        <p className="mt-3.5 text-[18px] leading-[1.7] font-light text-cream/85">{t("cta.text")}</p>
                    </div>
                    <div className="relative flex flex-wrap gap-3.5">
                        <Link href="/assistance" className="button button-gold" style={{ paddingInline: 32 }}>
                            {t("cta.primary")}
                        </Link>
                        <Link href="/donate" className="button button-outline-white" style={{ paddingInline: 32, borderColor: "rgba(246,242,230,0.55)" }}>
                            {t("cta.secondary")}
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
