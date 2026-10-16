import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { isMemberStatus, type MemberStatus } from "@/lib/permissions";

const STATUS_VARIANT: Record<MemberStatus, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "secondary",
    under_review: "secondary",
    documents_required: "outline",
    approved: "default",
    rejected: "destructive",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
    const ts = useTranslations("Statuses");

    if (!isMemberStatus(status)) {
        return (
            <Badge variant="outline" className={className}>
                {status}
            </Badge>
        );
    }

    return (
        <Badge variant={STATUS_VARIANT[status]} className={className}>
            {ts(status)}
        </Badge>
    );
}
