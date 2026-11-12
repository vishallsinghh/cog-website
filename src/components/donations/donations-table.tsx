"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DownloadIcon } from "lucide-react";
import { PagingBar } from "@/components/dashboard/paging-bar";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DONATION_PROGRAMMES, DONATION_STATUSES, isDonationProgramme } from "@/lib/donate.schemas";
import { formatDateTime, formatPhone, formatRupees } from "@/lib/format";
import { useTRPC } from "@/trpc/client";
import { DonationStatusBadge } from "./donation-status-badge";

export function DonationsTable() {
    const t = useTranslations("Donations");
    const tp = useTranslations("Donate.programmes");
    const tc = useTranslations("Common");
    const locale = useLocale();
    const trpc = useTRPC();

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [programme, setProgramme] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const statusFilter = DONATION_STATUSES.find((value) => value === status);
    const programmeFilter = DONATION_PROGRAMMES.find((value) => value === programme);

    const query = useQuery({
        ...trpc.donations.list.queryOptions({
            page,
            pageSize,
            search: search || undefined,
            status: statusFilter,
            programme: programmeFilter,
            dates: from || to ? { from: from || undefined, to: to || undefined } : undefined,
        }),
        placeholderData: keepPreviousData,
    });

    const data = query.data;
    const resetPage = () => setPage(1);

    const exportParams = new URLSearchParams({ locale });
    if (search) exportParams.set("search", search);
    if (statusFilter) exportParams.set("status", statusFilter);
    if (programmeFilter) exportParams.set("programme", programmeFilter);
    if (from) exportParams.set("from", from);
    if (to) exportParams.set("to", to);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-stretch gap-4">
                <div className="grid min-w-0 flex-1 grid-cols-[repeat(auto-fit,minmax(170px,1fr))] rounded-2xl border border-green/10 bg-field">
                    <div className="border-r border-green/8 px-6 py-5">
                        <div className="label text-muted-ink [--fs:12px] [--ls:.14em]">{t("totalReceived")}</div>
                        <div className="display mt-1 text-[26px] text-green">
                            {data ? formatRupees(data.paidAmountPaise, locale) : <Skeleton className="mt-2 h-7 w-24" />}
                        </div>
                    </div>
                    <div className="border-r border-green/8 px-6 py-5">
                        <div className="label text-muted-ink [--fs:12px] [--ls:.14em]">{t("paidCount")}</div>
                        <div className="display mt-1 text-[26px] text-green">
                            {data ? data.paidCount : <Skeleton className="mt-2 h-7 w-12" />}
                        </div>
                    </div>
                    <div className="px-6 py-5">
                        <div className="label text-muted-ink [--fs:12px] [--ls:.14em]">{t("shown")}</div>
                        <div className="display mt-1 text-[26px] text-green">
                            {data ? data.total : <Skeleton className="mt-2 h-7 w-12" />}
                        </div>
                    </div>
                </div>
                {data?.canExport && (
                    <Button asChild variant="outline" className="self-center">
                        <a href={`/api/donations/export?${exportParams}`} download>
                            <DownloadIcon data-icon="inline-start" />
                            {t("download")}
                        </a>
                    </Button>
                )}
            </div>

            <div className="grid gap-4 rounded-2xl border border-green/10 bg-field p-4 sm:grid-cols-2 lg:grid-cols-6">
                <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="donations-search">{t("search")}</FieldLabel>
                    <Input
                        id="donations-search"
                        type="search"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder={data?.canSeeContact === false ? t("searchNoContact") : t("searchContact")}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="donations-status">{t("status")}</FieldLabel>
                    <ResponsiveSelect
                        id="donations-status"
                        className="w-full"
                        value={status}
                        onValueChange={(next) => {
                            setStatus(next);
                            resetPage();
                        }}
                        label={t("status")}
                        options={[
                            { value: "", label: t("allStatuses") },
                            ...DONATION_STATUSES.map((value) => ({ value, label: t(`statuses.${value}`) })),
                        ]}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="donations-programme">{t("programme")}</FieldLabel>
                    <ResponsiveSelect
                        id="donations-programme"
                        className="w-full"
                        value={programme}
                        onValueChange={(next) => {
                            setProgramme(next);
                            resetPage();
                        }}
                        label={t("programme")}
                        options={[
                            { value: "", label: t("allProgrammes") },
                            ...DONATION_PROGRAMMES.map((value) => ({ value, label: tp(value) })),
                        ]}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="donations-from">{t("from")}</FieldLabel>
                    <DatePicker
                        id="donations-from"
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
                    <FieldLabel htmlFor="donations-to">{t("to")}</FieldLabel>
                    <DatePicker
                        id="donations-to"
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

            {query.isError ? (
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
                                    <TableHead>{t("receipt")}</TableHead>
                                    <TableHead>{t("donor")}</TableHead>
                                    <TableHead>{t("programme")}</TableHead>
                                    <TableHead className="text-right">{t("amount")}</TableHead>
                                    <TableHead>{t("status")}</TableHead>
                                    <TableHead>{t("date")}</TableHead>
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
                                            <TableCell className="font-mono whitespace-nowrap">
                                                {row.receiptNumber ?? tc("dash")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{row.name}</div>
                                                <div className="text-[13px] whitespace-nowrap text-muted-foreground">
                                                    {[row.memberId, formatPhone(row.phoneNumber), row.email].filter(Boolean).join(" · ")}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {isDonationProgramme(row.programme) ? tp(row.programme) : row.programme}
                                            </TableCell>
                                            <TableCell className="text-right font-medium whitespace-nowrap">
                                                {formatRupees(row.amountPaise, locale)}
                                            </TableCell>
                                            <TableCell>
                                                <DonationStatusBadge status={row.status} />
                                                {row.status === "failed" && row.failureReason && (
                                                    <div className="mt-1 max-w-56 truncate text-[13px] text-muted-foreground">
                                                        {row.failureReason}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {formatDateTime(row.paidAt ?? row.createdAt, locale)}
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
                        disabled={query.isFetching}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            resetPage();
                        }}
                    />
                </>
            )}
        </div>
    );
}
