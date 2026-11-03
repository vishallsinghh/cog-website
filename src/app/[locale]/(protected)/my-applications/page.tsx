import type { Metadata } from "next";
import { ChevronRightIcon, FileTextIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { StartApplicationButton } from "@/components/applications/start-application-button";
import { NavPageHeader } from "@/components/dashboard/nav-page-header";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "@/components/ui/empty";
import { Link } from "@/i18n/navigation";
import { requireNavAccess } from "@/lib/auth.utils";
import { formatDate } from "@/lib/format";
import { caller } from "@/trpc/server";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Nav.items.myApplications");
    return { title: t("title") };
}

export default async function Page() {
    const item = await requireNavAccess("/my-applications");
    const locale = await getLocale();
    const t = await getTranslations("MyApplications");
    const [forms, applications] = await Promise.all([caller.applications.openForms(), caller.applications.list()]);
    const gu = locale === "gu";

    return (
        <div className="flex flex-col gap-10">
            <NavPageHeader item={item} />

            <section className="rise r2 flex flex-col gap-4">
                <div>
                    <h2 className="display m-0 text-[26px] text-green">{t("applyTitle")}</h2>
                    <p className="mt-1 text-[15px] text-[#4A5451]">{t("applyText")}</p>
                </div>

                {forms.length === 0 ? (
                    <p className="rounded-[14px] border border-green/10 bg-field p-5 text-[15px] text-[#4A5451]">
                        {t("noOpenForms")}
                    </p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {forms.map((form) => (
                            <div
                                key={form.slug}
                                className="flex flex-col gap-4 rounded-[14px] border border-green/10 bg-field p-5 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <h3 className="m-0 text-[20px] font-semibold text-green">
                                        {gu && form.titleGu ? form.titleGu : form.titleEn}
                                    </h3>
                                    <p className="mt-1 text-[15px] text-[#4A5451]">
                                        {gu && form.summaryGu ? form.summaryGu : form.summaryEn}
                                    </p>
                                </div>
                                <StartApplicationButton slug={form.slug} />
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="rise r3 flex flex-col gap-4">
                <h2 className="display m-0 text-[26px] text-green">{t("yourTitle")}</h2>

                {applications.length === 0 ? (
                    <Empty className="rounded-[14px] border border-green/10 bg-field">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <FileTextIcon />
                            </EmptyMedia>
                            <EmptyDescription>{t("empty")}</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {applications.map((application) => (
                            <li key={application.id}>
                                <Link
                                    href={`/my-applications/${application.id}`}
                                    className="flex items-center gap-4 rounded-[14px] border border-green/10 bg-field p-4 transition-colors hover:border-green/30"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[17px] font-semibold text-green">
                                                {gu && application.form.titleGu ? application.form.titleGu : application.form.titleEn}
                                            </span>
                                            <ApplicationStatusBadge status={application.status} />
                                        </div>
                                        <div className="mt-1 flex flex-wrap gap-x-3 text-[14px] text-[#4A5451]">
                                            <span className="font-mono">{application.number ?? t("draft")}</span>
                                            <span>
                                                {application.submittedAt
                                                    ? t("submitted", { date: formatDate(application.submittedAt, locale) })
                                                    : t("started", { date: formatDate(application.createdAt, locale) })}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="hidden text-[15px] font-medium text-green sm:inline">
                                        {application.status === "draft" || application.status === "documents_required"
                                            ? t("continue")
                                            : t("view")}
                                    </span>
                                    <ChevronRightIcon className="size-5 flex-none text-green" aria-hidden="true" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
