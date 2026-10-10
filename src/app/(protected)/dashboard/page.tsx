import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { NavIcon } from "@/components/dashboard/nav-icon";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { primaryRoleLabel } from "@/lib/access";
import { requireAuth } from "@/lib/auth.utils";
import { navForRole } from "@/lib/navigation";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
    const { user } = await requireAuth();
    const firstName = user.name.split(/\s+/)[0];
    const links = navForRole(user.role)
        .flatMap((group) => group.items)
        .filter((item) => item.href !== "/dashboard");

    return (
        <div className="flex flex-col gap-10">
            <PageHeader
                eyebrow="DASHBOARD"
                title={`Welcome back, ${firstName}`}
                description="Everything you can do at COG, in one place."
            >
                <div className="flex flex-wrap gap-2">
                    <Badge>{primaryRoleLabel(user.role)}</Badge>
                    <Badge variant="outline">{user.status === "approved" ? "Approved" : user.status}</Badge>
                    <Badge variant="secondary">
                        {user.memberId ? `Member ID ${user.memberId}` : "Member ID pending"}
                    </Badge>
                </div>
            </PageHeader>

            <div className="grid gap-4 sm:grid-cols-3">
                <Card size="sm">
                    <CardHeader>
                        <CardDescription>Name</CardDescription>
                        <CardTitle className="text-base">{user.name}</CardTitle>
                    </CardHeader>
                </Card>
                <Card size="sm">
                    <CardHeader>
                        <CardDescription>Mobile number</CardDescription>
                        <CardTitle className="text-base">{user.phoneNumber}</CardTitle>
                    </CardHeader>
                </Card>
                <Card size="sm">
                    <CardHeader>
                        <CardDescription>Access level</CardDescription>
                        <CardTitle className="text-base">{primaryRoleLabel(user.role)}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {links.length > 0 && (
                <section className="flex flex-col gap-4">
                    <p className="font-heading text-2xl tracking-tight">Your workspace</p>
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
                                            <NavIcon name={item.icon} />
                                        </div>
                                        <CardTitle className="flex items-center justify-between pt-2 text-base">
                                            {item.title}
                                            <ArrowUpRightIcon className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </CardTitle>
                                        <CardDescription>{item.description}</CardDescription>
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
