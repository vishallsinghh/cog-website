"use client";

import Image from "next/image";
import { ExternalLinkIcon, FileIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "@/components/ui/empty";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatFileSize } from "@/lib/format";

export type PreviewTarget = {
    name: string;
    contentType: string;
    size: number;
    src: string;
};

const INLINE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function previewKind(contentType: string) {
    if (INLINE_IMAGE_TYPES.has(contentType)) return "image";
    if (contentType === "application/pdf") return "pdf";
    return "none";
}

export function DocumentPreviewDialog({
    target,
    onClose,
}: {
    target: PreviewTarget | null;
    onClose: () => void;
}) {
    const t = useTranslations("ApplicationForm");
    const isMobile = useIsMobile();
    const kind = target ? previewKind(target.contentType) : "none";
    const inline = kind === "image" || (kind === "pdf" && !isMobile);

    return (
        <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex max-h-[92dvh] flex-col sm:max-w-3xl">
                <DialogHeader className="min-w-0 pr-8">
                    <DialogTitle className="truncate">{target?.name}</DialogTitle>
                    <DialogDescription>{target ? formatFileSize(target.size) : null}</DialogDescription>
                </DialogHeader>

                {target && inline && kind === "image" && (
                    <div className="relative h-[60dvh] w-full overflow-hidden rounded-lg bg-muted">
                        <Image src={target.src} alt={target.name} fill unoptimized className="object-contain" />
                    </div>
                )}

                {target && inline && kind === "pdf" && (
                    <iframe src={target.src} title={target.name} className="h-[65dvh] w-full rounded-lg border bg-muted" />
                )}

                {target && !inline && (
                    <Empty className="rounded-lg bg-muted">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <FileIcon />
                            </EmptyMedia>
                            <EmptyDescription>
                                {kind === "pdf" ? t("previewOpenPdf") : t("previewUnavailable")}
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}

                {target && (
                    <DialogFooter>
                        <Button variant="outline" asChild>
                            <a href={target.src} target="_blank" rel="noopener noreferrer">
                                <ExternalLinkIcon data-icon="inline-start" />
                                {t("openInNewTab")}
                            </a>
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
