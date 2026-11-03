import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { ArrowLeftIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { AnswersView } from "@/components/applications/answers-view";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { ApplicationTimeline } from "@/components/applications/application-timeline";
import { PageHeader } from "@/components/dashboard/page-header";
import { ReviewActions } from "@/components/review/review-actions";
import { ReviewNotes } from "@/components/review/review-notes";
import { Link } from "@/i18n/navigation";
import { requireNavAccess } from "@/lib/auth.utils";
import { formatDateTime, formatPhone } from "@/lib/format";
import { caller } from "@/trpc/server";

async function loadApplication(id: string) {
    try {
        return await caller.applicationReview.get({ id });
    } catch (error) {
        if (error instanceof TRPCError && ["NOT_FOUND", "BAD_REQUEST", "FORBIDDEN"].includes(error.code)) notFound();
        throw error;
    }
}

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Nav.items.applications");
    return { title: t("title") };
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 py-1.5">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="m-0 min-w-0 font-medium break-words">{value}</dd>
        </div>
    );
}

export default async function Page({ params }: PageProps<"/[locale]/applications/[id]">) {
    await requireNavAccess("/applications");
    const { id } = await params;
    const application = await loadApplication(id);
    const locale = await getLocale();
    const t = await getTranslations("Review");
    const tc = await getTranslations("Common");

    const title = locale === "gu" && application.form.titleGu ? application.form.titleGu : application.form.titleEn;
    const events = application.events.map((event) => ({
        ...event,
        actor: event.byApplicant
            ? t("timeline.byApplicant")
            : event.actorName
              ? t("timeline.by", { name: event.actorName })
              : null,
    }));

    return (
        <div className="flex flex-col gap-6">
            <Link
                href={{ pathname: "/applications", query: { form: application.form.code } }}
                className="inline-flex w-fit items-center gap-1.5 text-[15px] font-medium text-green hover:underline"
            >
                <ArrowLeftIcon className="size-4" aria-hidden="true" />
                {t("back")}
            </Link>

            <PageHeader title={title}>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[15px] text-[#4A5451]">
                    <ApplicationStatusBadge status={application.status} />
                    <span className="font-mono font-semibold text-green">{application.number}</span>
                </div>
            </PageHeader>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="order-2 flex min-w-0 flex-col gap-6 lg:order-1">
                    <AnswersView
                        definition={application.definition}
                        answers={application.answers}
                        documents={application.documents}
                    />
                </div>

                <aside className="order-1 flex flex-col gap-6 lg:order-2">
                    <section className="rounded-[18px] border border-green/10 bg-field p-5">
                        <h2 className="display m-0 text-[22px] text-green">{t("applicantTitle")}</h2>
                        <dl className="mt-3 flex flex-col text-[15px]">
                            <Detail label={t("applicant")} value={application.applicant.name} />
                            <Detail label={t("memberId")} value={application.applicant.memberId ?? tc("dash")} />
                            <Detail label={t("mobile")} value={formatPhone(application.applicant.phone)} />
                            <Detail
                                label={t("submitted")}
                                value={application.submittedAt ? formatDateTime(application.submittedAt, locale) : tc("dash")}
                            />
                            {application.decidedAt && (
                                <Detail label={t("decided")} value={formatDateTime(application.decidedAt, locale)} />
                            )}
                        </dl>
                    </section>

                    <ReviewActions
                        applicationId={application.id}
                        status={application.status}
                        transitions={application.transitions}
                    />

                    <ReviewNotes applicationId={application.id} notes={application.notes} canNote={application.canNote} />

                    <ApplicationTimeline title={t("timeline.title")} events={events} />
                </aside>
            </div>
        </div>
    );
}
