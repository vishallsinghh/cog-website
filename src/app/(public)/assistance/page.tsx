import { Shell, PageBanner } from "@/components/site-shell";
const assistance = [
    "Primary Education",
    "Higher Education",
    "Medical Assistance",
    "Housing Assistance",
    "Widow Sahay",
    "Ramzan Sahay",
    "Sports Upliftment",
];
export default function Page() {
    return (
        <Shell>
            <main>
                <PageBanner
                    eyebrow="ASSISTANCE PROGRAMMES"
                    title="We are here to help."
                    description="Explore the assistance pathways offered by the Council, with applications reviewed according to COG guidelines."
                />
                <section className="section interior">
                    <div className="container">
                        <p className="interior-lead">
                            The platform proposal includes online applications, private
                            supporting documents, Jamaat verification and COG review. The
                            application system will be connected after the backend workflow
                            has been completed.
                        </p>
                        <div className="content-grid">
                            {assistance.map((name, i) => (
                                <div className="content-card" key={name}>
                                    <span className="card-number">
                                        PROGRAMME {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <h3>{name}</h3>
                                    <p>
                                        Eligibility, supporting documents and application windows
                                        will follow COG-approved guidance.
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="notice" style={{ marginTop: 28 }}>
                            Online submissions are not active yet. Please do not send identity
                            or financial documents through this preview.
                        </div>
                    </div>
                </section>
            </main>
        </Shell>
    );
}
