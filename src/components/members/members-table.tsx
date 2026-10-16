"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EllipsisVerticalIcon, Trash2Icon, UserRoundIcon } from "lucide-react";
import { toast } from "sonner";
import { PagingBar } from "@/components/dashboard/paging-bar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatPhone } from "@/lib/format";
import { MEMBER_STATUSES, STAFF_ROLES } from "@/lib/permissions";
import { useTRPC } from "@/trpc/client";
import { MemberSheet } from "./member-sheet";
import { StatusBadge } from "./status-badge";

function errorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback;
}

const ROLE_FILTERS = ["member", ...STAFF_ROLES] as const;

function isRole(value: string): value is (typeof ROLE_FILTERS)[number] {
    return (ROLE_FILTERS as readonly string[]).includes(value);
}

export function MembersTable() {
    const t = useTranslations("Members");
    const tc = useTranslations("Common");
    const tr = useTranslations("Roles");
    const ts = useTranslations("Statuses");
    const locale = useLocale();
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const [viewing, setViewing] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
    const remove = useMutation(trpc.members.delete.mutationOptions());

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [role, setRole] = useState("");
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

    const statusFilter = MEMBER_STATUSES.find((value) => value === status);
    const roleFilter = ROLE_FILTERS.find((value) => value === role);

    const query = useQuery({
        ...trpc.members.list.queryOptions({
            page,
            pageSize,
            search: search || undefined,
            status: statusFilter,
            role: roleFilter,
            joined: from || to ? { from: from || undefined, to: to || undefined } : undefined,
        }),
        placeholderData: keepPreviousData,
    });

    const data = query.data;
    const resetPage = () => setPage(1);

    async function confirmDelete() {
        if (!deleting) return;

        try {
            await remove.mutateAsync({ userId: deleting.id });
            toast.success(t("deleted", { name: deleting.name }));
        } catch (error) {
            toast.error(errorMessage(error, tc("genericError")));
        } finally {
            setDeleting(null);
            await queryClient.invalidateQueries({ queryKey: trpc.members.list.queryKey() });
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-4 rounded-2xl border border-green/10 bg-field p-4 sm:grid-cols-2 lg:grid-cols-5">
                <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="members-search">{t("search")}</FieldLabel>
                    <Input
                        id="members-search"
                        type="search"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder={data?.canSearchPhone === false ? t("searchNoPhone") : t("searchPhone")}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="members-status">{t("status")}</FieldLabel>
                    <NativeSelect
                        id="members-status"
                        className="w-full"
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            resetPage();
                        }}
                    >
                        <option value="">{t("allStatuses")}</option>
                        {MEMBER_STATUSES.map((value) => (
                            <option key={value} value={value}>
                                {ts(value)}
                            </option>
                        ))}
                    </NativeSelect>
                </Field>
                <Field>
                    <FieldLabel htmlFor="members-role">{t("role")}</FieldLabel>
                    <NativeSelect
                        id="members-role"
                        className="w-full"
                        value={role}
                        onChange={(event) => {
                            setRole(event.target.value);
                            resetPage();
                        }}
                    >
                        <option value="">{t("allRoles")}</option>
                        {ROLE_FILTERS.map((value) => (
                            <option key={value} value={value}>
                                {tr(value)}
                            </option>
                        ))}
                    </NativeSelect>
                </Field>
                <div className="grid grid-cols-2 gap-4 sm:col-span-2 lg:col-span-1">
                    <Field>
                        <FieldLabel htmlFor="members-from">{t("joinedFrom")}</FieldLabel>
                        <Input
                            id="members-from"
                            type="date"
                            value={from}
                            max={to || undefined}
                            onChange={(event) => {
                                setFrom(event.target.value);
                                resetPage();
                            }}
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="members-to">{t("joinedTo")}</FieldLabel>
                        <Input
                            id="members-to"
                            type="date"
                            value={to}
                            min={from || undefined}
                            onChange={(event) => {
                                setTo(event.target.value);
                                resetPage();
                            }}
                        />
                    </Field>
                </div>
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
                                    <TableHead>{t("name")}</TableHead>
                                    <TableHead>{t("mobile")}</TableHead>
                                    <TableHead>{t("memberId")}</TableHead>
                                    <TableHead>{t("status")}</TableHead>
                                    <TableHead>{t("role")}</TableHead>
                                    <TableHead>{t("joined")}</TableHead>
                                    <TableHead className="w-12">
                                        <span className="sr-only">{t("actions")}</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                            {t("empty")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.rows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-medium">{row.name}</TableCell>
                                            <TableCell className="whitespace-nowrap">{formatPhone(row.phone)}</TableCell>
                                            <TableCell>{row.memberId ?? tc("dash")}</TableCell>
                                            <TableCell>
                                                <StatusBadge status={row.status} />
                                            </TableCell>
                                            <TableCell>{isRole(row.role) ? tr(row.role) : row.role}</TableCell>
                                            <TableCell className="whitespace-nowrap">{formatDate(row.joinedAt, locale)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            aria-label={t("rowMenu", { name: row.name })}
                                                        >
                                                            <EllipsisVerticalIcon />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="min-w-44">
                                                        <DropdownMenuGroup>
                                                            <DropdownMenuItem onSelect={() => setViewing(row.id)}>
                                                                <UserRoundIcon />
                                                                {t("viewProfile")}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuGroup>
                                                        {row.deletable && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuGroup>
                                                                    <DropdownMenuItem
                                                                        variant="destructive"
                                                                        onSelect={() => setDeleting({ id: row.id, name: row.name })}
                                                                    >
                                                                        <Trash2Icon />
                                                                        {t("deleteRequest")}
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuGroup>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
                            setPage(1);
                        }}
                    />
                </>
            )}

            <MemberSheet userId={viewing} onOpenChange={(open) => !open && setViewing(null)} />

            <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("deleteTitle", { name: deleting?.name ?? "" })}</AlertDialogTitle>
                        <AlertDialogDescription>{t("deleteText")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={remove.isPending}>{tc("cancel")}</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" disabled={remove.isPending} onClick={() => void confirmDelete()}>
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
