import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { isDonationStatus, type DonationStatus } from "@/lib/donate.schemas";

const STATUS_VARIANT: Record<DonationStatus, "default" | "secondary" | "destructive"> = {
    created: "secondary",
    paid: "default",
    failed: "destructive",
};

export function DonationStatusBadge({ status }: { status: string }) {
    const t = useTranslations("Donations.statuses");

    if (!isDonationStatus(status)) return <Badge variant="outline">{status}</Badge>;

    return <Badge variant={STATUS_VARIANT[status]}>{t(status)}</Badge>;
}
