import { Shell, PageBanner } from "@/components/site-shell";
export default function Page() {
    return (
        <Shell>
            <main>
                <PageBanner
                    eyebrow="FOUR DECADES OF SERVICE"
                    title="Our legacy. Our future."
                    description="1987–2027: four decades of leadership, community development and lasting service."
                />
                <section className="section interior">
                    <div className="container">
                        <p className="interior-lead">
                            Established in June 1987, COG has grown into a Gujarat-wide
                            institution guided by generations of community leaders. Our
                            mission has remained constant even as the needs of the community
                            have changed.
                        </p>
                        <div className="content-grid">
                            <div className="content-card">
                                <span className="card-number">1987</span>
                                <h3>A shared beginning</h3>
                                <p>
                                    The Council of Gujarat was founded to strengthen cooperation
                                    across KSI Jamaats.
                                </p>
                            </div>
                            <div className="content-card">
                                <span className="card-number">2001</span>
                                <h3>Relief & recovery</h3>
                                <p>
                                    Community support during the Gujarat earthquake and subsequent
                                    rehabilitation efforts.
                                </p>
                            </div>
                            <div className="content-card">
                                <span className="card-number">2027</span>
                                <h3>Looking forward</h3>
                                <p>
                                    Forty years of service, and a renewed commitment to future
                                    generations.
                                </p>
                            </div>
                        </div>
                        <div className="panel" style={{ marginTop: 32 }}>
                            <h2>Remembering Gulubhai Bhurani</h2>
                            <p className="interior-lead">
                                Late Alhaj Gulamabbas Noormahmad Bhurani, Lifetime Chairman, was
                                a principal figure in COG’s institutional development, housing
                                efforts and community leadership.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </Shell>
    );
}
