import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageBanner } from "@/components/site-shell";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Assistance");
    return { title: t("metaTitle"), description: t("description") };
}

const PROGRAMMES = ["primary", "higher", "medical", "housing", "widow", "ramzan", "sports"] as const;

export default async function Page() {
    const t = await getTranslations("Assistance");

    return (
        <main>
            <PageBanner eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
            <section className="section interior">
                <div className="container">
                    <p className="interior-lead">{t("intro")}</p>
                    <div className="content-grid">
                        {PROGRAMMES.map((key, index) => (
                            <div className="content-card" key={key}>
                                <span className="card-number">
                                    {t("cardLabel", { number: String(index + 1).padStart(2, "0") })}
                                </span>
                                <h3>{t(`programmes.${key}`)}</h3>
                                <p>{t("cardText")}</p>
                            </div>
                        ))}
                    </div>
                    <div className="notice" style={{ marginTop: 28 }}>
                        {t("notice")}
                    </div>
                </div>
            </section>
        </main>
    );
}
