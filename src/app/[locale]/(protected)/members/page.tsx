import { NavPageHeader } from "@/components/dashboard/nav-page-header";
import { MembersTable } from "@/components/members/members-table";
import { requireNavAccess } from "@/lib/auth.utils";

export default async function Page() {
    const item = await requireNavAccess("/members");

    return (
        <div className="flex flex-col gap-8">
            <NavPageHeader item={item} eyebrow="community" />
            <MembersTable />
        </div>
    );
}
