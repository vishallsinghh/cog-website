import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NavIcon } from "@/components/dashboard/nav-icon";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatStrip } from "@/components/dashboard/stat-strip";
import { StatusBanner } from "@/components/dashboard/status-banner";
import { StatusBadge } from "@/components/members/status-badge";
import { CONTACT } from "@/content/site";
import { Link } from "@/i18n/navigation";
import { primaryRole } from "@/lib/access";
import { requireAuth } from "@/lib/auth.utils";
import { formatPhone } from "@/lib/format";
import { navForUser } from "@/lib/navigation";
import { isApproved, isMemberStatus } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Nav.items");
    return { title: t("dashboard.title") };
}

const TILE =
    "tile relative block rounded-2xl border border-green/10 bg-field p-[22px] outline-none transition-[transform,box-shadow] duration-300 hover:-translate-y-[3px] hover:shadow-[0_18px_36px_rgba(6,63,53,0.1)] focus-visible:ring-3 focus-visible:ring-ring/50";
const ICON_BOX = "flex size-11 items-center justify-center rounded-xl bg-cream-deep text-green [&_svg]:size-[22px] [&_svg]:stroke-[1.6]";

export default async function DashboardPage() {
    const { user } = await requireAuth();
    const t = await getTranslations("Dashboard");
    const tn = await getTranslations("Nav.items");
    const tr = await getTranslations("Roles");

    const firstName = user.name.split(/\s+/)[0];
    const approved = isApproved(user.status);
    const groups = navForUser(user.role, approved);
    const staff = groups.some((group) => group.items.some((item) => item.permission));
    const links = groups.flatMap((group) => group.items).filter((item) => item.href !== "/dashboard");

    const stats = [
        { label: t("memberId"), value: user.memberId ?? t("memberIdPending") },
        { label: t("mobile"), value: formatPhone(user.phoneNumber ?? "") },
        {
            label: t("status"),
            node: <StatusBadge status={user.status} className="h-auto px-3 py-1 text-[14px] font-semibold" />,
        },
        { label: t("access"), value: tr(primaryRole(user.role)) },
    ];

    return (
        <div className="flex flex-col">
            <PageHeader
                title={
                    <>
                        {t("welcome")} <em className="font-normal text-gold-ink">{firstName}.</em>
                    </>
                }
                description={staff ? t("description") : undefined}
            />

            {!staff && isMemberStatus(user.status) && <StatusBanner status={user.status} />}

            <StatStrip items={stats} />

            {staff ? (
                <>
                    <h2 className="display mt-10 text-[28px] text-green">{t("goTo")}</h2>
                    <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
                        {links.map((item) => (
                            <Link key={item.href} href={item.href} className={TILE}>
                                <span className="flex items-start justify-between">
                                    <span className={ICON_BOX}>
                                        <NavIcon name={item.key} />
                                    </span>
                                    {item.soon && (
                                        <span className="rounded-full bg-cream-deep px-2.5 py-[3px] text-[12px] font-semibold text-muted-ink">
                                            {t("comingSoon")}
                                        </span>
                                    )}
                                </span>
                                <span className="display mt-4 block text-[24px] text-green">{tn(`${item.key}.title`)}</span>
                                <span className="mt-1 block text-[14px] leading-[1.5] text-muted-ink">{tn(`${item.key}.description`)}</span>
                            </Link>
                        ))}
                    </div>
                </>
            ) : (
                <div className="mt-[22px] grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
                    {approved && (
                        <>
                            <Link href="/profile" className={`${TILE} p-6`}>
                                <span className={ICON_BOX}>
                                    <NavIcon name="profile" />
                                </span>
                                <span className="display mt-4 block text-[24px] text-green">{t("memberCards.profile.title")}</span>
                                <span className="mt-1 block text-[14px] leading-[1.5] text-muted-ink">{t("memberCards.profile.text")}</span>
                            </Link>
                            <div className="rounded-2xl border border-green/10 bg-field p-6">
                                <span className={ICON_BOX}>
                                    <NavIcon name="applications" />
                                </span>
                                <span className="display mt-4 block text-[24px] text-green">{t("memberCards.assistance.title")}</span>
                                <span className="mt-1 block text-[14px] leading-[1.5] text-muted-ink">{t("memberCards.assistance.text")}</span>
                            </div>
                        </>
                    )}
                    <div className="rounded-2xl bg-cream-deep p-6">
                        <span className="display block text-[24px] text-green">{t("help.title")}</span>
                        <span className="mt-1.5 block text-[14px] leading-[1.6] text-[#4A5451]">{t("help.text")}</span>
                        <a href={CONTACT.phoneHref} className="mt-3.5 inline-flex text-[16px] font-semibold text-green hover:text-gold-ink">
                            {CONTACT.phone}
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
