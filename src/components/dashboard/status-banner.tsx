import { getTranslations } from "next-intl/server";

type BannerStatus = "pending" | "approved" | "rejected";

const ICONS: Record<BannerStatus, string> = {
    pending: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
    approved: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
    rejected: "M12 8v5M12 16.5v.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
};

const STEPS = ["sent", "verified", "review"] as const;

export async function StatusBanner({ status }: { status: BannerStatus }) {
    const t = await getTranslations("Dashboard");
    const dark = status !== "rejected";

    return (
        <section
            aria-live="polite"
            className={`rise r2 relative mt-6 overflow-hidden rounded-[18px] px-8 py-7 ${
                dark ? "bg-green text-cream" : "border border-black/5 bg-[#FBEDE9] text-[#5E2213]"
            }`}
        >
            <div
                aria-hidden="true"
                className="absolute -top-[50px] -right-[30px] h-[240px] w-[200px] border border-gold/40"
                style={{ borderRadius: "100px 100px 0 0" }}
            />
            <div className="relative flex flex-wrap items-start gap-[18px]">
                <span
                    className={`flex size-[52px] flex-none items-center justify-center rounded-full ${
                        dark ? "bg-gold/20 text-gold-light" : "bg-white/70"
                    } ${status === "pending" ? "pulse" : ""}`}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={ICONS[status]} />
                    </svg>
                </span>
                <div className="min-w-0 flex-[1_1_320px]">
                    <h2 className="display m-0 text-[32px] leading-[1.1]">{t(`banner.${status}.title`)}</h2>
                    <p className="mt-2 max-w-[640px] text-[16px] leading-[1.65] opacity-90">{t(`banner.${status}.text`)}</p>
                </div>
            </div>
            {status === "pending" && (
                <ol className="relative m-0 mt-6 grid list-none grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 p-0">
                    {STEPS.map((step) => {
                        const done = step !== "review";

                        return (
                            <li
                                key={step}
                                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 ${
                                    done ? "bg-cream/8" : "border border-dashed border-gold-light/70"
                                }`}
                            >
                                {done ? (
                                    <span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-gold text-green-ink">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                                            <path d="M5 12l5 5 9-10" />
                                        </svg>
                                    </span>
                                ) : (
                                    <span className="pulse box-border size-[26px] flex-none rounded-full border-2 border-gold" />
                                )}
                                <span>
                                    <span className="block font-semibold">{t(`steps.${step}.title`)}</span>
                                    <span className="block text-[13px] opacity-75">{t(`steps.${step}.text`)}</span>
                                </span>
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
}
