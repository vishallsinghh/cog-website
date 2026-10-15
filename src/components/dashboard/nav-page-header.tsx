import { getTranslations } from "next-intl/server";
import type { NavItem } from "@/lib/navigation";
import { PageHeader } from "./page-header";

export async function NavPageHeader({ item }: { item: NavItem }) {
    const tn = await getTranslations("Nav.items");

    return <PageHeader title={tn(`${item.key}.title`)} description={tn(`${item.key}.description`)} />;
}
