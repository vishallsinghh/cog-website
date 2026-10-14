import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageBanner } from "@/components/site-shell";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Updates");
    return { title: t("metaTitle"), description: t("description") };
}

export default async function Page() {
    const t = await getTranslations("Updates");

    return (
        <main>
            <PageBanner eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
            <section className="section interior">
                <div className="container">
                    <div className="panel">
                        <h2>{t("panelTitle")}</h2>
                        <p className="interior-lead">{t("panelText")}</p>
                        <div className="notice">{t("notice")}</div>
                    </div>
                </div>
            </section>
        </main>
    );
}
