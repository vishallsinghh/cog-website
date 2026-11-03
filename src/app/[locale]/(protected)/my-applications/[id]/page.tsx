import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { ArrowLeftIcon, FileWarningIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { ApplicationForm } from "@/components/applications/application-form";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { ApplicationTimeline } from "@/components/applications/application-timeline";
import { AnswersView } from "@/components/applications/answers-view";
import { PageHeader } from "@/components/dashboard/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "@/i18n/navigation";
import { requireNavAccess } from "@/lib/auth.utils";
import { caller } from "@/trpc/server";

async function loadApplication(id: string) {
    try {
        return await caller.applications.get({ id });
    } catch (error) {
        if (error instanceof TRPCError && (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST")) notFound();
        throw error;
    }
}

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Nav.items.myApplications");
    return { title: t("title") };
}

export default async function Page({ params }: PageProps<"/[locale]/my-applications/[id]">) {
    await requireNavAccess("/my-applications");
    const { id } = await params;
    const application = await loadApplication(id);
    const locale = await getLocale();
    const t = await getTranslations("MyApplications");

    const title = locale === "gu" && application.form.titleGu ? application.form.titleGu : application.form.titleEn;
    const request = application.events.findLast((event) => event.toStatus === "documents_required");

    return (
        <div className="flex flex-col gap-6">
            <Link
                href="/my-applications"
                className="inline-flex w-fit items-center gap-1.5 text-[15px] font-medium text-green hover:underline"
            >
                <ArrowLeftIcon className="size-4" aria-hidden="true" />
                {t("back")}
            </Link>

            <PageHeader title={title}>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[15px] text-[#4A5451]">
                    <ApplicationStatusBadge status={application.status} />
                    {application.number && (
                        <span>
                            {t("numberLabel")}:{" "}
                            <span className="font-mono font-semibold text-green">{application.number}</span>
                        </span>
                    )}
                </div>
            </PageHeader>

            {application.status === "documents_required" && (
                <Alert>
                    <FileWarningIcon />
                    <AlertTitle>{t("documentsRequiredTitle")}</AlertTitle>
                    <AlertDescription>
                        {request?.message && <p className="whitespace-pre-wrap">{request.message}</p>}
                        <p>{t("documentsRequiredText")}</p>
                    </AlertDescription>
                </Alert>
            )}

            {application.editable ? (
                <ApplicationForm
                    applicationId={application.id}
                    status={application.status}
                    definition={application.definition}
                    initialAnswers={application.answers}
                    initialDocuments={application.documents}
                    uploadsAvailable={application.uploadsAvailable}
                />
            ) : (
                <AnswersView
                    definition={application.definition}
                    answers={application.answers}
                    documents={application.documents}
                />
            )}

            {application.events.length > 0 && <ApplicationTimeline title={t("progress")} events={application.events} />}
        </div>
    );
}
