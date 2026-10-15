import type { Metadata } from "next";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { DonateForm } from "@/components/donate/donate-form";
import { Eyebrow } from "@/components/page-parts";
import { CONTACT } from "@/content/site";
import { localizeDigits } from "@/lib/digits";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Donate");
    return { title: t("metaTitle"), description: t("description") };
}

const STATS = [
    { id: "families", value: "681" },
    { id: "marriages", value: "830" },
    { id: "women", value: "~700" },
] as const;

export default async function Page() {
    const t = await getTranslations("Donate");
    const locale = await getLocale();

    return (
        <main className="overflow-x-hidden">
            <section className="wrap flex flex-wrap items-start gap-14 pt-[72px] pb-[110px]">
                <div className="min-w-0 flex-[1_1_480px]">
                    <Eyebrow className="intro">{t("eyebrow")}</Eyebrow>
                    <h1 className="intro d1 display mt-6 text-[clamp(48px,5.4vw,80px)] leading-none text-green">
                        {t("title")}
                        <br />
                        <em className="text-gold-ink">{t("titleEm")}</em>
                    </h1>
                    <p className="intro d2 mt-[26px] max-w-[520px] text-[19px] leading-[1.7] font-light text-ink-soft">{t("description")}</p>
                    <div
                        className="intro d3 relative mt-11 h-[420px] max-w-[560px] overflow-hidden"
                        style={{ borderRadius: "300px 300px 0 0" }}
                    >
                        <div className="hero-zoom absolute inset-0">
                            <Image
                                src="/images/students.jpg"
                                alt={t("imageAlt")}
                                fill
                                sizes="(max-width: 900px) 100vw, 560px"
                                className="object-cover"
                            />
                        </div>
                        <div
                            aria-hidden="true"
                            className="absolute inset-0"
                            style={{ background: "linear-gradient(180deg, transparent 45%, rgba(6,47,40,0.85))" }}
                        />
                        <div className="absolute right-8 bottom-7 left-8 grid grid-cols-3 gap-4 text-cream">
                            {STATS.map((stat) => (
                                <div key={stat.id}>
                                    <div className="display text-[40px] leading-none">{localizeDigits(stat.value, locale)}</div>
                                    <div className="mt-1 text-[13px] text-cream/85">{t(`stats.${stat.id}`)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DonateForm />
            </section>

            <section className="bg-cream-deep">
                <div className="reveal wrap grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-10 py-[90px]">
                    <div>
                        <h2 className="display m-0 text-[40px] leading-[1.1] text-green">
                            {t("otherTitle")}
                            <em>{t("otherTitleEm")}</em>
                        </h2>
                        <p className="mt-3.5 text-[17px] leading-[1.7] font-light text-[#4A5451]">{t("otherText")}</p>
                    </div>
                    <div className="border-t-2 border-gold pt-[22px]">
                        <div className="display text-[26px] text-green">{t("bank.title")}</div>
                        <p className="mt-2 text-[16px] leading-[1.7] text-[#4A5451]">
                            {t("bank.name")}
                            <br />
                            {t("bank.details")}
                        </p>
                    </div>
                    <div className="border-t-2 border-gold pt-[22px]">
                        <div className="display text-[26px] text-green">{t("talk.title")}</div>
                        <p className="mt-2 text-[16px] leading-[1.7] text-[#4A5451]">
                            <a href={CONTACT.phoneHref} className="text-green hover:text-gold-ink">
                                {CONTACT.phone}
                            </a>
                            <br />
                            <a href={`mailto:${CONTACT.email}`} className="text-green hover:text-gold-ink">
                                {CONTACT.email}
                            </a>
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
