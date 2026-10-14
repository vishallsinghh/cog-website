import { AuditTable } from "@/components/audit/audit-table";
import { NavPageHeader } from "@/components/dashboard/nav-page-header";
import { requireNavAccess } from "@/lib/auth.utils";

export default async function Page() {
    const item = await requireNavAccess("/audit-log");

    return (
        <div className="flex flex-col gap-8">
            <NavPageHeader item={item} eyebrow="administration" />
            <AuditTable />
        </div>
    );
}
