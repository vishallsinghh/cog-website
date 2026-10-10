import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { NavItem } from "@/lib/navigation";
import { NavIcon } from "./nav-icon";
import { PageHeader } from "./page-header";

export function PagePlaceholder({ item }: { item: NavItem }) {
    return (
        <div className="flex flex-col gap-8">
            <PageHeader eyebrow="WORKSPACE" title={item.title} description={item.description} />
            <Empty className="rounded-xl border border-dashed bg-card py-16">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <NavIcon name={item.icon} />
                    </EmptyMedia>
                    <EmptyTitle className="font-heading text-2xl font-normal">
                        {item.title} is on its way
                    </EmptyTitle>
                    <EmptyDescription>
                        This section is built later in the roadmap. You can see it because your role
                        has access to it.
                    </EmptyDescription>
                </EmptyHeader>
                <Badge variant="secondary">Coming soon</Badge>
            </Empty>
        </div>
    );
}
