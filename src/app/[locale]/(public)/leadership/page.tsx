import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { PageBanner } from "@/components/site-shell";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Leadership");
    return { title: t("metaTitle"), description: t("description") };
}

const LEGACY = ["housing", "crisis", "institutions", "lasting"] as const;

// Ten presidential terms, 1987–2027. Only the current president is confirmed so far;
// the others stay as marked placeholders until COG supplies names and years.
const TERMS = Array.from({ length: 10 }, (_, index) => index + 1);
const CURRENT_TERM = 10;

export default async function Page() {
    const t = await getTranslations("Leadership");

    return (
        <main>
            <PageBanner eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

            <section className="section interior">
                <div className="container">
                    <p className="interior-lead">{t("intro")}</p>
                    <div className="feature-person">
                        <div className="split-image">
                            <Image
                                src="/images/legacy.png"
                                alt=""
                                fill
                                sizes="(max-width: 820px) 100vw, 40vw"
                                className="image-cover"
                            />
                        </div>
                        <div className="prose-block">
                            <span className="role">{t("chairmanRole")}</span>
                            <h2>{t("chairmanName")}</h2>
                            <p>
                                <em>{t("chairmanTagline")}</em>
                            </p>
                            <p>{t("chairmanP1")}</p>
                            <p>{t("chairmanP2")}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section-tight section-muted">
                <div className="container">
                    <div className="prose-block">
                        <h2>{t("legacyTitle")}</h2>
                    </div>
                    <div className="highlight-list">
                        {LEGACY.map((key) => (
                            <div className="content-card" key={key}>
                                <h3>{t(`legacy.${key}.title`)}</h3>
                                <p>{t(`legacy.${key}.text`)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section-tight">
                <div className="container">
                    <div className="prose-block">
                        <h2>{t("termsTitle")}</h2>
                        <p>{t("termsText")}</p>
                    </div>
                    <div className="leader-grid">
                        {TERMS.map((term) => (
                            <div className="leader-card" key={term}>
                                <span className="term">
                                    {term === CURRENT_TERM ? t("currentTerm") : t("termLabel", { number: term })}
                                </span>
                                <h3>{term === CURRENT_TERM ? t("currentPresident") : t("termPresident")}</h3>
                                <p>{t("termPending")}</p>
                            </div>
                        ))}
                    </div>
                    <span className="placeholder-note">{t("termsNote")}</span>
                </div>
            </section>
        </main>
    );
}
