import { getTranslations } from "next-intl/server";
import { Shell } from "@/components/site-shell";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
    const t = await getTranslations("NotFound");

    return (
        <Shell>
            <main className="section interior">
                <div className="container">
                    <div className="panel">
                        <h2>{t("title")}</h2>
                        <p className="interior-lead">{t("text")}</p>
                        <Link href="/" className="button button-dark">
                            {t("home")} <span>↗</span>
                        </Link>
                    </div>
                </div>
            </main>
        </Shell>
    );
}
