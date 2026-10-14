import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageBanner } from "@/components/site-shell";
import { IMPACT_FIGURES } from "@/content/impact";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Impact");
    return { title: t("metaTitle"), description: t("description") };
}

const AREAS = ["education", "housing", "healthcare", "welfare", "social", "relief"] as const;

export default async function Page() {
    const t = await getTranslations("Impact");

    return (
        <main>
            <PageBanner eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

            <section className="section interior">
                <div className="container">
                    <p className="interior-lead">{t("intro")}</p>
                    <div className="figure-grid">
                        {IMPACT_FIGURES.map((figure) => (
                            <div key={figure.id}>
                                <strong>{figure.value}</strong>
                                <span>{t(`figures.${figure.id}`)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section-tight section-muted">
                <div className="container">
                    <div className="prose-block">
                        <h2>{t("areasTitle")}</h2>
                    </div>
                    <div className="content-grid">
                        {AREAS.map((key) => (
                            <div className="content-card" key={key}>
                                <h3>{t(`areas.${key}.title`)}</h3>
                                <p>{t(`areas.${key}.text`)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section-tight">
                <div className="container">
                    <p className="pull-quote">
                        {t("closing")} {t("closingQuote")}
                    </p>
                </div>
            </section>
        </main>
    );
}
