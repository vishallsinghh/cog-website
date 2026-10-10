import { Shell, PageBanner } from "@/components/site-shell";
export default function Page() {
    return (
        <Shell>
            <main>
                <PageBanner
                    eyebrow="MEMBER PORTAL"
                    title="Your community, connected."
                    description="One account for your profile, assistance applications, donations and notifications."
                />
                <section className="section interior">
                    <div className="container">
                        <div className="panel">
                            <h2>Member sign in</h2>
                            <p className="interior-lead">
                                Secure mobile OTP sign-in and Google account linking are part of
                                the existing Better Auth foundation. The interface will be
                                connected after authentication configuration and member journeys
                                are verified.
                            </p>
                            <div className="notice">
                                Sign-in is not active in this preview. This page does not
                                collect phone numbers or personal data.
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </Shell>
    );
}
