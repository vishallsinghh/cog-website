import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { NavItem } from "@/lib/navigation";
import { NavIcon } from "./nav-icon";
import { PageHeader } from "./page-header";

export async function PagePlaceholder({ item }: { item: NavItem }) {
    const t = await getTranslations("Placeholder");
    const tn = await getTranslations("Nav.items");
    const td = await getTranslations("Dashboard");
    const title = tn(`${item.key}.title`);

    return (
        <div className="flex flex-col gap-8">
            <PageHeader eyebrow={td("eyebrows.workspace")} title={title} description={tn(`${item.key}.description`)} />
            <Empty className="rounded-xl border border-dashed bg-card py-16">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <NavIcon name={item.key} />
                    </EmptyMedia>
                    <EmptyTitle className="font-heading text-2xl font-normal">
                        {t("title", { section: title })}
                    </EmptyTitle>
                    <EmptyDescription>{t("text")}</EmptyDescription>
                </EmptyHeader>
                <Badge variant="secondary">{t("badge")}</Badge>
            </Empty>
        </div>
    );
}
