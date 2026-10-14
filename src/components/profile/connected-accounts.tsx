"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { authClient } from "@/lib/auth.client";
import { getPathname, useRouter } from "@/i18n/navigation";
import { linkErrorMessage } from "@/components/member/auth-messages";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { GoogleIcon } from "@/components/member/google-icon";
import { formatDate } from "@/lib/format";

export type GoogleAccount = { id: string; linkedAt: string };

export function ConnectedAccounts({ google }: { google: GoogleAccount | null }) {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations("Connected");
    const te = useTranslations("AuthErrors");
    const tc = useTranslations("Common");
    const params = useSearchParams();
    const profilePath = getPathname({ href: "/profile", locale });
    const [busy, setBusy] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const handled = useRef(false);
    const connected = google !== null;

    const error = params.get("error");
    const linked = params.get("linked");

    useEffect(() => {
        if (handled.current || (!error && !linked)) return;
        handled.current = true;

        if (error) toast.error(linkErrorMessage(error, te));
        else if (linked === "google") toast.success(t("connectedToast"));

        window.history.replaceState(null, "", profilePath);
    }, [error, linked, profilePath, t, te]);

    async function connect() {
        setBusy(true);

        const { error: linkError } = await authClient.linkSocial({
            provider: "google",
            callbackURL: `${profilePath}?linked=google`,
            errorCallbackURL: profilePath,
        });

        if (linkError) {
            setBusy(false);
            toast.error(linkErrorMessage(linkError.code ?? "", te));
        }
    }

    async function disconnect() {
        if (!google) return;

        setBusy(true);

        const { error: unlinkError } = await authClient.unlinkAccount({ accountId: google.id });

        setBusy(false);
        setConfirmOpen(false);

        if (unlinkError) {
            toast.error(
                unlinkError.code === "SESSION_NOT_FRESH" ? t("freshSession") : t("disconnectError"),
            );
            return;
        }

        toast.success(t("disconnectedToast"));
        router.refresh();
    }

    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5">
                <div className="flex items-center gap-4">
                    <span className="flex size-11 items-center justify-center rounded-lg border bg-background">
                        <GoogleIcon className="size-5" />
                    </span>
                    <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 text-sm font-medium">
                            {t("google")}
                            <Badge variant={connected ? "default" : "outline"}>
                                {connected ? t("connected") : t("notConnected")}
                            </Badge>
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {connected
                                ? t("linkedOn", { date: formatDate(new Date(google.linkedAt), locale) })
                                : t("connectHint")}
                        </span>
                    </div>
                </div>

                {connected ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        disabled={busy}
                        onClick={() => setConfirmOpen(true)}
                    >
                        {t("disconnect")}
                    </Button>
                ) : (
                    <Button type="button" size="lg" disabled={busy} onClick={connect}>
                        {busy && <Spinner data-icon="inline-start" />}
                        {t("connect")}
                    </Button>
                )}
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("confirmText")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={busy}>{tc("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={busy}
                            onClick={(event) => {
                                event.preventDefault();
                                disconnect();
                            }}
                        >
                            {busy && <Spinner data-icon="inline-start" />}
                            {t("disconnect")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
