import { PagePlaceholder } from "@/components/dashboard/page-placeholder";
import { requireNavAccess } from "@/lib/auth.utils";

export default async function Page() {
    const item = await requireNavAccess("/donations");

    return <PagePlaceholder item={item} />;
}
