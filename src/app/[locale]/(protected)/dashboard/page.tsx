import type { Metadata } from "next";
import { ArrowUpRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { NavIcon } from "@/components/dashboard/nav-icon";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { primaryRole } from "@/lib/access";
import { requireAuth } from "@/lib/auth.utils";
import { formatPhone } from "@/lib/format";
import { navForRole } from "@/lib/navigation";
import { MEMBER_STATUSES } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Nav.items");
    return { title: t("dashboard.title") };
}

export default async function DashboardPage() {
    const { user } = await requireAuth();
    const t = await getTranslations("Dashboard");
    const tn = await getTranslations("Nav.items");
    const tr = await getTranslations("Roles");
    const ts = await getTranslations("Statuses");

    const firstName = user.name.split(/\s+/)[0];
    const roleLabel = tr(primaryRole(user.role));
    const status = MEMBER_STATUSES.find((value) => value === user.status);
    const links = navForRole(user.role)
        .flatMap((group) => group.items)
        .filter((item) => item.href !== "/dashboard");

    return (
        <div className="flex flex-col gap-10">
            <PageHeader eyebrow={t("eyebrow")} title={t("welcome", { name: firstName })} description={t("description")}>
                <div className="flex flex-wrap gap-2">
                    <Badge>{roleLabel}</Badge>
                    <Badge variant="outline">{status ? ts(status) : user.status}</Badge>
                    <Badge variant="secondary">
                        {user.memberId ? t("memberId", { id: user.memberId }) : t("memberIdPending")}
                    </Badge>
                </div>
            </PageHeader>

            <div className="grid gap-4 sm:grid-cols-3">
                <Card size="sm">
                    <CardHeader>
                        <CardDescription>{t("name")}</CardDescription>
                        <CardTitle className="text-base">{user.name}</CardTitle>
                    </CardHeader>
                </Card>
                <Card size="sm">
                    <CardHeader>
                        <CardDescription>{t("mobile")}</CardDescription>
                        <CardTitle className="text-base">{formatPhone(user.phoneNumber ?? "")}</CardTitle>
                    </CardHeader>
                </Card>
                <Card size="sm">
                    <CardHeader>
                        <CardDescription>{t("access")}</CardDescription>
                        <CardTitle className="text-base">{roleLabel}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {links.length > 0 && (
                <section className="flex flex-col gap-4">
                    <p className="font-heading text-2xl tracking-tight">{t("workspace")}</p>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {links.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="group rounded-xl outline-none transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                                <Card className="h-full">
                                    <CardHeader>
                                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5">
                                            <NavIcon name={item.key} />
                                        </div>
                                        <CardTitle className="flex items-center justify-between pt-2 text-base">
                                            {tn(`${item.key}.title`)}
                                            <ArrowUpRightIcon className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </CardTitle>
                                        <CardDescription>{tn(`${item.key}.description`)}</CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
