import { getTranslations } from "next-intl/server";
import type { NavItem } from "@/lib/navigation";
import { NavIcon } from "./nav-icon";
import { PageHeader } from "./page-header";

const PLANNED = ["p1", "p2", "p3", "p4"] as const;
type SectionKey = "applications" | "donations" | "reports" | "content";

function isSection(key: string): key is SectionKey {
    return key === "applications" || key === "donations" || key === "reports" || key === "content";
}

export async function PagePlaceholder({ item }: { item: NavItem }) {
    const t = await getTranslations("Placeholder");
    const tn = await getTranslations("Nav.items");

    if (!isSection(item.key)) return null;

    const base = `sections.${item.key}` as const;

    return (
        <div className="flex flex-col">
            <PageHeader title={tn(`${item.key}.title`)} />

            <section className="rise relative mt-6 flex flex-wrap items-center gap-12 overflow-hidden rounded-[22px] bg-green p-[clamp(36px,5vw,72px)] text-cream">
                <div className="arch-bg absolute inset-0" aria-hidden="true" style={{ opacity: 0.16 }} />
                <div className="relative flex-none">
                    <div
                        className="float flex h-[190px] w-[150px] items-center justify-center border border-gold/70 bg-gold/8 text-gold-light [&_svg]:size-14 [&_svg]:stroke-[1.2]"
                        style={{ borderRadius: "75px 75px 0 0" }}
                    >
                        <NavIcon name={item.key} />
                    </div>
                </div>
                <div className="relative min-w-0 flex-[1_1_420px]">
                    <div className="label inline-flex rounded-full bg-gold/20 px-3.5 py-1.5 font-semibold text-gold-light [--ls:.14em]">
                        {t("badge")}
                    </div>
                    <h2 className="display mt-[18px] text-[clamp(34px,3.4vw,48px)] leading-[1.1]">{t(`${base}.headline`)}</h2>
                    <p className="mt-3 max-w-[560px] text-[17px] leading-[1.7] text-cream/85">{t(`${base}.lede`)}</p>
                </div>
            </section>

            <section aria-labelledby="planned" className="rise mt-6">
                <h2 id="planned" className="display text-[26px] text-green">
                    {t("planned")}
                </h2>
                <ul className="m-0 mt-3.5 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5 p-0">
                    {PLANNED.map((key, index) => (
                        <li
                            key={key}
                            className="flex items-start gap-3.5 rounded-[14px] border border-green/10 bg-[#FFFDF8] p-5"
                        >
                            <span className="display flex size-[30px] flex-none items-center justify-center rounded-full border border-gold text-[16px] text-gold-ink">
                                {index + 1}
                            </span>
                            <span>
                                <span className="block font-semibold">{t(`${base}.${key}.title`)}</span>
                                <span className="mt-1 block text-[14px] leading-[1.5] text-muted-ink">{t(`${base}.${key}.text`)}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
