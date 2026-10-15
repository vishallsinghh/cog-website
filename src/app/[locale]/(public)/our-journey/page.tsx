import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Arch, ArchPattern, Eyebrow } from "@/components/page-parts";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Journey");
    return { title: t("metaTitle"), description: t("description") };
}

const PERIODS = [
    { id: "p1", panel: true },
    { id: "p2" },
    { id: "p3", image: "/images/relief.jpg", alt: "periods.p3.alt" },
    { id: "p4" },
    { id: "p5", image: "/images/marriages.jpg", alt: "periods.p5.alt" },
    { id: "p6" },
    { id: "p7", image: "/images/education.jpg", alt: "periods.p7.alt" },
    { id: "p8", image: "/images/housing.jpg", alt: "periods.p8.alt" },
] as const;

const DOT_LEFT = "calc(-1 * clamp(36px, 5vw, 72px))";

export default async function Page() {
    const t = await getTranslations("Journey");

    return (
        <main className="overflow-x-hidden">
            <section className="wrap flex flex-wrap items-end justify-between gap-12 pt-[100px] pb-20">
                <div className="min-w-0 flex-[1_1_620px]">
                    <Eyebrow className="intro">{t("eyebrow")}</Eyebrow>
                    <h1 className="intro d1 display mt-[26px] text-[clamp(48px,6vw,92px)] leading-[0.98] text-green">
                        {t("title")}
                        <br />
                        <em className="text-gold-ink">{t("titleEm")}</em>
                    </h1>
                </div>
                <p className="intro d2 m-0 flex-[0_1_400px] text-[18px] leading-[1.7] font-light text-ink-soft">{t("description")}</p>
            </section>

            <section className="mx-auto max-w-[1100px] px-[clamp(20px,4vw,56px)] pt-5 pb-[120px]">
                <ol className="relative m-0 list-none p-0 pl-[clamp(36px,5vw,72px)]">
                    <li aria-hidden="true" className="absolute top-3 bottom-3 left-2 w-px bg-gold/35" />
                    <li aria-hidden="true" className="fill absolute top-3 bottom-3 left-[7px] w-[3px] rounded-[3px] bg-gold" />
                    {PERIODS.map((period, index) => {
                        const image = "image" in period ? period.image : undefined;
                        const alt = "alt" in period ? period.alt : undefined;
                        const last = index === PERIODS.length - 1;

                        return (
                            <li key={period.id} className={`relative ${last ? "" : "pb-[88px]"}`}>
                                <span
                                    className="dot absolute top-5 box-border size-[17px] rounded-full border-2 border-gold bg-gold"
                                    aria-hidden="true"
                                    style={{ left: DOT_LEFT }}
                                />
                                <div className={`reveal ${image || "panel" in period ? "flex flex-wrap items-center gap-10" : "max-w-[680px]"}`}>
                                    <div className="min-w-0 flex-[1_1_420px]">
                                        <div className="display text-[clamp(52px,5.4vw,76px)] leading-none text-green">{t(`periods.${period.id}.years`)}</div>
                                        <h2 className="display mt-3 text-[30px] text-ink">{t(`periods.${period.id}.title`)}</h2>
                                        <p className="mt-2.5 text-[17px] leading-[1.75] font-light text-[#4A5451]">{t(`periods.${period.id}.text`)}</p>
                                        <div className="label mt-4 text-gold-ink [--fs:12px] [--ls:.2em]">{t(`periods.${period.id}.tags`)}</div>
                                    </div>
                                    {"panel" in period && (
                                        <div className="min-w-[200px] flex-[0_1_260px] bg-green px-7 py-8 text-center text-cream outline outline-1 -outline-offset-[10px] outline-gold">
                                            <div className="label text-gold-light [--fs:11px] [--ls:.3em]">{t("established")}</div>
                                            <div className="display mt-2 text-[54px] leading-none">{t("establishedDate")}</div>
                                        </div>
                                    )}
                                    {image && alt && (
                                        <Arch
                                            src={image}
                                            alt={t(alt)}
                                            radius={140}
                                            className="h-[340px] min-w-[200px] flex-[0_1_280px]"
                                            sizes="280px"
                                        />
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </section>

            <section className="relative overflow-hidden bg-green text-cream">
                <ArchPattern opacity={0.2} />
                <div className="reveal relative mx-auto max-w-[1100px] px-[clamp(20px,4vw,56px)] py-[110px] text-center">
                    <div className="display text-[clamp(64px,8vw,120px)] leading-none text-gold-light">
                        {t("bandFrom")} <span className="font-light text-cream">→</span> {t("bandTo")}
                    </div>
                    <p className="display regular mt-6 text-[clamp(26px,2.6vw,36px)] leading-[1.3] italic">
                        {t("bandLine1")}
                        <br />
                        {t("bandLine2")}
                    </p>
                    <div className="mt-10 flex flex-wrap justify-center gap-4">
                        <Link href="/leadership" className="button button-gold" style={{ padding: "16px 32px" }}>
                            {t("bandLeaders")}
                        </Link>
                        <Link href="/our-work" className="button button-outline-white" style={{ padding: "16px 32px", borderColor: "rgba(246,242,230,0.55)" }}>
                            {t("bandWork")}
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
