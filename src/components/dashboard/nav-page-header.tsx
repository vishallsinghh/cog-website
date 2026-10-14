import { getTranslations } from "next-intl/server";
import type { NavItem } from "@/lib/navigation";
import { PageHeader } from "./page-header";

/** Page header for a dashboard page, titled from its nav item's messages. */
export async function NavPageHeader({
    item,
    eyebrow,
}: {
    item: NavItem;
    eyebrow: "workspace" | "community" | "administration";
}) {
    const tn = await getTranslations("Nav.items");
    const td = await getTranslations("Dashboard");

    return (
        <PageHeader
            eyebrow={td(`eyebrows.${eyebrow}`)}
            title={tn(`${item.key}.title`)}
            description={tn(`${item.key}.description`)}
        />
    );
}
