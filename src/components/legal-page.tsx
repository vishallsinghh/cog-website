import { getTranslations } from "next-intl/server";
import { PageBanner } from "@/components/site-shell";

const SECTIONS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"] as const;

/** Privacy and Terms share one layout until COG supplies the legal text. */
export async function LegalPage({ namespace }: { namespace: "Privacy" | "Terms" }) {
    const t = await getTranslations(namespace);

    return (
        <main>
            <PageBanner eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
            <section className="section interior">
                <div className="container">
                    <div className="notice">{t("pending")}</div>
                    <div className="prose-block" style={{ marginTop: 40 }}>
                        {SECTIONS.map((key, index) => (
                            <h2 key={key}>
                                {index + 1}. {t(`sections.${key}`)}
                            </h2>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
