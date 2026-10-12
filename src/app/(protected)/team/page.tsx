import { PageHeader } from "@/components/dashboard/page-header";
import { TeamManager } from "@/components/team/team-manager";
import { getSession, requireNavAccess } from "@/lib/auth.utils";

export default async function Page() {
    const item = await requireNavAccess("/team");
    const session = await getSession();

    return (
        <div className="flex flex-col gap-8">
            <PageHeader eyebrow="ADMINISTRATION" title={item.title} description={item.description} />
            <TeamManager currentUserId={session?.user.id ?? ""} />
        </div>
    );
}
