import Link from "next/link";
import Image from "next/image";
import { Shell } from "./site-shell";
const programmeCards = [
    {
        n: "01",
        name: "Education & scholarships",
        desc: "Supporting students, opening doors and investing in brighter futures.",
        image: "/images/education.png",
        href: "/programmes#education",
    },
    {
        n: "02",
        name: "Housing & community",
        desc: "Helping families find stability, security and a place to call home.",
        image: "/images/housing.png",
        href: "/programmes#housing",
    },
    {
        n: "03",
        name: "Healthcare & welfare",
        desc: "Standing beside families when care and support matter most.",
        image: "/images/healthcare.png",
        href: "/programmes#healthcare",
    },
];
export function HomeSections() {
    return (
        <Shell>
            <main>
                <section className="hero">
                    <div className="hero-photo">
                        <Image
                            src="/images/community-hero.png"
                            alt="Community members together"
                            fill
                            priority
                            sizes="100vw"
                            className="image-cover"
                        />
                    </div>
                    <div className="hero-overlay" />
                    <div className="container hero-content">
                        <div className="hero-kicker">
                            <span className="hero-kicker-line" /> THE COUNCIL OF GUJARAT{" "}
                            <span className="hero-kicker-line" />
                        </div>
                        <h1>
                            United by faith.
                            <br />
                            <em>Driven by service.</em>
                        </h1>
                        <p>
                            Bringing KSI Jamaats together to uplift lives, strengthen
                            communities and shape a better tomorrow.
                        </p>
                        <div className="hero-buttons">
                            <Link href="/programmes" className="button button-gold">
                                Explore our work <span>↗</span>
                            </Link>
                            <Link href="/about" className="button button-outline-white">
                                Discover our story <span>↗</span>
                            </Link>
                        </div>
                        <div className="hero-bottom">
                            <span>GUJARAT, INDIA</span>
                            <span>ESTABLISHED 1987</span>
                            <span>UNITY • SERVICE • PROGRESS</span>
                        </div>
                    </div>
                </section>
                <section className="stats">
                    <div className="container stats-grid">
                        <div>
                            <strong>
                                40<span>+</span>
                            </strong>
                            <span>Years of service</span>
                        </div>
                        <div>
                            <strong>44</strong>
                            <span>KSI Jamaats united</span>
                        </div>
                        <div>
                            <strong>
                                35,000<span>+</span>
                            </strong>
                            <span>Community members</span>
                        </div>
                        <div>
                            <strong>
                                100<span>+</span>
                            </strong>
                            <span>Cities & villages</span>
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
                                alt="Young community members learning together"
                            />
                            <div className="image-plaque">
                                <span>EST.</span>
                                <strong>1987</strong>
                                <span>GUJARAT</span>
                            </div>
                        </div>
                        <div className="story-copy">
                            <div className="eyebrow">WHO WE ARE</div>
                            <h2>
                                Rooted in community.
                                <br />
                                <em>Growing together.</em>
                            </h2>
                            <div className="gold-rule" />
                            <p>
                                For nearly four decades, The Council of Gujarat has brought
                                together Khoja Shia Ithna-Asheri Jamaats across the state with
                                one shared belief: when communities stand together, meaningful
                                progress becomes possible.
                            </p>
                            <p>
                                From education and housing to healthcare, welfare and disaster
                                relief, our work is rooted in dignity, compassion and collective
                                responsibility.
                            </p>
                            <Link className="text-link" href="/about">
                                More about our journey <span>↗</span>
                            </Link>
                        </div>
                    </div>
                </section>
                <section className="section work-section">
                    <div className="container">
                        <div className="section-heading">
                            <div>
                                <div className="eyebrow">THE WORK WE DO</div>
                                <h2>
                                    Serving people.
                                    <br />
                                    <em>Changing lives.</em>
                                </h2>
                            </div>
                            <div>
                                <p>
                                    Every initiative starts with a simple purpose: making a
                                    meaningful difference where it's needed most.
                                </p>
                                <Link href="/programmes" className="text-link">
                                    View all programmes <span>↗</span>
                                </Link>
                            </div>
                        </div>
                        <div className="programmes-grid">
                            {programmeCards.map((c) => (
                                <Link href={c.href} key={c.n} className="programme-card">
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
                                        <span className="card-number">{c.n} / OUR IMPACT</span>
                                        <h3>{c.name}</h3>
                                        <p>{c.desc}</p>
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
                            <blockquote>
                                An institution becomes meaningful when its work continues beyond
                                the people who built it.
                            </blockquote>
                            <p>
                                — Late Alhaj Gulamabbas “Gulubhai” Noormahmad Bhurani
                                <br />
                                <span>Lifetime Chairman, The Council of Gujarat</span>
                            </p>
                            <Link href="/legacy" className="text-link text-link-light">
                                Read our legacy <span>↗</span>
                            </Link>
                        </div>
                    </div>
                </section>
                <section className="section impact-section">
                    <div className="container impact-grid">
                        <div>
                            <div className="eyebrow">OUR IMPACT</div>
                            <h2>
                                Progress that
                                <br />
                                <em>touches lives.</em>
                            </h2>
                            <p>
                                Beyond the numbers are families empowered, opportunities created
                                and communities brought closer together.
                            </p>
                            <Link href="/legacy" className="button button-dark">
                                Discover our impact <span>↗</span>
                            </Link>
                        </div>
                        <div className="impact-numbers">
                            <div>
                                <strong>681</strong>
                                <span>Families helped with housing</span>
                            </div>
                            <div>
                                <strong>700</strong>
                                <span>Elderly women supported</span>
                            </div>
                            <div>
                                <strong>43</strong>
                                <span>Group marriage programmes</span>
                            </div>
                            <div>
                                <strong>830</strong>
                                <span>Marriages conducted</span>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="cta-section">
                    <div className="container cta-inner">
                        <div>
                            <div className="eyebrow light">BE PART OF THE CHANGE</div>
                            <h2>
                                Together, we can build
                                <br />
                                <em>a brighter tomorrow.</em>
                            </h2>
                            <p>
                                Your support helps transform collective care into lasting
                                impact.
                            </p>
                        </div>
                        <div className="cta-buttons">
                            <Link href="/donate" className="button button-gold">
                                Support our mission <span>↗</span>
                            </Link>
                            <Link href="/assistance" className="button button-outline-white">
                                Explore assistance <span>↗</span>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </Shell>
    );
}
