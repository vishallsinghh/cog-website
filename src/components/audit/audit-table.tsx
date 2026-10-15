"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PagingBar } from "@/components/dashboard/paging-bar";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { useTRPC } from "@/trpc/client";

export function AuditTable() {
    const t = useTranslations("Audit");
    const tc = useTranslations("Common");
    const locale = useLocale();
    const trpc = useTRPC();

    const [action, setAction] = useState("");
    const [actorId, setActorId] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const filters = useQuery(trpc.audit.filters.queryOptions());

    const query = useQuery({
        ...trpc.audit.list.queryOptions({
            page,
            pageSize,
            action: action || undefined,
            actorId: actorId || undefined,
            dates: from || to ? { from: from || undefined, to: to || undefined } : undefined,
        }),
        placeholderData: keepPreviousData,
    });

    const data = query.data;

    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-4 rounded-2xl border border-green/10 bg-field p-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field>
                    <FieldLabel htmlFor="audit-action">{t("action")}</FieldLabel>
                    <NativeSelect
                        id="audit-action"
                        className="w-full"
                        value={action}
                        onChange={(event) => {
                            setAction(event.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">{t("allActions")}</option>
                        {filters.data?.actions.map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </NativeSelect>
                </Field>
                <Field>
                    <FieldLabel htmlFor="audit-actor">{t("actor")}</FieldLabel>
                    <NativeSelect
                        id="audit-actor"
                        className="w-full"
                        value={actorId}
                        onChange={(event) => {
                            setActorId(event.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">{t("everyone")}</option>
                        {filters.data?.actors.map((actor) => (
                            <option key={actor.id} value={actor.id}>
                                {actor.name}
                            </option>
                        ))}
                    </NativeSelect>
                </Field>
                <Field>
                    <FieldLabel htmlFor="audit-from">{t("from")}</FieldLabel>
                    <Input
                        id="audit-from"
                        type="date"
                        value={from}
                        max={to || undefined}
                        onChange={(event) => {
                            setFrom(event.target.value);
                            setPage(1);
                        }}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="audit-to">{t("to")}</FieldLabel>
                    <Input
                        id="audit-to"
                        type="date"
                        value={to}
                        min={from || undefined}
                        onChange={(event) => {
                            setTo(event.target.value);
                            setPage(1);
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
                                    <TableHead>{t("time")}</TableHead>
                                    <TableHead>{t("actor")}</TableHead>
                                    <TableHead>{t("action")}</TableHead>
                                    <TableHead>{t("entity")}</TableHead>
                                    <TableHead>{t("ip")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                                            {t("empty")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.rows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {formatDateTime(row.createdAt, locale)}
                                            </TableCell>
                                            <TableCell>{row.actorName ?? (row.actorId ? t("unknown") : t("system"))}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-mono">
                                                    {row.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-56 truncate">
                                                {row.entityType
                                                    ? `${row.entityType}${row.entityId ? ` · ${row.entityId}` : ""}`
                                                    : tc("dash")}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">{row.ipAddress ?? tc("dash")}</TableCell>
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
                            setPage(1);
                        }}
                    />
                </>
            )}
        </div>
    );
}
