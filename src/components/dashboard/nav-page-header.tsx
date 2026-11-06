import { useTranslations } from "next-intl";
import type { NavItem } from "@/lib/navigation";
import { PageHeader } from "./page-header";

export function NavPageHeader({ item }: { item: NavItem }) {
    const tn = useTranslations("Nav.items");

    return <PageHeader title={tn(`${item.key}.title`)} description={tn(`${item.key}.description`)} />;
}
