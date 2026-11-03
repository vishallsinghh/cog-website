import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { isApplicationStatus, type ApplicationStatus } from "@/lib/forms/application-status";

const STATUS_VARIANT: Record<ApplicationStatus, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline",
    received: "secondary",
    under_review: "secondary",
    documents_required: "outline",
    approved: "default",
    rejected: "destructive",
};

export function ApplicationStatusBadge({ status, className }: { status: string; className?: string }) {
    const ts = useTranslations("ApplicationStatuses");

    if (!isApplicationStatus(status)) {
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
