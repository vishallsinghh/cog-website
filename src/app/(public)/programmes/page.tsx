import Link from "next/link";
import { Shell, PageBanner } from "@/components/site-shell";
const programmes = [
    {
        id: "education",
        name: "Education & scholarships",
        description:
            "School fee assistance and interest-free support for higher and professional education.",
    },
    {
        id: "housing",
        name: "Housing & community development",
        description:
            "Helping families move towards stable housing and stronger neighbourhoods.",
    },
    {
        id: "healthcare",
        name: "Healthcare & medical support",
        description:
            "Medical assistance and access to treatment during difficult times.",
    },
    {
        id: "welfare",
        name: "Women & family welfare",
        description: "Support for vulnerable households and elderly women.",
    },
    {
        id: "social",
        name: "Group marriages & social development",
        description:
            "Strengthening families through collective programmes and social reform.",
    },
    {
        id: "relief",
        name: "Emergency & disaster relief",
        description: "Community response, assistance and recovery during hardship.",
    },
];
export default function Page() {
    return (
        <Shell>
            <main>
                <PageBanner
                    eyebrow="OUR AREAS OF IMPACT"
                    title="Support that makes a difference."
                    description="Discover the education, housing, healthcare, welfare and social development programmes at the heart of our mission."
                />
                <section className="section interior">
                    <div className="container">
                        <p className="interior-lead">
                            Our work responds to the evolving needs of communities across
                            Gujarat. Each programme represents a commitment to collective
                            care.
                        </p>
                        <div className="content-grid">
                            {programmes.map((p, i) => (
                                <article id={p.id} className="content-card" key={p.id}>
                                    <span className="card-number">0{i + 1} / PROGRAMME</span>
                                    <h3>{p.name}</h3>
                                    <p>{p.description}</p>
                                    <Link href="/assistance" className="text-link">
                                        Explore assistance ↗
                                    </Link>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </Shell>
    );
}
