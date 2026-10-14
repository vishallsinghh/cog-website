import type { Metadata } from "next";
import { headers } from "next/headers";
import { CheckCircle2Icon, CircleDashedIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ConnectedAccounts } from "@/components/profile/connected-accounts";
import { ProfileForm } from "@/components/profile/profile-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { requireNavAccess } from "@/lib/auth.utils";
import { formatPhone } from "@/lib/format";
import { caller } from "@/trpc/server";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Profile");
    return { title: t("metaTitle") };
}

export default async function ProfilePage() {
    await requireNavAccess("/profile");
    const t = await getTranslations("Profile");

    const [profile, accounts] = await Promise.all([
        caller.profile.get(),
        auth.api.listUserAccounts({ headers: await headers() }),
    ]);

    const google = accounts.find((account) => account.providerId === "google");

    const facts: { key: string; label: string; value: string; verified?: boolean }[] = [
        {
            key: "mobile",
            label: t("facts.mobile"),
            value: profile.phoneNumber ? formatPhone(profile.phoneNumber) : t("notProvided"),
            verified: true,
        },
        { key: "memberId", label: t("facts.memberId"), value: profile.memberId ?? t("memberIdPending") },
        {
            key: "status",
            label: t("facts.status"),
            value: profile.status === "approved" ? t("approved") : t("pendingApproval"),
        },
        {
            key: "aadhaar",
            label: t("facts.aadhaar"),
            value: profile.aadhaarLast4 ? t("aadhaarMasked", { last4: profile.aadhaarLast4 }) : t("notProvided"),
            verified: profile.aadhaarVerified,
        },
    ];

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
            <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

            <dl className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
                {facts.map((fact) => (
                    <div key={fact.key} className="flex flex-col gap-1.5 bg-card p-5">
                        <dt className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            {fact.label}
                        </dt>
                        <dd className="flex items-center gap-2 text-sm font-medium">
                            {fact.value}
                            {fact.verified !== undefined && (
                                <Badge variant={fact.verified ? "default" : "outline"}>
                                    {fact.verified ? (
                                        <CheckCircle2Icon data-icon="inline-start" />
                                    ) : (
                                        <CircleDashedIcon data-icon="inline-start" />
                                    )}
                                    {fact.verified ? t("verified") : t("notVerified")}
                                </Badge>
                            )}
                        </dd>
                    </div>
                ))}
            </dl>

            <ProfileForm defaultValues={profile.values} />

            <Separator />

            <section className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <p className="font-heading text-2xl tracking-tight">{t("connectedTitle")}</p>
                    <p className="text-sm text-muted-foreground">{t("connectedText")}</p>
                </div>
                <ConnectedAccounts
                    google={google ? { id: google.id, linkedAt: google.createdAt.toISOString() } : null}
                />
            </section>
        </div>
    );
}
