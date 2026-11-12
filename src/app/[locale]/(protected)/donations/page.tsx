import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NavPageHeader } from "@/components/dashboard/nav-page-header";
import { DonationsTable } from "@/components/donations/donations-table";
import { requireNavAccess } from "@/lib/auth.utils";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Nav.items.donations");
    return { title: t("title") };
}

export default async function Page() {
    const item = await requireNavAccess("/donations");

    return (
        <div className="flex flex-col gap-8">
            <NavPageHeader item={item} />
            <DonationsTable />
        </div>
    );
}
