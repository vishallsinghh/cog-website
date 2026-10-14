import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { PageBanner } from "@/components/site-shell";
import { PROGRAMMES } from "@/content/programmes";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("OurWork");
    return { title: t("metaTitle"), description: t("description") };
}

export default async function Page() {
    const t = await getTranslations("OurWork");
    const tp = await getTranslations("Programmes");

    return (
        <main>
            <PageBanner eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

            <section className="section interior">
                <div className="container">
                    <p className="interior-lead">{t("intro")}</p>
                    <div className="programmes-grid">
                        {PROGRAMMES.map((programme, index) => (
                            <Link
                                href={`/our-work/${programme.slug}`}
                                key={programme.slug}
                                className="programme-card"
                            >
                                <div className="programme-image">
                                    <Image
                                        src={programme.image}
                                        alt=""
                                        fill
                                        sizes="(max-width: 800px) 100vw, 33vw"
                                        className="image-cover"
                                    />
                                </div>
                                <div className="programme-card-body">
                                    <span className="card-number">
                                        {t("cardLabel", { number: String(index + 1).padStart(2, "0") })}
                                    </span>
                                    <h3>{tp(`${programme.key}.name`)}</h3>
                                    <p>{tp(`${programme.key}.short`)}</p>
                                    <span className="round-arrow">↗</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section-tight section-muted">
                <div className="container">
                    <div className="panel">
                        <h2>{t("assistanceTitle")}</h2>
                        <p className="interior-lead">{t("assistanceText")}</p>
                        <Link href="/assistance" className="button button-dark">
                            {t("assistanceLink")} <span>↗</span>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
