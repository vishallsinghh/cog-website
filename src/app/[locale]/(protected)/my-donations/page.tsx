import type { Metadata } from "next";
import { HandCoinsIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { NavPageHeader } from "@/components/dashboard/nav-page-header";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia } from "@/components/ui/empty";
import { Link } from "@/i18n/navigation";
import { requireNavAccess } from "@/lib/auth.utils";
import { isDonationProgramme } from "@/lib/donate.schemas";
import { formatDate, formatRupees } from "@/lib/format";
import { caller } from "@/trpc/server";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Nav.items.myDonations");
    return { title: t("title") };
}

export default async function Page() {
    const item = await requireNavAccess("/my-donations");
    const locale = await getLocale();
    const t = await getTranslations("MyDonations");
    const tp = await getTranslations("Donate.programmes");
    const donations = await caller.donations.mine();
    const total = donations.reduce((sum, donation) => sum + donation.amountPaise, 0);

    return (
        <div className="flex flex-col gap-8">
            <NavPageHeader item={item} />

            {donations.length === 0 ? (
                <Empty className="rise r2 rounded-[14px] border border-green/10 bg-field">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <HandCoinsIcon />
                        </EmptyMedia>
                        <EmptyDescription>{t("empty")}</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button asChild>
                            <Link href="/donate">{t("donate")}</Link>
                        </Button>
                    </EmptyContent>
                </Empty>
            ) : (
                <section className="rise r2 flex flex-col gap-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <p className="m-0 text-[15px] text-[#4A5451]">
                            {t("summary", { count: donations.length, total: formatRupees(total, locale) })}
                        </p>
                        <Button asChild variant="outline">
                            <Link href="/donate">{t("donateAgain")}</Link>
                        </Button>
                    </div>
                    <ul className="m-0 flex list-none flex-col gap-3 p-0">
                        {donations.map((donation) => (
                            <li
                                key={donation.id}
                                className="flex flex-wrap items-center gap-4 rounded-[14px] border border-green/10 bg-field p-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="text-[17px] font-semibold text-green">
                                        {isDonationProgramme(donation.programme) ? tp(donation.programme) : donation.programme}
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-x-3 text-[14px] text-[#4A5451]">
                                        <span>
                                            {t("receipt")}{" "}
                                            <span className="font-mono font-semibold text-ink">{donation.receiptNumber ?? t("receiptPending")}</span>
                                        </span>
                                        {donation.paidAt && <span>{formatDate(donation.paidAt, locale)}</span>}
                                        {donation.razorpayPaymentId && (
                                            <span>
                                                {t("payment")} <span className="font-mono">{donation.razorpayPaymentId}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="display text-[24px] text-green">{formatRupees(donation.amountPaise, locale)}</div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
