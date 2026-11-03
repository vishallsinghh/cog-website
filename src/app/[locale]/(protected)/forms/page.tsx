import { NavPageHeader } from "@/components/dashboard/nav-page-header";
import { FormsList } from "@/components/forms-admin/forms-list";
import { requireNavAccess } from "@/lib/auth.utils";

export default async function Page() {
    const item = await requireNavAccess("/forms");

    return (
        <div className="flex flex-col gap-8">
            <NavPageHeader item={item} />
            <FormsList />
        </div>
    );
}
