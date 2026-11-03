import { NavPageHeader } from "@/components/dashboard/nav-page-header";
import { ReviewBoard } from "@/components/review/review-board";
import { requireNavAccess } from "@/lib/auth.utils";

export default async function Page({ searchParams }: PageProps<"/[locale]/applications">) {
    const item = await requireNavAccess("/applications");
    const { form } = await searchParams;

    return (
        <div className="flex flex-col gap-8">
            <NavPageHeader item={item} />
            <ReviewBoard initialForm={typeof form === "string" ? form : undefined} />
        </div>
    );
}
