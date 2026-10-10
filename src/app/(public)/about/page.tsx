import { PageBanner } from "@/components/site-shell";
export default function Page() {
  return (
    <main>
      <PageBanner
        eyebrow="ABOUT THE COUNCIL"
        title="A legacy of collective service."
        description="Founded in June 1987, The Council of Gujarat unites Khoja Shia Ithna-Asheri Jamaats in a shared mission of welfare, dignity and progress."
      />
      <section className="section interior">
        <div className="container">
          <p className="interior-lead">
            Our work spans education, higher education, housing, healthcare,
            social welfare, group marriages and relief. Through a network of
            44 Jamaats, we connect community leaders, supporters and
            volunteers to meet shared needs.
          </p>
          <div className="content-grid">
            <div className="content-card">
              <span className="card-number">OUR FOUNDATION</span>
              <h3>Unity</h3>
              <p>
                Bringing Jamaats and families together around shared
                responsibility.
              </p>
            </div>
            <div className="content-card">
              <span className="card-number">OUR COMMITMENT</span>
              <h3>Service</h3>
              <p>
                Responding with compassion, practical assistance and dignity.
              </p>
            </div>
            <div className="content-card">
              <span className="card-number">OUR FUTURE</span>
              <h3>Progress</h3>
              <p>Creating opportunities that last for generations to come.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
