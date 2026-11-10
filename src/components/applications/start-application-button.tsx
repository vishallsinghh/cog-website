"use client";

import { useTransition } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "@/i18n/navigation";
import { useTRPC } from "@/trpc/client";
import { errorMessage } from "./error-message";

export function StartApplicationButton({ slug }: { slug: string }) {
    const t = useTranslations("MyApplications");
    const tc = useTranslations("Common");
    const router = useRouter();
    const trpc = useTRPC();
    const start = useMutation(trpc.applications.start.mutationOptions());
    const [navigating, startNavigation] = useTransition();
    const starting = start.isPending || (start.isSuccess && navigating);

    async function handleClick() {
        try {
            const application = await start.mutateAsync({ slug });
            startNavigation(() => router.push(`/my-applications/${application.id}`));
        } catch (error) {
            toast.error(errorMessage(error, tc("genericError")));
        }
    }

    return (
        <Button type="button" className="w-fit" disabled={starting} onClick={() => void handleClick()}>
            {t("apply")}
            {starting ? <Spinner data-icon="inline-end" /> : <ArrowRightIcon data-icon="inline-end" />}
        </Button>
    );
}
