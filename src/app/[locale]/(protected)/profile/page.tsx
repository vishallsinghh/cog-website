import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { ConnectedAccounts } from "@/components/profile/connected-accounts";
import { ProfileForm } from "@/components/profile/profile-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { requireNavAccess } from "@/lib/auth.utils";
import { formatPhone } from "@/lib/format";
import { caller } from "@/trpc/server";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Profile");
    return { title: t("metaTitle") };
}

function initials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

export default async function ProfilePage() {
    await requireNavAccess("/profile");
    const t = await getTranslations("Profile");

    const [profile, accounts] = await Promise.all([
        caller.profile.get(),
        auth.api.listUserAccounts({ headers: await headers() }),
    ]);

    const google = accounts.find((account) => account.providerId === "google");
    const approved = profile.status === "approved";

    return (
        <div className="flex flex-col">
            <PageHeader title={t("title")} description={t("description")} />

            <div className="mt-6 flex flex-wrap items-start gap-6">
                <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
                    <section
                        aria-label={t("membership")}
                        className="rise relative overflow-hidden rounded-[18px] bg-green p-7 text-cream"
                    >
                        <div
                            aria-hidden="true"
                            className="absolute -right-[30px] -bottom-[60px] h-[220px] w-[180px] border border-gold/45"
                            style={{ borderRadius: "90px 90px 0 0" }}
                        />
                        <div className="relative flex items-center gap-4">
                            <span className="display flex size-16 flex-none items-center justify-center rounded-full bg-gold text-[28px] font-semibold text-green-ink">
                                {initials(profile.values.name)}
                            </span>
                            <div className="min-w-0">
                                <div className="display text-[26px] leading-[1.1]">{profile.values.name}</div>
                                {profile.values.jamaat && (
                                    <div className="mt-0.5 text-[14px] text-cream/75">{profile.values.jamaat}</div>
                                )}
                            </div>
                        </div>
                        <dl className="relative mt-6 grid grid-cols-2 gap-x-3 gap-y-[18px]">
                            <div>
                                <dt className="label text-gold-light [--fs:12px] [--ls:.14em]">{t("facts.memberId")}</dt>
                                <dd className="display mt-1 text-[22px]">{profile.memberId ?? t("memberIdPending")}</dd>
                            </div>
                            <div>
                                <dt className="label text-gold-light [--fs:12px] [--ls:.14em]">{t("facts.status")}</dt>
                                <dd className="mt-1.5">
                                    <Badge variant={approved ? "default" : "secondary"}>
                                        {approved ? t("approved") : t("pendingApproval")}
                                    </Badge>
                                </dd>
                            </div>
                            <div>
                                <dt className="label text-gold-light [--fs:12px] [--ls:.14em]">{t("facts.mobile")}</dt>
                                <dd className="mt-1 text-[16px]">
                                    {profile.phoneNumber ? formatPhone(profile.phoneNumber) : t("notProvided")}
                                </dd>
                            </div>
                            <div>
                                <dt className="label text-gold-light [--fs:12px] [--ls:.14em]">{t("facts.aadhaar")}</dt>
                                <dd className="mt-1 flex flex-wrap items-center gap-1.5 text-[16px]">
                                    {profile.aadhaarLast4 ? t("aadhaarMasked", { last4: profile.aadhaarLast4 }) : t("notProvided")}
                                    {profile.aadhaarVerified && (
                                        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#9FD3B8]">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4" />
                                            </svg>
                                            {t("verified")}
                                        </span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className="rise r2 rounded-[18px] border border-green/10 bg-field p-6">
                        <h2 className="display m-0 text-[22px] text-green">{t("connectedTitle")}</h2>
                        <p className="mt-2 mb-4 text-[15px] leading-[1.6] text-[#4A5451]">{t("connectedText")}</p>
                        <ConnectedAccounts
                            google={google ? { id: google.id, linkedAt: google.createdAt.toISOString() } : null}
                        />
                    </section>
                </div>

                <div className="rise r2 min-w-0 flex-[2_1_520px] rounded-[18px] border border-green/10 bg-field p-[clamp(22px,2.6vw,36px)]">
                    <ProfileForm defaultValues={profile.values} />
                </div>
            </div>
        </div>
    );
}
