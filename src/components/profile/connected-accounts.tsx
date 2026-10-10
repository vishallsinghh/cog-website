"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth.client";
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

export type GoogleAccount = { id: string; linkedAt: string };

export function ConnectedAccounts({ google }: { google: GoogleAccount | null }) {
    const router = useRouter();
    const params = useSearchParams();
    const [busy, setBusy] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const handled = useRef(false);
    const connected = google !== null;

    const error = params.get("error");
    const linked = params.get("linked");

    useEffect(() => {
        if (handled.current || (!error && !linked)) return;
        handled.current = true;

        if (error) toast.error(linkErrorMessage(error));
        else if (linked === "google") toast.success("Google account connected");

        window.history.replaceState(null, "", "/profile");
    }, [error, linked]);

    async function connect() {
        setBusy(true);

        const { error: linkError } = await authClient.linkSocial({
            provider: "google",
            callbackURL: "/profile?linked=google",
            errorCallbackURL: "/profile",
        });

        if (linkError) {
            setBusy(false);
            toast.error(linkErrorMessage(linkError.code ?? ""));
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
                unlinkError.code === "SESSION_NOT_FRESH"
                    ? "For your security, please sign in again before disconnecting Google."
                    : "We could not disconnect Google. Please try again.",
            );
            return;
        }

        toast.success("Google account disconnected");
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
                            Google
                            <Badge variant={connected ? "default" : "outline"}>
                                {connected ? "Connected" : "Not connected"}
                            </Badge>
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {connected
                                ? `Linked on ${new Date(google.linkedAt).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                  })}. You can sign in with Google.`
                                : "Connect Google to sign in with one tap next time."}
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
                        Disconnect
                    </Button>
                ) : (
                    <Button type="button" size="lg" disabled={busy} onClick={connect}>
                        {busy && <Spinner data-icon="inline-start" />}
                        Connect Google
                    </Button>
                )}
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect Google?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You will no longer be able to sign in with Google. You can still sign in
                            with your mobile number, and you can reconnect Google at any time.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={busy}
                            onClick={(event) => {
                                event.preventDefault();
                                disconnect();
                            }}
                        >
                            {busy && <Spinner data-icon="inline-start" />}
                            Disconnect
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
