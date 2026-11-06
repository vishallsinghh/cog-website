"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { errorMessage } from "@/components/applications/error-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { useTRPC } from "@/trpc/client";
import { NewFormDialog } from "./new-form-dialog";

export function FormsList() {
    const t = useTranslations("FormsAdmin");
    const tc = useTranslations("Common");
    const locale = useLocale();
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const [creating, setCreating] = useState(false);

    const list = useQuery(trpc.formsAdmin.list.queryOptions());
    const setOpen = useMutation(trpc.formsAdmin.setOpen.mutationOptions());
    const move = useMutation(trpc.formsAdmin.move.mutationOptions());
    const busy = setOpen.isPending || move.isPending;

    const refresh = () => queryClient.invalidateQueries({ queryKey: trpc.formsAdmin.list.queryKey() });

    async function toggle(id: string, open: boolean, name: string) {
        try {
            await setOpen.mutateAsync({ id, open });
            toast.success(open ? t("nowOpen", { form: name }) : t("nowClosed", { form: name }));
        } catch (error) {
            toast.error(errorMessage(error, tc("genericError")));
        } finally {
            await refresh();
        }
    }

    async function reorder(id: string, direction: "up" | "down") {
        try {
            await move.mutateAsync({ id, direction });
        } catch (error) {
            toast.error(errorMessage(error, tc("genericError")));
        } finally {
            await refresh();
        }
    }

    if (list.isError) {
        return (
            <Empty className="rounded-xl border border-dashed bg-card py-12">
                <EmptyHeader>
                    <EmptyTitle>{t("loadError")}</EmptyTitle>
                    <EmptyDescription>{tc("refreshError")}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    if (!list.data) {
        return (
            <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    const { forms, canWrite } = list.data;

    return (
        <div className="flex flex-col gap-4">
            {canWrite && (
                <Button className="w-fit" onClick={() => setCreating(true)}>
                    <PlusIcon data-icon="inline-start" />
                    {t("newForm")}
                </Button>
            )}

            <div className="overflow-hidden rounded-2xl border border-green/10 bg-field">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {canWrite && <TableHead className="w-24">{t("order")}</TableHead>}
                            <TableHead>{t("form")}</TableHead>
                            <TableHead>{t("version")}</TableHead>
                            <TableHead>{t("applications")}</TableHead>
                            <TableHead>{t("status")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {forms.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                                    {t("empty")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            forms.map((form, index) => {
                                const name = locale === "gu" && form.titleGu ? form.titleGu : form.titleEn;

                                return (
                                    <TableRow key={form.id}>
                                        {canWrite && (
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        disabled={busy || index === 0}
                                                        onClick={() => void reorder(form.id, "up")}
                                                        aria-label={t("moveUp", { form: name })}
                                                    >
                                                        <ArrowUpIcon />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        disabled={busy || index === forms.length - 1}
                                                        onClick={() => void reorder(form.id, "down")}
                                                        aria-label={t("moveDown", { form: name })}
                                                    >
                                                        <ArrowDownIcon />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <Link href={`/forms/${form.id}`} className="font-medium text-green hover:underline">
                                                {name}
                                            </Link>
                                            <div className="font-mono text-[13px] text-muted-foreground">{form.code}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="whitespace-nowrap">
                                                    {form.publishedVersion ? `v${form.publishedVersion}` : t("notPublished")}
                                                </span>
                                                {form.hasDraft && <Badge variant="outline">{t("draftBadge")}</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="tabular-nums">{form.applications}</TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={form.isOpen}
                                                disabled={!canWrite || busy || (!form.isOpen && !form.publishedVersion)}
                                                onCheckedChange={(checked) => void toggle(form.id, checked, name)}
                                                aria-label={t("openToggle", { form: name })}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {canWrite && <NewFormDialog open={creating} onOpenChange={setCreating} />}
        </div>
    );
}
