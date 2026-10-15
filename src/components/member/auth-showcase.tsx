import { getTranslations } from "next-intl/server";
import { LangSwitch } from "@/components/lang-switch";
import { Arch, ArchPattern } from "@/components/page-parts";
import { Link } from "@/i18n/navigation";

const HIGHLIGHTS = [
    {
        key: "memberId",
        icon: (
            <>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M7 10h6M7 14h4" />
            </>
        ),
    },
    {
        key: "secure",
        icon: (
            <>
                <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
                <path d="m9 12 2 2 4-4" />
            </>
        ),
    },
    {
        key: "language",
        icon: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
            </>
        ),
    },
] as const;

export async function AuthShowcase() {
    const t = await getTranslations("Auth");

    return (
        <aside className="on-dark relative flex min-w-0 flex-[1_1_520px] flex-col justify-between overflow-hidden bg-green px-[clamp(24px,4vw,64px)] py-12 text-cream">
            <ArchPattern opacity={0.25} />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
                <Link href="/" className="inline-flex items-center gap-2.5 text-[15px] text-cream hover:text-gold-light">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M19 12H5M11 6l-6 6 6 6" />
                    </svg>
                    {t("backToWebsite")}
                </Link>
                <LangSwitch />
            </div>
            <div className="relative my-10 flex flex-wrap items-end gap-10">
                <Arch
                    src="/images/relief.jpg"
                    alt={t("showcaseImageAlt")}
                    radius={120}
                    heroZoom
                    priority
                    imageClassName=""
                    className="h-[330px] w-[240px] flex-none border border-gold/60"
                    sizes="240px"
                />
                <div className="min-w-0 flex-[1_1_240px]">
                    <div className="label text-gold-light">{t("showcaseKicker")}</div>
                    <h1 className="display mt-4 text-[clamp(40px,4vw,52px)] leading-[1.02]">
                        {t("showcaseTitle")}
                        <br />
                        <em className="text-gold-light">{t("showcaseTitleEm")}</em>
                    </h1>
                </div>
            </div>
            <ul className="relative m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-6 border-t border-gold/40 p-0 pt-7">
                {HIGHLIGHTS.map((item) => (
                    <li key={item.key} className="flex gap-3">
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#C29A43"
                            strokeWidth="1.6"
                            aria-hidden="true"
                            className="mt-0.5 flex-none"
                        >
                            {item.icon}
                        </svg>
                        <span>
                            <span className="block font-semibold">{t(`highlights.${item.key}.title`)}</span>
                            <span className="text-[14px] text-cream/75">{t(`highlights.${item.key}.text`)}</span>
                        </span>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
