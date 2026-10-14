import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageBanner } from "@/components/site-shell";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("NextGeneration");
    return { title: t("metaTitle"), description: t("description") };
}

const PRIORITIES = ["spiritual", "education", "ai", "identity", "governance", "institutions"] as const;
const VISION = ["v1", "v2", "v3", "v4", "v5", "v6", "v7"] as const;

export default async function Page() {
    const t = await getTranslations("NextGeneration");

    return (
        <main>
            <PageBanner eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

            <section className="section interior">
                <div className="container">
                    <p className="interior-lead">{t("intro")}</p>
                    <p className="pull-quote">{t("focus")}</p>
                </div>
            </section>

            <section className="section-tight section-muted">
                <div className="container">
                    <div className="prose-block">
                        <h2>{t("prioritiesTitle")}</h2>
                    </div>
                    <div className="content-grid">
                        {PRIORITIES.map((key, index) => (
                            <div className="content-card" key={key}>
                                <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
                                <h3>{t(`priorities.${key}.title`)}</h3>
                                <p>{t(`priorities.${key}.text`)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section-tight">
                <div className="container split">
                    <div className="prose-block">
                        <h2>{t("visionTitle")}</h2>
                        <p>{t("visionIntro")}</p>
                        <ul className="simple-list">
                            {VISION.map((key) => (
                                <li key={key}>{t(`vision.${key}`)}</li>
                            ))}
                        </ul>
                    </div>
                    <p className="pull-quote">{t("closing")}</p>
                </div>
            </section>
        </main>
    );
}
