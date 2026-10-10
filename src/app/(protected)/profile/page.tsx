import { headers } from "next/headers";
import { CheckCircle2Icon, CircleDashedIcon } from "lucide-react";
import { ConnectedAccounts } from "@/components/profile/connected-accounts";
import { ProfileForm } from "@/components/profile/profile-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { requireNavAccess } from "@/lib/auth.utils";
import { caller } from "@/trpc/server";

export const metadata = { title: "Profile" };

function maskedAadhaar(last4: string | null) {
    return last4 ? `XXXX XXXX ${last4}` : "Not provided";
}

export default async function ProfilePage() {
    await requireNavAccess("/profile");

    const [profile, accounts] = await Promise.all([
        caller.profile.get(),
        auth.api.listUserAccounts({ headers: await headers() }),
    ]);

    const google = accounts.find((account) => account.providerId === "google");

    const facts = [
        { label: "Mobile number", value: profile.phoneNumber ?? "-", badge: "Verified" },
        { label: "Member ID", value: profile.memberId ?? "Issued on approval" },
        { label: "Account status", value: profile.status === "approved" ? "Approved" : "Pending approval" },
        {
            label: "Aadhaar",
            value: maskedAadhaar(profile.aadhaarLast4),
            badge: profile.aadhaarVerified ? "Verified" : "Not verified yet",
        },
    ];

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
            <PageHeader
                eyebrow="PROFILE"
                title="Your details"
                description="Keep your information up to date so COG can reach you and process your requests."
            />

            <dl className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
                {facts.map((fact) => (
                    <div key={fact.label} className="flex flex-col gap-1.5 bg-card p-5">
                        <dt className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            {fact.label}
                        </dt>
                        <dd className="flex items-center gap-2 text-sm font-medium">
                            {fact.value}
                            {fact.badge && (
                                <Badge variant={fact.badge === "Verified" ? "default" : "outline"}>
                                    {fact.badge === "Verified" ? (
                                        <CheckCircle2Icon data-icon="inline-start" />
                                    ) : (
                                        <CircleDashedIcon data-icon="inline-start" />
                                    )}
                                    {fact.badge}
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
                    <p className="font-heading text-2xl tracking-tight">Connected accounts</p>
                    <p className="text-sm text-muted-foreground">
                        Sign in faster by linking accounts you already use.
                    </p>
                </div>
                <ConnectedAccounts
                    google={google ? { id: google.id, linkedAt: google.createdAt.toISOString() } : null}
                />
            </section>
        </div>
    );
}
