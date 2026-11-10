"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DownloadIcon, UsersRoundIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { PagingBar } from "@/components/dashboard/paging-bar";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link, useRouter } from "@/i18n/navigation";
import { REVIEW_STATUSES } from "@/lib/forms/application-status";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { FormAccessSheet } from "./form-access-sheet";

export function ReviewBoard({ initialForm }: { initialForm?: string }) {
    const t = useTranslations("Review");
    const tc = useTranslations("Common");
    const ts = useTranslations("ApplicationStatuses");
    const locale = useLocale();
    const router = useRouter();
    const trpc = useTRPC();

    const forms = useQuery(trpc.applicationReview.forms.queryOptions());

    const [formCode, setFormCode] = useState(initialForm);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [jamaat, setJamaat] = useState("");
    const [city, setCity] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [managingAccess, setManagingAccess] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const available = forms.data?.forms ?? [];
    const form =
        available.find((item) => item.code === formCode) ?? available.find((item) => item.total > 0) ?? available[0];
    const formId = form?.id ?? "";
    const statusFilter = REVIEW_STATUSES.find((value) => value === status);
    const submitted = from || to ? { from: from || undefined, to: to || undefined } : undefined;

    const filters = useQuery({
        ...trpc.applicationReview.filters.queryOptions({ formId }),
        enabled: Boolean(formId),
    });

    const list = useQuery({
        ...trpc.applicationReview.list.queryOptions({
            formId,
            page,
            pageSize,
            search: search || undefined,
            status: statusFilter,
            jamaat: jamaat || undefined,
            city: city || undefined,
            submitted,
        }),
        enabled: Boolean(formId),
        placeholderData: keepPreviousData,
    });

    function chooseForm(code: string) {
        setFormCode(code);
        setStatus("");
        setJamaat("");
        setCity("");
        setPage(1);
        router.replace({ pathname: "/applications", query: { form: code } }, { scroll: false });
    }

    const resetPage = () => setPage(1);

    const exportParams = new URLSearchParams({ formId, locale });
    if (search) exportParams.set("search", search);
    if (statusFilter) exportParams.set("status", statusFilter);
    if (jamaat) exportParams.set("jamaat", jamaat);
    if (city) exportParams.set("city", city);
    if (from) exportParams.set("from", from);
    if (to) exportParams.set("to", to);

    if (forms.isError) {
        return (
            <Empty className="rounded-xl border border-dashed bg-card py-12">
                <EmptyHeader>
                    <EmptyTitle>{t("loadError")}</EmptyTitle>
                    <EmptyDescription>{tc("refreshError")}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    if (!forms.data) {
        return (
            <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    if (!form) {
        return (
            <Empty className="rounded-xl border border-dashed bg-card py-12">
                <EmptyHeader>
                    <EmptyTitle>{t("noForms")}</EmptyTitle>
                    <EmptyDescription>{t("noFormsText")}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    const title = (item: { titleEn: string; titleGu: string }) => (locale === "gu" && item.titleGu ? item.titleGu : item.titleEn);
    const data = list.data;

    return (
        <div className="flex flex-col gap-6">
            <nav aria-label={t("formsLabel")} className="flex flex-wrap gap-2">
                {available.map((item) => (
                    <Button
                        key={item.id}
                        variant={item.id === form.id ? "default" : "outline"}
                        aria-current={item.id === form.id ? "page" : undefined}
                        onClick={() => chooseForm(item.code)}
                    >
                        {title(item)}
                        <span className="rounded-full bg-black/10 px-1.5 text-[12px] tabular-nums">{item.total}</span>
                    </Button>
                ))}
            </nav>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2" role="group" aria-label={t("status")}>
                    {(["", ...REVIEW_STATUSES] as const).map((value) => {
                        const count = value ? form.counts[value] : form.total;
                        const active = status === value;

                        return (
                            <button
                                key={value || "all"}
                                type="button"
                                aria-pressed={active}
                                onClick={() => {
                                    setStatus(value);
                                    resetPage();
                                }}
                                className={cn(
                                    "rounded-full border px-3 py-1 text-[14px] transition-colors",
                                    active
                                        ? "border-green bg-green text-white"
                                        : "border-green/15 bg-field text-[#4A5451] hover:border-green/40",
                                )}
                            >
                                {value ? ts(value) : t("all")} <span className="tabular-nums opacity-70">{count}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="flex flex-wrap gap-2">
                    {forms.data.canAssign && (
                        <Button variant="outline" onClick={() => setManagingAccess(true)}>
                            <UsersRoundIcon data-icon="inline-start" />
                            {t("manageAccess")}
                        </Button>
                    )}
                    {forms.data.canExport && (
                        <Button asChild variant="outline">
                            <a href={`/api/applications/export?${exportParams}`} download>
                                <DownloadIcon data-icon="inline-start" />
                                {t("download")}
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 rounded-2xl border border-green/10 bg-field p-4 sm:grid-cols-2 xl:grid-cols-6">
                <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="review-search">{t("search")}</FieldLabel>
                    <Input
                        id="review-search"
                        type="search"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder={data?.canSearchPhone === false ? t("searchNoPhone") : t("searchPhone")}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="review-jamaat">{t("jamaat")}</FieldLabel>
                    <ResponsiveSelect
                        id="review-jamaat"
                        className="w-full"
                        value={jamaat}
                        onValueChange={(next) => {
                            setJamaat(next);
                            resetPage();
                        }}
                        label={t("jamaat")}
                        options={[
                            { value: "", label: t("allJamaats") },
                            ...(filters.data?.jamaats ?? []).map((value) => ({ value, label: value })),
                        ]}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="review-city">{t("city")}</FieldLabel>
                    <ResponsiveSelect
                        id="review-city"
                        className="w-full"
                        value={city}
                        onValueChange={(next) => {
                            setCity(next);
                            resetPage();
                        }}
                        label={t("city")}
                        options={[
                            { value: "", label: t("allCities") },
                            ...(filters.data?.cities ?? []).map((value) => ({ value, label: value })),
                        ]}
                    />
                </Field>
                <div className="grid grid-cols-2 gap-4 sm:col-span-2">
                    <Field>
                        <FieldLabel htmlFor="review-from">{t("submittedFrom")}</FieldLabel>
                        <DatePicker
                            id="review-from"
                            clearable
                            value={from}
                            max={to || undefined}
                            onChange={(value) => {
                                setFrom(value);
                                resetPage();
                            }}
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="review-to">{t("submittedTo")}</FieldLabel>
                        <DatePicker
                            id="review-to"
                            clearable
                            value={to}
                            min={from || undefined}
                            onChange={(value) => {
                                setTo(value);
                                resetPage();
                            }}
                        />
                    </Field>
                </div>
            </div>

            {list.isError ? (
                <Empty className="rounded-xl border border-dashed bg-card py-12">
                    <EmptyHeader>
                        <EmptyTitle>{t("loadError")}</EmptyTitle>
                        <EmptyDescription>{tc("refreshError")}</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : !data ? (
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
                <>
                    <div className="overflow-hidden rounded-2xl border border-green/10 bg-field">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("number")}</TableHead>
                                    <TableHead>{t("applicant")}</TableHead>
                                    <TableHead>{t("jamaat")}</TableHead>
                                    <TableHead>{t("city")}</TableHead>
                                    <TableHead>{t("submitted")}</TableHead>
                                    <TableHead>{t("status")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                                            {t("empty")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.rows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-mono font-semibold whitespace-nowrap">
                                                <Link
                                                    href={`/applications/${row.id}`}
                                                    className="text-green hover:underline"
                                                    aria-label={t("openApplication", { number: row.number ?? "" })}
                                                >
                                                    {row.number}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{row.applicant}</div>
                                                {row.memberId && (
                                                    <div className="text-[13px] text-muted-foreground">{row.memberId}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>{row.jamaat ?? tc("dash")}</TableCell>
                                            <TableCell>{row.city ?? tc("dash")}</TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {row.submittedAt ? formatDate(row.submittedAt, locale) : tc("dash")}
                                            </TableCell>
                                            <TableCell>
                                                <ApplicationStatusBadge status={row.status} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <PagingBar
                        page={data.page}
                        pageSize={data.pageSize}
                        total={data.total}
                        disabled={list.isFetching}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setPage(1);
                        }}
                    />
                </>
            )}

            {forms.data.canAssign && (
                <FormAccessSheet
                    open={managingAccess}
                    onOpenChange={setManagingAccess}
                    formId={form.id}
                    formTitle={title(form)}
                />
            )}
        </div>
    );
}
