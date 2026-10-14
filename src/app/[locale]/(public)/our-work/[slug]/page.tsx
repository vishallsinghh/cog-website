import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageBanner } from "@/components/site-shell";
import { HIGHLIGHT_KEYS, PROGRAMMES, findProgramme } from "@/content/programmes";
import { Link } from "@/i18n/navigation";

// Every programme is prerendered by generateStaticParams, so blocking on the slug
// costs nothing, and it lets an unknown slug answer with a real 404 status.
export const instant = false;

export function generateStaticParams() {
    return PROGRAMMES.map((programme) => ({ slug: programme.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/our-work/[slug]">): Promise<Metadata> {
    const programme = findProgramme((await params).slug);
    if (!programme) return {};

    const t = await getTranslations("Programmes");
    return { title: t(`${programme.key}.name`), description: t(`${programme.key}.short`) };
}

export default async function Page({ params }: PageProps<"/[locale]/our-work/[slug]">) {
    const programme = findProgramme((await params).slug);
    if (!programme) notFound();

    const t = await getTranslations("Programmes");
    const key = programme.key;
    const others = PROGRAMMES.filter((item) => item.slug !== programme.slug);

    return (
        <main>
            <PageBanner eyebrow={t(`${key}.eyebrow`)} title={t(`${key}.name`)} description={t(`${key}.short`)} />

            <section className="section interior">
                <div className="container split">
                    <div className="prose-block">
                        <h2>{t(`${key}.title`)}</h2>
                        <p>{t(`${key}.p1`)}</p>
                        <p>{t(`${key}.p2`)}</p>
                    </div>
                    <div className="split-image">
                        <Image
                            src={programme.image}
                            alt=""
                            fill
                            sizes="(max-width: 820px) 100vw, 50vw"
                            className="image-cover"
                        />
                    </div>
                </div>
                <div className="container">
                    <p className="pull-quote">{t(`${key}.quote`)}</p>
                </div>
            </section>

            <section className="section-tight section-muted">
                <div className="container">
                    <div className="prose-block">
                        <h2>{t("highlightsTitle")}</h2>
                    </div>
                    <div className="highlight-list">
                        {HIGHLIGHT_KEYS.map((highlight) => (
                            <div className="content-card" key={highlight}>
                                <h3>{t(`${key}.${highlight}.title`)}</h3>
                                <p>{t(`${key}.${highlight}.text`)}</p>
                            </div>
                        ))}
                    </div>
                    <div className="card-link">
                        <Link href="/assistance" className="button button-dark">
                            {t("assistanceLink")} <span>↗</span>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="section-tight">
                <div className="container">
                    <div className="prose-block">
                        <h2>{t("otherProgrammes")}</h2>
                    </div>
                    <ul className="simple-list">
                        {others.map((item) => (
                            <li key={item.slug}>
                                <Link href={`/our-work/${item.slug}`}>{t(`${item.key}.name`)}</Link>
                            </li>
                        ))}
                    </ul>
                    <Link className="text-link" href="/our-work">
                        {t("backToWork")} <span>↗</span>
                    </Link>
                </div>
            </section>
        </main>
    );
}
