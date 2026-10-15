import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { AuthShowcase } from "@/components/member/auth-showcase";
import { MemberAuth } from "@/components/member/member-auth";
import { CONTACT } from "@/content/site";
import { Link } from "@/i18n/navigation";

export default async function Page() {
    const t = await getTranslations("Auth");

    return (
        <main className="flex min-h-screen flex-wrap bg-cream">
            <AuthShowcase />
            <section className="flex min-w-0 flex-[1_1_520px] items-center justify-center px-[clamp(20px,4vw,64px)] py-14">
                <div className="intro w-full max-w-[460px]">
                    <Link href="/" aria-label={t("backToWebsite")} className="inline-flex">
                        <Image src="/brand/cog-logo.png" alt={t("logoAlt")} width={160} height={64} priority />
                    </Link>
                    <MemberAuth />
                    <p className="mt-8 text-center text-[14px] text-muted-ink">
                        {t("help")}{" "}
                        <a href={CONTACT.phoneHref} className="font-medium text-green hover:text-gold-ink">
                            {CONTACT.phone}
                        </a>
                    </p>
                </div>
            </section>
        </main>
    );
}
