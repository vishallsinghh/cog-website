"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PagingBar } from "@/components/dashboard/paging-bar";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { useTRPC } from "@/trpc/client";

export function AuditTable() {
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field>
                    <FieldLabel htmlFor="audit-action">Action</FieldLabel>
                    <NativeSelect
                        id="audit-action"
                        className="w-full"
                        value={action}
                        onChange={(event) => {
                            setAction(event.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">All actions</option>
                        {filters.data?.actions.map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </NativeSelect>
                </Field>
                <Field>
                    <FieldLabel htmlFor="audit-actor">Actor</FieldLabel>
                    <NativeSelect
                        id="audit-actor"
                        className="w-full"
                        value={actorId}
                        onChange={(event) => {
                            setActorId(event.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">Everyone</option>
                        {filters.data?.actors.map((actor) => (
                            <option key={actor.id} value={actor.id}>
                                {actor.name}
                            </option>
                        ))}
                    </NativeSelect>
                </Field>
                <Field>
                    <FieldLabel htmlFor="audit-from">From</FieldLabel>
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
                    <FieldLabel htmlFor="audit-to">To</FieldLabel>
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
                        <EmptyTitle>Could not load the activity log</EmptyTitle>
                        <EmptyDescription>Please refresh the page and try again.</EmptyDescription>
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
                    <div className="rounded-xl border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Actor</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Entity</TableHead>
                                    <TableHead>IP</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                                            No activity matches these filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.rows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {formatDateTime(row.createdAt)}
                                            </TableCell>
                                            <TableCell>{row.actorName ?? (row.actorId ? "Unknown" : "System")}</TableCell>
                                            <TableCell className="font-mono text-xs">{row.action}</TableCell>
                                            <TableCell className="max-w-56 truncate">
                                                {row.entityType
                                                    ? `${row.entityType}${row.entityId ? ` · ${row.entityId}` : ""}`
                                                    : "—"}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">{row.ipAddress ?? "—"}</TableCell>
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
