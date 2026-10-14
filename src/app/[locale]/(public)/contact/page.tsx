import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageBanner } from "@/components/site-shell";
import { CONTACT } from "@/content/site";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Contact");
    return { title: t("metaTitle"), description: t("description") };
}

export default async function Page() {
    const t = await getTranslations("Contact");

    return (
        <main>
            <PageBanner eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
            <section className="section interior">
                <div className="container">
                    <div className="content-grid">
                        <div className="content-card">
                            <span className="card-number">{t("visit")}</span>
                            <h3>{t("address")}</h3>
                            <p>{t("addressValue")}</p>
                        </div>
                        <div className="content-card">
                            <span className="card-number">{t("call")}</span>
                            <h3>{t("phone")}</h3>
                            <p>
                                <a className="contact-link" href={CONTACT.phoneHref}>
                                    {CONTACT.phone}
                                </a>
                            </p>
                        </div>
                        <div className="content-card">
                            <span className="card-number">{t("write")}</span>
                            <h3>{t("email")}</h3>
                            <p>
                                <a className="contact-link" href={`mailto:${CONTACT.email}`}>
                                    {CONTACT.email}
                                </a>
                            </p>
                            <span className="card-number">{t("online")}</span>
                            <p>
                                <a className="contact-link" href={CONTACT.websiteHref}>
                                    {CONTACT.website}
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
