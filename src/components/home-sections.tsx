import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Arch, ArchPattern, ArrowIcon, ArrowLink, Backdrop, Eyebrow } from "@/components/page-parts";
import { impactValue } from "@/content/impact";
import { Link } from "@/i18n/navigation";
import { localizeDigits } from "@/lib/digits";

const FEATURED = [
    { id: "education", slug: "education", image: "/images/education.jpg", position: undefined },
    { id: "housing", slug: "housing", image: "/images/housing.jpg", position: undefined },
    { id: "healthcare", slug: "healthcare-welfare", image: "/images/healthcare.jpg", position: "50% 30%" },
] as const;

const IMPACT = ["housing", "elderlyWomen", "marriages", "families"] as const;
const VALUES = ["unity", "service", "progress"] as const;

function Stat({ value, label, plus = false, last = false }: { value: string; label: string; plus?: boolean; last?: boolean }) {
    return (
        <div className={`px-8 py-10 ${last ? "" : "border-r border-gold/30"}`}>
            <div className="display text-[64px] leading-none text-green">
                {value}
                {plus && <span className="text-gold">+</span>}
            </div>
            <div className="label mt-2.5 text-muted-ink [--ls:.18em]">{label}</div>
        </div>
    );
}

export async function HomeSections() {
    const t = await getTranslations("Home");
    const locale = await getLocale();
    const digits = (value: string) => localizeDigits(value, locale);

    return (
        <main className="overflow-x-hidden">
            <section id="top" className="relative overflow-hidden bg-green text-cream">
                <ArchPattern opacity={0.35} />
                <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ background: "radial-gradient(ellipse at 75% 40%, rgba(194,154,67,0.18), transparent 60%)" }}
                />
                <div className="wrap relative flex flex-wrap items-center gap-16 pt-24 pb-[170px]">
                    <div className="min-w-0 flex-[1_1_520px]">
                        <div className="intro label eyebrow-line eyebrow-light">{t("kicker")}</div>
                        <h1 className="intro d1 display mt-7 text-[clamp(52px,6.4vw,92px)] leading-[0.98] tracking-[-0.01em]">
                            {t("heroTitle")}
                            <br />
                            <em className="italic text-gold-light">{t("heroTitleEm")}</em>
                        </h1>
                        <p className="intro d2 mt-[30px] max-w-[540px] text-[19px] leading-[1.65] font-light text-cream/85">
                            {t("heroText")}
                        </p>
                        <div className="intro d3 mt-11 flex flex-wrap gap-4">
                            <Link href="/donate" className="button button-gold">
                                {t("donateNow")}
                                <ArrowIcon />
                            </Link>
                            <Link href="/assistance" className="button button-outline-white" style={{ paddingInline: 32 }}>
                                {t("applyAssistance")}
                            </Link>
                        </div>
                    </div>
                    <div className="flex min-w-[280px] flex-[0_1_480px] justify-center">
                        <div className="relative w-full max-w-[470px]">
                            <div
                                aria-hidden="true"
                                className="absolute -inset-[18px] border border-gold/60"
                                style={{ borderRadius: "260px 260px 0 0" }}
                            />
                            <div
                                className="relative h-[600px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.35)]"
                                style={{ borderRadius: "240px 240px 0 0" }}
                            >
                                <div className="hero-zoom absolute inset-0">
                                    <Image
                                        src="/images/community-hero.jpg"
                                        alt={t("heroAlt")}
                                        fill
                                        priority
                                        sizes="(max-width: 900px) 100vw, 470px"
                                        className="hero-scroll object-cover"
                                        style={{ objectPosition: "54% 50%" }}
                                    />
                                </div>
                                <div
                                    aria-hidden="true"
                                    className="absolute inset-0"
                                    style={{ background: "linear-gradient(180deg, transparent 55%, rgba(6,63,53,0.55))" }}
                                />
                            </div>
                            <div className="absolute bottom-12 -left-9 flex items-center gap-3.5 rounded-[4px] bg-cream px-[22px] py-[18px] text-green shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
                                <span className="display text-[42px] leading-none font-semibold">{digits("40")}</span>
                                <span className="label text-[12px] leading-normal text-ink [--ls:.16em] [--fs:12px]">
                                    {t("badgeTop")}
                                    <br />
                                    {t("badgeBottom")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="relative z-[2] mx-auto -mt-24 max-w-[1240px] px-[clamp(20px,4vw,56px)]">
                <div className="reveal grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] border border-gold/40 bg-paper shadow-[0_30px_60px_rgba(6,63,53,0.12)]">
                    <Stat value={digits("40")} plus label={t("stats.years")} />
                    <Stat value={digits(impactValue("jamaats"))} label={t("stats.jamaats")} />
                    <Stat value={digits("35,000")} plus label={t("stats.people")} />
                    <Stat value={digits("100")} plus label={t("stats.villages")} last />
                </div>
            </div>

            <section id="about" className="wrap flex flex-wrap items-center gap-20 pt-[140px] pb-[120px]">
                <div className="relative min-w-0 flex-[1_1_440px]">
                    <Arch
                        src="/images/students.jpg"
                        alt={t("storyAlt")}
                        radius={280}
                        className="h-[620px] max-w-[520px]"
                        sizes="(max-width: 900px) 100vw, 520px"
                    />
                    <div className="reveal absolute right-0 -bottom-10 w-[260px] border border-gold bg-green px-7 py-[34px] text-center text-cream outline outline-1 -outline-offset-[10px] outline-gold">
                        <div className="label text-gold-light [--fs:11px] [--ls:.3em]">{t("established")}</div>
                        <div className="display mt-2.5 text-[58px] leading-none">{digits("1987")}</div>
                        <div className="mx-auto my-4 h-px w-10 bg-gold" />
                        <div className="text-[13px] leading-[1.6] text-cream/85">
                            {t("plaqueName")}
                            <br />
                            {t("plaquePlace")}
                        </div>
                    </div>
                </div>
                <div className="reveal min-w-0 flex-[1_1_480px]">
                    <Eyebrow>{t("whoWeAre")}</Eyebrow>
                    <h2 className="display mt-[22px] text-[clamp(40px,4.4vw,64px)] leading-[1.04] text-green">
                        {t("storyTitle")}
                        <br />
                        <em>{t("storyTitleEm")}</em>
                    </h2>
                    <p className="mt-7 text-[18px] leading-[1.75] font-light text-ink-soft">{t("storyP1")}</p>
                    <p className="mt-[18px] text-[18px] leading-[1.75] font-light text-ink-soft">{t("storyP2")}</p>
                    <div className="mt-10 flex flex-wrap border-y border-gold/40">
                        {VALUES.map((value, index) => (
                            <div
                                key={value}
                                className={`flex-[1_1_140px] py-[22px] ${index === 0 ? "" : "border-l border-gold/40 pl-6"}`}
                            >
                                <div className="display text-[26px] text-green">{t(`values.${value}.title`)}</div>
                                <div className="mt-1 text-[14px] text-muted-ink">{t(`values.${value}.text`)}</div>
                            </div>
                        ))}
                    </div>
                    <ArrowLink href="/about" className="mt-9">
                        {t("readStory")}
                    </ArrowLink>
                </div>
            </section>

            <section className="relative flex h-[640px] items-center justify-center overflow-hidden text-center">
                <Backdrop src="/images/marriages.jpg" position="50% 60%" />
                <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(180deg, rgba(6,47,40,0.72), rgba(6,47,40,0.82))" }}
                />
                <div className="reveal relative max-w-[900px] px-6 text-cream">
                    <div className="label text-gold-light [--ls:.3em]">{t("band.eyebrow")}</div>
                    <p className="display regular mt-[26px] text-[clamp(36px,4.6vw,64px)] leading-[1.1]">
                        {t("band.text")}
                        <br />
                        <em className="text-gold-light">{t("band.textEm")}</em>
                    </p>
                </div>
            </section>

            <section id="work" className="wrap py-[130px]">
                <div className="reveal flex flex-wrap items-end justify-between gap-8">
                    <div>
                        <Eyebrow>{t("workEyebrow")}</Eyebrow>
                        <h2 className="display mt-[22px] text-[clamp(40px,4.4vw,64px)] leading-[1.04] text-green">
                            {t("workTitle")}
                            <br />
                            <em>{t("workTitleEm")}</em>
                        </h2>
                    </div>
                    <ArrowLink href="/our-work">{t("workLink")}</ArrowLink>
                </div>
                <div className="mt-16 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8">
                    {FEATURED.map((item) => (
                        <Link key={item.id} href={`/our-work/${item.slug}`} className="card reveal block">
                            <Arch
                                src={item.image}
                                alt={t(`cards.${item.id}.alt`)}
                                radius={200}
                                className="h-[440px]"
                                imageClassName="card-img"
                                position={item.position}
                                sizes="(max-width: 900px) 100vw, 33vw"
                            />
                            <div className="px-1 pt-7">
                                <div className="label text-gold-ink [--fs:12px] [--ls:.24em]">{t(`cards.${item.id}.label`)}</div>
                                <h3 className="display mt-2.5 text-[32px] text-green">{t(`cards.${item.id}.title`)}</h3>
                                <p className="mt-3 text-[16px] leading-[1.65] font-light text-[#4A5451]">{t(`cards.${item.id}.text`)}</p>
                                <div className="mt-[18px] text-[15px] font-semibold text-green">{t("learnMore")}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <section id="leadership" className="relative overflow-hidden bg-green text-cream">
                <ArchPattern opacity={0.18} />
                <div className="reveal relative mx-auto max-w-[1080px] px-[clamp(20px,4vw,56px)] py-[130px] text-center">
                    <svg width="56" height="44" viewBox="0 0 56 44" fill="none" aria-hidden="true" className="mx-auto block">
                        <path
                            d="M0 44V26C0 11 8 2 22 0l2 6c-8 2-12 8-12 16h11v22H0Zm32 0V26C32 11 40 2 54 0l2 6c-8 2-12 8-12 16h11v22H32Z"
                            fill="#C29A43"
                        />
                    </svg>
                    <blockquote className="display regular mt-9 text-[clamp(32px,3.6vw,50px)] leading-[1.22] italic">{t("quote")}</blockquote>
                    <div className="mx-auto mt-10 mb-6 h-px w-[60px] bg-gold" />
                    <div className="display regular text-[22px] text-gold-light">{t("quoteBy")}</div>
                    <div className="label mt-2 text-cream/70 [--ls:.22em]">{t("quoteRole")}</div>
                    <Link
                        href="/leadership"
                        className="button button-outline-white mt-10"
                        style={{ padding: "14px 28px", fontSize: 15, borderColor: "rgba(246,242,230,0.4)" }}
                    >
                        {t("quoteLink")}
                    </Link>
                </div>
            </section>

            <section id="impact" className="wrap flex flex-wrap gap-[72px] py-[130px]">
                <div className="reveal min-w-0 flex-[1_1_360px]">
                    <Eyebrow>{t("impactEyebrow")}</Eyebrow>
                    <h2 className="display mt-[22px] text-[clamp(40px,4.4vw,64px)] leading-[1.04] text-green">
                        {t("impactTitle")}
                        <br />
                        <em>{t("impactTitleEm")}</em>
                    </h2>
                    <p className="mt-7 max-w-[440px] text-[18px] leading-[1.75] font-light text-ink-soft">{t("impactText")}</p>
                    <ArrowLink href="/impact" className="mt-8">
                        {t("impactLink")}
                    </ArrowLink>
                </div>
                <div className="grid min-w-0 flex-[1.4_1_520px] grid-cols-[repeat(auto-fit,minmax(240px,1fr))] border-t border-gold/45">
                    {IMPACT.map((id, index) => (
                        <div
                            key={id}
                            className={`reveal border-b border-gold/45 py-10 ${index % 2 === 0 ? "pr-8" : "border-l pl-8"}`}
                        >
                            <div className="display regular text-[88px] leading-[0.9] text-green">{digits(impactValue(id))}</div>
                            <div className="mt-3.5 text-[17px] font-medium text-ink">{t(`impactFigures.${id}.label`)}</div>
                            <div className="mt-1 text-[14px] text-muted-ink">{t(`impactFigures.${id}.area`)}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section id="donate" className="relative overflow-hidden text-cream">
                <Backdrop src="/images/next-generation.jpg" position="50% 40%" />
                <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(90deg, rgba(6,47,40,0.9) 0%, rgba(6,47,40,0.6) 55%, rgba(6,47,40,0.35) 100%)" }}
                />
                <div className="wrap relative flex flex-wrap items-end justify-between gap-14 py-[150px]">
                    <div className="reveal min-w-0 flex-[1_1_520px]">
                        <Eyebrow light className="before:hidden">{t("ctaEyebrow")}</Eyebrow>
                        <h2 className="display mt-[22px] text-[clamp(44px,5vw,76px)] leading-[1.02]">
                            {t("ctaTitle")}
                            <br />
                            <em className="text-gold-light">{t("ctaTitleEm")}</em>
                        </h2>
                        <p className="mt-[26px] max-w-[520px] text-[19px] leading-[1.7] font-light text-cream/85">{t("ctaText")}</p>
                    </div>
                    <div className="reveal flex min-w-0 flex-[0_1_460px] flex-col gap-4">
                        <Link
                            href="/donate"
                            className="flex items-center justify-between gap-5 bg-gold px-[30px] py-[26px] text-green-ink transition-colors hover:bg-[var(--gold-hover)]"
                        >
                            <span>
                                <span className="display block text-[28px] font-semibold">{t("ctaDonate.title")}</span>
                                <span className="mt-0.5 block text-[15px]">{t("ctaDonate.text")}</span>
                            </span>
                            <ArrowIcon size={26} />
                        </Link>
                        <Link
                            href="/assistance"
                            className="flex items-center justify-between gap-5 border border-cream/55 px-[30px] py-[26px] text-cream backdrop-blur-[4px] transition-colors hover:bg-cream/10"
                        >
                            <span>
                                <span className="display block text-[28px]">{t("ctaAssistance.title")}</span>
                                <span className="mt-0.5 block text-[15px] text-cream/80">{t("ctaAssistance.text")}</span>
                            </span>
                            <ArrowIcon size={26} />
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
