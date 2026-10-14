import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { impactValue } from "@/content/impact";
import { PROGRAMMES } from "@/content/programmes";
import { Link } from "@/i18n/navigation";

// The home page features the first three programmes.
const FEATURED = PROGRAMMES.slice(0, 3);

export async function HomeSections() {
    const t = await getTranslations("Home");
    const tp = await getTranslations("Programmes");
    const ti = await getTranslations("Impact");

    return (
        <main>
            <section className="hero">
                <div className="hero-photo">
                    <Image
                        src="/images/community-hero.png"
                        alt={t("heroAlt")}
                        fill
                        priority
                        sizes="100vw"
                        className="image-cover"
                    />
                </div>
                <div className="hero-overlay" />
                <div className="container hero-content">
                    <div className="hero-kicker">
                        <span className="hero-kicker-line" /> {t("kicker")}{" "}
                        <span className="hero-kicker-line" />
                    </div>
                    <h1>
                        {t("heroTitle")}
                        <br />
                        <em>{t("heroTitleEm")}</em>
                    </h1>
                    <p>{t("heroText")}</p>
                    <div className="hero-buttons">
                        <Link href="/our-work" className="button button-gold">
                            {t("exploreWork")} <span>↗</span>
                        </Link>
                        <Link href="/about" className="button button-outline-white">
                            {t("discoverStory")} <span>↗</span>
                        </Link>
                    </div>
                    <div className="hero-bottom">
                        <span>{t("heroBottom.place")}</span>
                        <span>{t("heroBottom.established")}</span>
                        <span>{t("heroBottom.motto")}</span>
                    </div>
                </div>
            </section>
            <section className="stats">
                <div className="container stats-grid">
                    <div>
                        <strong>
                            40<span>+</span>
                        </strong>
                        <span>{t("stats.years")}</span>
                    </div>
                    <div>
                        <strong>{impactValue("jamaats")}</strong>
                        <span>{t("stats.jamaats")}</span>
                    </div>
                    <div>
                        <strong>
                            35,000<span>+</span>
                        </strong>
                        <span>{t("stats.people")}</span>
                    </div>
                    <div>
                        <strong>
                            100<span>+</span>
                        </strong>
                        <span>{t("stats.villages")}</span>
                    </div>
                </div>
            </section>
            <section className="section story">
                <div className="container story-grid">
                    <div className="story-image">
                        <Image
                            src="/images/students.png"
                            fill
                            sizes="(max-width: 800px) 100vw, 50vw"
                            className="image-cover"
                            alt={t("storyAlt")}
                        />
                        <div className="image-plaque">
                            <span>{t("plaqueEst")}</span>
                            <strong>1987</strong>
                            <span>{t("plaquePlace")}</span>
                        </div>
                    </div>
                    <div className="story-copy">
                        <div className="eyebrow">{t("whoWeAre")}</div>
                        <h2>
                            {t("storyTitle")}
                            <br />
                            <em>{t("storyTitleEm")}</em>
                        </h2>
                        <div className="gold-rule" />
                        <p>{t("storyP1")}</p>
                        <p>{t("storyP2")}</p>
                        <Link className="text-link" href="/our-journey">
                            {t("storyLink")} <span>↗</span>
                        </Link>
                    </div>
                </div>
            </section>
            <section className="section work-section">
                <div className="container">
                    <div className="section-heading">
                        <div>
                            <div className="eyebrow">{t("workEyebrow")}</div>
                            <h2>
                                {t("workTitle")}
                                <br />
                                <em>{t("workTitleEm")}</em>
                            </h2>
                        </div>
                        <div>
                            <p>{t("workText")}</p>
                            <Link href="/our-work" className="text-link">
                                {t("workLink")} <span>↗</span>
                            </Link>
                        </div>
                    </div>
                    <div className="programmes-grid">
                        {FEATURED.map((c, i) => (
                            <Link href={`/our-work/${c.slug}`} key={c.slug} className="programme-card">
                                <div className="programme-image">
                                    <Image
                                        src={c.image}
                                        alt=""
                                        fill
                                        sizes="(max-width: 800px) 100vw, 33vw"
                                        className="image-cover"
                                    />
                                </div>
                                <div className="programme-card-body">
                                    <span className="card-number">
                                        {t("cardLabel", { number: String(i + 1).padStart(2, "0") })}
                                    </span>
                                    <h3>{tp(`${c.key}.name`)}</h3>
                                    <p>{tp(`${c.key}.short`)}</p>
                                    <span className="round-arrow">↗</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
            <section className="quote-section">
                <div className="container quote-grid">
                    <div className="quote-mark">“</div>
                    <div>
                        <blockquote>{t("quote")}</blockquote>
                        <p>
                            {t("quoteBy")}
                            <br />
                            <span>{t("quoteRole")}</span>
                        </p>
                        <Link href="/leadership" className="text-link text-link-light">
                            {t("quoteLink")} <span>↗</span>
                        </Link>
                    </div>
                </div>
            </section>
            <section className="section impact-section">
                <div className="container impact-grid">
                    <div>
                        <div className="eyebrow">{t("impactEyebrow")}</div>
                        <h2>
                            {t("impactTitle")}
                            <br />
                            <em>{t("impactTitleEm")}</em>
                        </h2>
                        <p>{t("impactText")}</p>
                        <Link href="/impact" className="button button-dark">
                            {t("impactLink")} <span>↗</span>
                        </Link>
                    </div>
                    <div className="impact-numbers">
                        {(["housing", "elderlyWomen", "marriageProgrammes", "marriages"] as const).map((id) => (
                            <div key={id}>
                                <strong>{impactValue(id)}</strong>
                                <span>{ti(`figures.${id}`)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="cta-section">
                <div className="container cta-inner">
                    <div>
                        <div className="eyebrow light">{t("ctaEyebrow")}</div>
                        <h2>
                            {t("ctaTitle")}
                            <br />
                            <em>{t("ctaTitleEm")}</em>
                        </h2>
                        <p>{t("ctaText")}</p>
                    </div>
                    <div className="cta-buttons">
                        <Link href="/donate" className="button button-gold">
                            {t("ctaDonate")} <span>↗</span>
                        </Link>
                        <Link href="/assistance" className="button button-outline-white">
                            {t("ctaAssistance")} <span>↗</span>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
