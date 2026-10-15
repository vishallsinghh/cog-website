import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Arch, ArchPattern, Backdrop, Eyebrow } from "@/components/page-parts";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("About");
    return { title: t("metaTitle"), description: t("description") };
}

const TIMELINE = ["t1979", "t1987", "t2001", "t2027"] as const;
const STEPS = ["s1", "s2", "s3", "s4", "s5"] as const;

const VALUES = [
    {
        id: "unity",
        icon: (
            <>
                <circle cx="9" cy="8" r="3" />
                <circle cx="16.5" cy="9" r="2.5" />
                <path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6M14 14.5c.8-.3 1.6-.5 2.5-.5 2.5 0 4.5 2 4.5 4.5" />
            </>
        ),
    },
    {
        id: "service",
        icon: (
            <>
                <path d="M3 14h3l3 2h5a1.5 1.5 0 0 1 0 3H9M13 17l6-3a1.5 1.5 0 0 1 1.5 2.5L14 21H6l-3-2" />
                <path d="M14 4c2 0 3 1.5 3 3-1.5 0-3-1-3-3ZM14 4c-2 0-3 1.5-3 3 1.5 0 3-1 3-3ZM14 7v4" />
            </>
        ),
    },
    {
        id: "progress",
        icon: <path d="M4 20V14M9 20V10M14 20v-6M19 20V7M3 20h18M14 6l5-3M19 3h-3M19 3v3" />,
    },
] as const;

export default async function Page() {
    const t = await getTranslations("About");

    return (
        <main className="overflow-x-hidden">
            <section className="wrap pt-24 text-center">
                <Eyebrow center className="intro">
                    {t("eyebrow")}
                </Eyebrow>
                <h1 className="intro d1 display mx-auto mt-[26px] max-w-[1000px] text-[clamp(48px,6vw,88px)] leading-none text-green">
                    {t("title")}
                    <br />
                    <em className="text-gold-ink">{t("titleEm")}</em>
                </h1>
                <p className="intro d2 mx-auto mt-7 max-w-[700px] text-[19px] leading-[1.7] font-light text-ink-soft">
                    {t("description")}
                </p>
                <Arch
                    src="/images/community-hero.jpg"
                    alt={t("heroAlt")}
                    radius={640}
                    heroZoom
                    priority
                    position="50% 45%"
                    className="intro d3 mx-auto mt-16 h-[560px]"
                    sizes="(max-width: 1320px) 100vw, 1320px"
                />
            </section>

            <section className="relative overflow-hidden bg-green text-cream">
                <ArchPattern opacity={0.18} />
                <div className="reveal relative mx-auto max-w-[1080px] px-[clamp(20px,4vw,56px)] py-[120px] text-center">
                    <div className="label text-gold-light [--ls:.3em]">{t("missionEyebrow")}</div>
                    <p className="display regular mt-7 text-[clamp(30px,3.4vw,46px)] leading-[1.3]">
                        {t("missionA")}
                        <em className="text-gold-light">{t("missionEmA")}</em>
                        {t("missionB")}
                        <em className="text-gold-light">{t("missionEmB")}</em>
                    </p>
                </div>
            </section>

            <section id="journey" className="wrap flex flex-wrap gap-20 py-[130px]">
                <div className="reveal min-w-0 flex-[1_1_440px]">
                    <Eyebrow>{t("beganEyebrow")}</Eyebrow>
                    <h2 className="display mt-[22px] text-[clamp(40px,4.2vw,60px)] leading-[1.05] text-green">
                        {t("beganTitle")}
                        <br />
                        <em>{t("beganTitleEm")}</em>
                    </h2>
                    <p className="mt-7 text-[18px] leading-[1.75] font-light text-ink-soft">{t("beganP1")}</p>
                    <p className="mt-[18px] text-[18px] leading-[1.75] font-light text-ink-soft">{t("beganP2")}</p>
                </div>
                <ol className="m-0 min-w-0 flex-[1_1_480px] list-none border-l border-gold/50 p-0">
                    {TIMELINE.map((id, index) => {
                        const highlight = id === "t1987";
                        const last = index === TIMELINE.length - 1;

                        return (
                            <li key={id} className={`reveal relative pl-10 ${last ? "" : "pb-12"}`}>
                                <span
                                    aria-hidden="true"
                                    className={
                                        highlight
                                            ? "absolute top-3 -left-[9px] size-[17px] rounded-full bg-gold"
                                            : "absolute top-3.5 -left-[7px] size-[13px] rounded-full border border-gold bg-cream"
                                    }
                                />
                                <div className="display text-[48px] leading-none text-green">{t(`${id}.year`)}</div>
                                <div className="mt-2.5 text-[18px] font-semibold">{t(`${id}.title`)}</div>
                                <p className="mt-1.5 text-[16px] leading-[1.65] font-light text-[#4A5451]">
                                    {t(`${id}.text`)}
                                    {last && (
                                        <>
                                            {" "}
                                            <Link href="/our-journey" className="font-normal text-green underline-offset-4 hover:underline">
                                                {t("t2027.link")}
                                            </Link>
                                        </>
                                    )}
                                </p>
                            </li>
                        );
                    })}
                </ol>
            </section>

            <section className="bg-cream-deep">
                <div className="wrap py-[120px]">
                    <div className="reveal text-center">
                        <div className="label text-gold-ink">{t("valuesEyebrow")}</div>
                        <h2 className="display mt-[18px] text-[clamp(40px,4.2vw,60px)] leading-[1.05] text-green">
                            {t("valuesTitle")}
                            <em>{t("valuesTitleEm")}</em>
                        </h2>
                    </div>
                    <div className="mt-16 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-7">
                        {VALUES.map((value) => (
                            <div key={value.id} className="reveal border-t-[3px] border-gold bg-cream px-10 py-12">
                                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#7D5F1F" strokeWidth="1.2" aria-hidden="true">
                                    {value.icon}
                                </svg>
                                <h3 className="display mt-[22px] text-[40px] text-green">{t(`values.${value.id}.title`)}</h3>
                                <p className="mt-2.5 text-[17px] leading-[1.7] font-light text-[#4A5451]">{t(`values.${value.id}.text`)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="wrap py-[130px]">
                <div className="reveal flex flex-wrap items-end justify-between gap-8">
                    <div>
                        <Eyebrow>{t("howEyebrow")}</Eyebrow>
                        <h2 className="display mt-[22px] text-[clamp(40px,4.2vw,60px)] leading-[1.05] text-green">
                            {t("howTitle")}
                            <br />
                            <em>{t("howTitleEm")}</em>
                        </h2>
                    </div>
                    <p className="m-0 max-w-[420px] text-[17px] leading-[1.7] font-light text-[#4A5451]">{t("howText")}</p>
                </div>
                <div aria-hidden="true" className="grow mt-16 h-px bg-gold" />
                <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8 p-0">
                    {STEPS.map((step, index) => (
                        <li key={step} className="reveal pt-8">
                            <div className="display text-[22px] text-gold-ink">{String(index + 1).padStart(2, "0")}</div>
                            <div className="display mt-2.5 text-[28px] leading-[1.15] text-green">{t(`steps.${step}.title`)}</div>
                            <p className="mt-2.5 text-[15px] leading-[1.65] text-[#4A5451]">{t(`steps.${step}.text`)}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="relative overflow-hidden text-cream">
                <Backdrop src="/images/next-generation.jpg" position="50% 40%" />
                <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(90deg, rgba(6,47,40,0.92) 0%, rgba(6,47,40,0.7) 60%, rgba(6,47,40,0.45) 100%)" }}
                />
                <div className="reveal wrap relative py-[140px]">
                    <div className="max-w-[760px]">
                        <div className="label text-gold-light">{t("messageEyebrow")}</div>
                        <blockquote className="display regular mt-7 text-[clamp(30px,3.2vw,44px)] leading-[1.25] italic">
                            {t("messageQuote")}
                        </blockquote>
                        <div className="mt-9 mb-5 h-px w-[60px] bg-gold" />
                        <div className="display regular text-[24px] text-gold-light">{t("messageBy")}</div>
                        <div className="label mt-1.5 text-cream/75 [--ls:.22em]">{t("messageRole")}</div>
                        <div className="mt-11 flex flex-wrap gap-4">
                            <Link href="/leadership" className="button button-outline-white" style={{ padding: "15px 30px", borderColor: "rgba(246,242,230,0.55)" }}>
                                {t("messageLeadership")}
                            </Link>
                            <Link href="/our-work" className="button button-gold" style={{ padding: "15px 30px" }}>
                                {t("messageWork")}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
