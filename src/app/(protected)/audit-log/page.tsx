import { AuditTable } from "@/components/audit/audit-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireNavAccess } from "@/lib/auth.utils";

export default async function Page() {
    const item = await requireNavAccess("/audit-log");

    return (
        <div className="flex flex-col gap-8">
            <PageHeader eyebrow="ADMINISTRATION" title={item.title} description={item.description} />
            <AuditTable />
        </div>
    );
}
