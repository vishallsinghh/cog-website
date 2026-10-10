import { PageBanner } from "@/components/site-shell";
export default function Page() {
    return (
        <main>
            <PageBanner
                eyebrow="CONTACT THE COUNCIL"
                title="Let’s stay connected."
                description="Get in touch with The Council of Gujarat for general enquiries and community information."
            />
            <section className="section interior">
                <div className="container">
                    <div className="content-grid">
                        <div className="content-card">
                            <span className="card-number">CALL US</span>
                            <h3>Phone</h3>
                            <p>
                                <a className="contact-link" href="tel:+919662786186">
                                    +91 96627 86186
                                </a>
                            </p>
                        </div>
                        <div className="content-card">
                            <span className="card-number">WRITE TO US</span>
                            <h3>Email</h3>
                            <p>
                                <a
                                    className="contact-link"
                                    href="mailto:admin@councilofgujarat.org"
                                >
                                    admin@councilofgujarat.org
                                </a>
                            </p>
                        </div>
                        <div className="content-card">
                            <span className="card-number">OUR WEBSITE</span>
                            <h3>Online</h3>
                            <p>
                                <a
                                    className="contact-link"
                                    href="https://www.councilofgujarat.org"
                                >
                                    www.councilofgujarat.org
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
