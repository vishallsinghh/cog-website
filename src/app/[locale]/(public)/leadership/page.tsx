import type { Metadata } from "next";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Arch, ArchPattern, Backdrop, Eyebrow } from "@/components/page-parts";
import { Link } from "@/i18n/navigation";
import { localizeDigits } from "@/lib/digits";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Leadership");
    return { title: t("metaTitle"), description: t("description") };
}

const LEGACY = ["housing", "crisis", "institutions", "lasting"] as const;

const PRESIDENTS = [
    { id: "p1", image: "01" },
    { id: "p2", image: "02" },
    { id: "p3", image: "03" },
    { id: "p4", image: "04" },
    { id: "p5", image: "05" },
    { id: "p6", image: "06" },
    { id: "p7", image: "04" },
    { id: "p8", image: "07" },
    { id: "p9", image: "08" },
    { id: "p10", image: "09", current: true },
] as const;

const STATS = ["terms", "years", "responsibility"] as const;
const STAT_VALUES = { terms: "10", years: "40", responsibility: "1" } as const;

export default async function Page() {
    const t = await getTranslations("Leadership");
    const locale = await getLocale();

    return (
        <main className="overflow-x-hidden">
            <section className="wrap pt-[100px] pb-[90px] text-center">
                <Eyebrow center className="intro">
                    {t("eyebrow")}
                </Eyebrow>
                <h1 className="intro d1 display mx-auto mt-[26px] max-w-[1050px] text-[clamp(48px,6vw,90px)] leading-none text-green">
                    {t("title")}
                    <br />
                    <em className="text-gold-ink">{t("titleEm")}</em>
                </h1>
                <p className="intro d2 mx-auto mt-7 max-w-[680px] text-[19px] leading-[1.7] font-light text-ink-soft">{t("description")}</p>
                <div className="intro d2 mt-11 inline-flex flex-wrap justify-center border border-gold/50">
                    {STATS.map((stat, index) => (
                        <div key={stat} className={`px-9 py-5 ${index === 0 ? "" : "border-l border-gold/50"}`}>
                            <div className="display text-[44px] leading-none text-green">{localizeDigits(STAT_VALUES[stat], locale)}</div>
                            <div className="label mt-1.5 text-muted-ink [--ls:.16em]">{t(`stats.${stat}`)}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="relative overflow-hidden bg-green text-cream">
                <ArchPattern opacity={0.15} />
                <div className="wrap relative flex flex-wrap items-center gap-[72px] py-[120px]">
                    <div className="flex min-w-0 flex-[1_1_420px] justify-center">
                        <div className="relative w-full max-w-[480px]">
                            <div
                                aria-hidden="true"
                                className="absolute -inset-4 border border-gold/60"
                                style={{ borderRadius: "260px 260px 0 0" }}
                            />
                            <Arch
                                src="/images/founder.jpg"
                                alt={t("founderAlt")}
                                radius={240}
                                position="40% 20%"
                                className="h-[620px]"
                                sizes="(max-width: 900px) 100vw, 480px"
                            />
                        </div>
                    </div>
                    <div className="reveal min-w-0 flex-[1_1_520px]">
                        <div className="label text-gold-light">{t("chairmanRole")}</div>
                        <h2 className="display mt-[18px] text-[clamp(48px,5vw,76px)] leading-none">{t("chairmanName")}</h2>
                        <div className="label mt-3 text-[15px] text-cream/75 [--fs:15px] [--ls:.12em]">{t("chairmanFull")}</div>
                        <p className="display regular mt-8 text-[28px] leading-[1.35] text-gold-light italic">{t("chairmanTagline")}</p>
                        <p className="mt-5 text-[17px] leading-[1.75] font-light text-cream/85">{t("chairmanText")}</p>
                        <div className="mt-9 grid grid-cols-2 border-t border-gold/45">
                            {LEGACY.map((key, index) => (
                                <div
                                    key={key}
                                    className={`border-b border-gold/45 py-5 ${index % 2 === 0 ? "pr-4" : "border-l pl-4"}`}
                                >
                                    <div className="font-semibold text-cream">{t(`legacy.${key}.title`)}</div>
                                    <div className="mt-1 text-[15px] text-cream/75">{t(`legacy.${key}.text`)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="wrap py-[130px]">
                <div className="reveal flex flex-wrap items-end justify-between gap-8">
                    <div>
                        <Eyebrow>{t("presidentsEyebrow")}</Eyebrow>
                        <h2 className="display mt-[22px] text-[clamp(40px,4.2vw,60px)] leading-[1.05] text-green">
                            {t("presidentsTitle")}
                            <em>{t("presidentsTitleEm")}</em>
                        </h2>
                    </div>
                    <p className="m-0 max-w-[420px] text-[17px] leading-[1.7] font-light text-[#4A5451]">{t("presidentsNote")}</p>
                </div>
                <ol className="m-0 mt-16 grid list-none grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-7 gap-y-12 p-0">
                    {PRESIDENTS.map((president) => (
                        <li key={president.id} className="pcard reveal">
                            <div
                                className="relative h-[290px] overflow-hidden bg-[#E7DFC9] outline outline-1 outline-offset-[6px] outline-gold/55"
                                style={{ borderRadius: "120px 120px 0 0" }}
                            >
                                <Image
                                    src={`/images/presidents/${president.image}.jpg`}
                                    alt={t(`presidents.${president.id}.name`)}
                                    fill
                                    sizes="220px"
                                    className="portrait object-cover"
                                    style={{ objectPosition: "50% 20%" }}
                                />
                                {"current" in president && (
                                    <span className="label absolute bottom-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3.5 py-1.5 font-semibold whitespace-nowrap text-green-ink [--fs:12px] [--ls:.12em]">
                                        {t("currentPresident")}
                                    </span>
                                )}
                            </div>
                            <div className="display mt-[26px] text-[22px] text-gold-ink">{t(`presidents.${president.id}.term`)}</div>
                            <div className="display mt-1.5 text-[23px] leading-[1.2] text-green">{t(`presidents.${president.id}.name`)}</div>
                            <div className="mt-1.5 text-[14px] text-muted-ink">{t(`presidents.${president.id}.meta`)}</div>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="relative overflow-hidden text-cream">
                <Backdrop src="/images/community-hero.jpg" />
                <div aria-hidden="true" className="absolute inset-0" style={{ background: "rgba(6,47,40,0.82)" }} />
                <div className="reveal relative mx-auto max-w-[1000px] px-[clamp(20px,4vw,56px)] py-[120px] text-center">
                    <p className="display regular m-0 text-[clamp(36px,4.4vw,60px)] leading-[1.1]">
                        {t("closingLine")}
                        <br />
                        <em className="text-gold-light">{t("closingLineEm")}</em>
                    </p>
                    <div className="label mt-7 text-gold-light [--ls:.3em]">{t("motto")}</div>
                    <Link
                        href="/our-journey"
                        className="button button-outline-white mt-9"
                        style={{ padding: "16px 32px", borderColor: "rgba(246,242,230,0.55)" }}
                    >
                        {t("closingLink")}
                    </Link>
                </div>
            </section>
        </main>
    );
}
