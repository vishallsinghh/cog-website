import { PageHeader } from "@/components/dashboard/page-header";
import { MembersTable } from "@/components/members/members-table";
import { requireNavAccess } from "@/lib/auth.utils";

export default async function Page() {
    const item = await requireNavAccess("/members");

    return (
        <div className="flex flex-col gap-8">
            <PageHeader eyebrow="COMMUNITY" title={item.title} description="Search and filter everyone who has signed up." />
            <MembersTable />
        </div>
    );
}
