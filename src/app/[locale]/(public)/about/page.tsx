import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageBanner } from "@/components/site-shell";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("About");
    return { title: t("metaTitle"), description: t("description") };
}

const VALUES = ["unity", "service", "progress"] as const;
const HOW = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

export default async function Page() {
    const t = await getTranslations("About");

    return (
        <main>
            <PageBanner eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

            <section className="section interior">
                <div className="container split">
                    <div className="prose-block">
                        <h2>{t("whoTitle")}</h2>
                        <p>{t("whoP1")}</p>
                        <p>{t("whoP2")}</p>
                        <p>{t("whoP3")}</p>
                        <p>{t("whoP4")}</p>
                    </div>
                    <div>
                        <p className="pull-quote">{t("mission")}</p>
                    </div>
                </div>
            </section>

            <section className="section-tight section-muted">
                <div className="container">
                    <div className="prose-block">
                        <h2>{t("messageTitle")}</h2>
                        <p>{t("messageP1")}</p>
                        <p>{t("messageP2")}</p>
                        <p>
                            <strong>{t("messageBy")}</strong>
                        </p>
                    </div>
                </div>
            </section>

            <section className="section-tight">
                <div className="container">
                    <div className="prose-block">
                        <h2>{t("valuesTitle")}</h2>
                    </div>
                    <div className="content-grid">
                        {VALUES.map((key) => (
                            <div className="content-card" key={key}>
                                <span className="card-number">{t(`values.${key}.label`)}</span>
                                <h3>{t(`values.${key}.title`)}</h3>
                                <p>{t(`values.${key}.text`)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section-tight section-muted">
                <div className="container split">
                    <div className="prose-block">
                        <h2>{t("networkTitle")}</h2>
                        <p>{t("networkText")}</p>
                        <Link className="text-link" href="/our-journey">
                            {t("journeyLink")} <span>↗</span>
                        </Link>
                    </div>
                    <div className="prose-block">
                        <h2>{t("howTitle")}</h2>
                        <ul className="simple-list">
                            {HOW.map((key) => (
                                <li key={key}>{t(`how.${key}`)}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>
        </main>
    );
}
