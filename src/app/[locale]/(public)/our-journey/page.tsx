import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageBanner } from "@/components/site-shell";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Journey");
    return { title: t("metaTitle"), description: t("description") };
}

const MILESTONES = ["m1979", "m1987", "m2001", "mHousing", "m2027"] as const;

export default async function Page() {
    const t = await getTranslations("Journey");

    return (
        <main>
            <PageBanner eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

            <section className="section interior">
                <div className="container">
                    <div className="prose-block">
                        <h2>{t("rootsTitle")}</h2>
                        <p>{t("rootsP1")}</p>
                        <p>{t("rootsP2")}</p>
                    </div>
                </div>
            </section>

            <section className="section-tight section-muted">
                <div className="container">
                    <div className="prose-block">
                        <h2>{t("timelineTitle")}</h2>
                    </div>
                    <ol className="timeline">
                        {MILESTONES.map((key) => {
                            const year = t(`milestones.${key}.year`);

                            return (
                                <li key={key}>
                                    {year ? (
                                        <span className="year">{year}</span>
                                    ) : (
                                        <span className="placeholder-note">{t("yearPending")}</span>
                                    )}
                                    <h3>{t(`milestones.${key}.title`)}</h3>
                                    <p>{t(`milestones.${key}.text`)}</p>
                                </li>
                            );
                        })}
                    </ol>
                    <span className="placeholder-note">{t("timelineNote")}</span>
                </div>
            </section>

            <section className="section-tight">
                <div className="container">
                    <p className="pull-quote">{t("closing")}</p>
                    <Link className="text-link" href="/leadership">
                        {t("leadershipLink")} <span>↗</span>
                    </Link>
                </div>
            </section>
        </main>
    );
}
