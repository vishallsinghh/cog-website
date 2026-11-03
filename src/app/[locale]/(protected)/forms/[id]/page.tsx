import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { ArrowLeftIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { FormEditor } from "@/components/forms-admin/form-editor";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { requireNavAccess } from "@/lib/auth.utils";
import { caller } from "@/trpc/server";

async function loadForm(id: string) {
    try {
        return await caller.formsAdmin.get({ id });
    } catch (error) {
        if (error instanceof TRPCError && (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST")) notFound();
        throw error;
    }
}

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Nav.items.forms");
    return { title: t("title") };
}

export default async function Page({ params }: PageProps<"/[locale]/forms/[id]">) {
    await requireNavAccess("/forms");
    const { id } = await params;
    const data = await loadForm(id);
    const locale = await getLocale();
    const t = await getTranslations("FormsAdmin");

    const title = locale === "gu" && data.titleGu ? data.titleGu : data.titleEn;

    return (
        <div className="flex flex-col gap-6">
            <Link
                href="/forms"
                className="inline-flex w-fit items-center gap-1.5 text-[15px] font-medium text-green hover:underline"
            >
                <ArrowLeftIcon className="size-4" aria-hidden="true" />
                {t("editor.back")}
            </Link>

            <PageHeader title={title}>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[15px] text-[#4A5451]">
                    <span className="font-mono font-semibold text-green">{data.code}</span>
                    <Badge variant="outline">
                        {data.publishedVersion ? `v${data.publishedVersion}` : t("notPublished")}
                    </Badge>
                    {data.draft && <Badge variant="outline">{t("draftBadge")}</Badge>}
                </div>
            </PageHeader>

            <FormEditor
                key={`${data.publishedVersion ?? 0}-${data.draft?.updatedAt.toISOString() ?? "none"}`}
                data={data}
            />
        </div>
    );
}
