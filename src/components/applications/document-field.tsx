"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import { CameraIcon, EyeIcon, FileIcon, FileTextIcon, RefreshCwIcon, Trash2Icon, UploadIcon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { FormFieldError } from "@/components/form/form-field-error";
import {
    Attachment,
    AttachmentAction,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentMedia,
    AttachmentTitle,
    AttachmentTrigger,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { localize, type FieldOf } from "@/lib/forms/definition";
import { DOCUMENT_CONTENT_TYPES, isDocumentContentType, MAX_DOCUMENT_BYTES } from "@/lib/forms/documents";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { DocumentPreviewDialog, previewKind, type PreviewTarget } from "./document-preview-dialog";
import { errorMessage } from "./error-message";
import type { FieldError } from "react-hook-form";

export type UploadedDocument = {
    id: string;
    fieldId: string;
    fileName: string;
    contentType: string;
    size: number;
    removable: boolean;
};

type StagedFile = {
    key: string;
    file: File;
    url: string;
    invalid: string | null;
    failure: string | null;
    progress: number | null;
};

function putFile(url: string, file: File, onProgress: (percent: number) => void) {
    return new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("PUT", url);
        request.setRequestHeader("content-type", file.type);
        request.upload.onprogress = (event) => {
            if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
        };
        request.onload = () => (request.status >= 200 && request.status < 300 ? resolve() : reject(new Error()));
        request.onerror = () => reject(new Error());
        request.onabort = () => reject(new Error());
        request.send(file);
    });
}

function FileThumbnail({ contentType, src, alt }: { contentType: string; src: string; alt: string }) {
    const kind = previewKind(contentType);

    if (kind === "image") {
        return (
            <AttachmentMedia variant="image" className="w-12">
                <Image src={src} alt={alt} fill unoptimized className="object-cover" />
            </AttachmentMedia>
        );
    }

    return <AttachmentMedia className="w-12">{kind === "pdf" ? <FileTextIcon /> : <FileIcon />}</AttachmentMedia>;
}

export function DocumentField({
    field,
    applicationId,
    value,
    documents,
    uploadsAvailable,
    error,
    onUploaded,
    onRemoved,
    onReplaced,
}: {
    field: FieldOf<"document">;
    applicationId: string;
    value: string[];
    documents: UploadedDocument[];
    uploadsAvailable: boolean;
    error?: FieldError;
    onUploaded: (document: UploadedDocument) => void;
    onRemoved: (document: UploadedDocument) => void;
    onReplaced: (previous: UploadedDocument, next: UploadedDocument) => void;
}) {
    const locale = useLocale();
    const t = useTranslations("ApplicationForm");
    const tc = useTranslations("Common");
    const trpc = useTRPC();
    const isMobile = useIsMobile();
    const inputRef = useRef<HTMLInputElement>(null);
    const cameraRef = useRef<HTMLInputElement>(null);
    const stagedRef = useRef<StagedFile[]>([]);
    const replaceTarget = useRef<UploadedDocument | null>(null);
    const [staged, setStaged] = useState<StagedFile[]>([]);
    const [replacing, setReplacing] = useState<UploadedDocument | null>(null);
    const [uploading, setUploading] = useState(false);
    const [removing, setRemoving] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [preview, setPreview] = useState<PreviewTarget | null>(null);
    const requestUpload = useMutation(trpc.applications.requestUpload.mutationOptions());
    const confirmUpload = useMutation(trpc.applications.confirmUpload.mutationOptions());
    const removeDocument = useMutation(trpc.applications.removeDocument.mutationOptions());

    useEffect(() => {
        stagedRef.current = staged;
    }, [staged]);

    useEffect(() => () => stagedRef.current.forEach((item) => URL.revokeObjectURL(item.url)), []);

    const attached = value
        .map((id) => documents.find((document) => document.id === id))
        .filter((document): document is UploadedDocument => Boolean(document));
    const slots = replacing ? 1 : field.maxFiles - attached.length;
    const ready = staged.filter((item) => !item.invalid);
    const canAddMore = uploadsAvailable && !uploading && slots - staged.length > 0;
    const replaceable = uploadsAvailable && field.maxFiles === 1;
    const inputId = `answer-${field.id}`;
    const busy = uploading || removing !== null;

    function problemOf(file: File) {
        if (!isDocumentContentType(file.type)) return t("fileTypeNotAllowed");
        if (file.size > MAX_DOCUMENT_BYTES) return t("fileTooLarge");
        return null;
    }

    function stage(files: FileList | File[] | null, room: number) {
        if (!files?.length) return;

        const picked = Array.from(files);
        if (picked.length > room) toast.error(t("tooManySelected", { max: field.maxFiles }));

        const added = picked.slice(0, Math.max(room, 0)).map((file) => ({
            key: crypto.randomUUID(),
            file,
            url: URL.createObjectURL(file),
            invalid: problemOf(file),
            failure: null,
            progress: null,
        }));

        setStaged((current) => [...current, ...added]);
    }

    function unstage(key: string) {
        const item = stagedRef.current.find((entry) => entry.key === key);
        if (item) URL.revokeObjectURL(item.url);
        setStaged((current) => current.filter((entry) => entry.key !== key));
    }

    function dropStaged(key: string) {
        unstage(key);
        if (staged.length === 1) setReplacing(null);
    }

    function clearStaged() {
        staged.forEach((item) => URL.revokeObjectURL(item.url));
        setStaged([]);
        setReplacing(null);
    }

    function updateStaged(key: string, patch: Partial<StagedFile>) {
        setStaged((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
    }

    function resetInputs() {
        if (inputRef.current) inputRef.current.value = "";
        if (cameraRef.current) cameraRef.current.value = "";
    }

    function pickFiles(replaces: UploadedDocument | null) {
        replaceTarget.current = replaces;
        inputRef.current?.click();
    }

    function onPicked(files: FileList | null) {
        const target = replaceTarget.current;
        replaceTarget.current = null;

        if (target) {
            clearStaged();
            setReplacing(target);
            stage(files, 1);
        } else {
            stage(files, slots - staged.length);
        }

        resetInputs();
    }

    async function discard(documentId: string) {
        await removeDocument.mutateAsync({ documentId }).catch(() => undefined);
    }

    async function uploadOne(item: StagedFile, replaces: UploadedDocument | null) {
        const contentType = item.file.type;
        if (!isDocumentContentType(contentType)) throw new Error(t("fileTypeNotAllowed"));

        const { documentId, uploadUrl } = await requestUpload.mutateAsync({
            applicationId,
            fieldId: field.id,
            fileName: item.file.name,
            contentType,
            size: item.file.size,
            replacesDocumentId: replaces?.id,
        });

        let uploaded: UploadedDocument;
        try {
            await putFile(uploadUrl, item.file, (percent) => updateStaged(item.key, { progress: percent })).catch(() => {
                throw new Error(t("uploadFailed"));
            });
            uploaded = await confirmUpload.mutateAsync({ documentId });
        } catch (uploadError) {
            await discard(documentId);
            throw uploadError;
        }

        if (!replaces) {
            onUploaded(uploaded);
            return;
        }

        try {
            await removeDocument.mutateAsync({ documentId: replaces.id });
        } catch (removeError) {
            await discard(uploaded.id);
            throw removeError;
        }

        onReplaced(replaces, uploaded);
    }

    async function uploadStaged() {
        setUploading(true);
        let failed = false;

        for (const item of ready) {
            updateStaged(item.key, { progress: 0, failure: null });
            try {
                await uploadOne(item, replacing);
                unstage(item.key);
            } catch (uploadError) {
                failed = true;
                updateStaged(item.key, { progress: null, failure: errorMessage(uploadError, t("uploadFailed")) });
            }
        }

        setUploading(false);
        if (!failed) setReplacing(null);
        resetInputs();
    }

    async function remove(document: UploadedDocument) {
        setRemoving(document.id);
        try {
            await removeDocument.mutateAsync({ documentId: document.id });
            onRemoved(document);
        } catch (removeError) {
            toast.error(errorMessage(removeError, tc("genericError")));
        } finally {
            setRemoving(null);
        }
    }

    function onDragOver(event: DragEvent) {
        if (!canAddMore) return;
        event.preventDefault();
        setDragging(true);
    }

    function onDrop(event: DragEvent) {
        event.preventDefault();
        setDragging(false);
        if (canAddMore) stage(event.dataTransfer.files, slots - staged.length);
    }

    return (
        <FieldSet data-invalid={Boolean(error)}>
            <FieldLegend variant="label">
                {localize(field.label, locale)}
                {!field.required && <span className="font-normal text-muted-foreground"> {t("optional")}</span>}
            </FieldLegend>
            {field.help && localize(field.help, locale) && (
                <FieldDescription>{localize(field.help, locale)}</FieldDescription>
            )}

            {attached.length > 0 && (
                <div className="flex flex-col gap-2">
                    {attached.map((document) => {
                        const src = `/api/documents/${document.id}`;
                        const isRemoving = removing === document.id;

                        return (
                            <Attachment key={document.id} className="w-full" state={isRemoving ? "processing" : "done"}>
                                <FileThumbnail contentType={document.contentType} src={src} alt={document.fileName} />
                                <AttachmentContent>
                                    <AttachmentTitle>{document.fileName}</AttachmentTitle>
                                    <AttachmentDescription>
                                        {formatFileSize(document.size)} · {t("uploaded")}
                                    </AttachmentDescription>
                                </AttachmentContent>
                                <AttachmentTrigger
                                    aria-label={`${t("view")} ${document.fileName}`}
                                    onClick={() =>
                                        setPreview({
                                            name: document.fileName,
                                            contentType: document.contentType,
                                            size: document.size,
                                            src,
                                        })
                                    }
                                />
                                <AttachmentActions className="gap-1">
                                    <AttachmentAction
                                        size="icon-sm"
                                        aria-label={`${t("view")} ${document.fileName}`}
                                        onClick={() =>
                                            setPreview({
                                                name: document.fileName,
                                                contentType: document.contentType,
                                                size: document.size,
                                                src,
                                            })
                                        }
                                    >
                                        <EyeIcon />
                                    </AttachmentAction>
                                    {document.removable && replaceable && (
                                        <AttachmentAction
                                            size="icon-sm"
                                            disabled={busy}
                                            aria-label={`${t("replace")} ${document.fileName}`}
                                            onClick={() => pickFiles(document)}
                                        >
                                            <RefreshCwIcon />
                                        </AttachmentAction>
                                    )}
                                    {document.removable && (
                                        <AttachmentAction
                                            size="icon-sm"
                                            disabled={busy}
                                            aria-label={`${t("remove")} ${document.fileName}`}
                                            onClick={() => remove(document)}
                                        >
                                            {isRemoving ? <Spinner /> : <Trash2Icon />}
                                        </AttachmentAction>
                                    )}
                                </AttachmentActions>
                            </Attachment>
                        );
                    })}
                </div>
            )}

            {staged.length > 0 && (
                <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-3">
                    <p className="text-sm font-medium">
                        {replacing ? t("replaceTitle", { name: replacing.fileName }) : t("reviewTitle")}
                    </p>
                    <div className="flex flex-col gap-2">
                        {staged.map((item) => {
                            const isUploading = item.progress !== null;
                            const problem = item.invalid ?? item.failure;

                            return (
                                <Attachment
                                    key={item.key}
                                    className="w-full"
                                    state={isUploading ? "uploading" : problem ? "error" : "idle"}
                                >
                                    <FileThumbnail contentType={item.file.type} src={item.url} alt={item.file.name} />
                                    <AttachmentContent className="flex flex-col gap-1.5">
                                        <AttachmentTitle>{item.file.name}</AttachmentTitle>
                                        {isUploading ? (
                                            <Progress
                                                value={item.progress}
                                                aria-label={t("uploadingFile", { name: item.file.name })}
                                            />
                                        ) : (
                                            <AttachmentDescription className="whitespace-normal">
                                                {problem ?? `${formatFileSize(item.file.size)} · ${t("readyToUpload")}`}
                                            </AttachmentDescription>
                                        )}
                                    </AttachmentContent>
                                    {!item.invalid && !isUploading && (
                                        <AttachmentTrigger
                                            aria-label={`${t("view")} ${item.file.name}`}
                                            onClick={() =>
                                                setPreview({
                                                    name: item.file.name,
                                                    contentType: item.file.type,
                                                    size: item.file.size,
                                                    src: item.url,
                                                })
                                            }
                                        />
                                    )}
                                    {!isUploading && (
                                        <AttachmentActions>
                                            <AttachmentAction
                                                size="icon-sm"
                                                disabled={uploading}
                                                aria-label={`${t("remove")} ${item.file.name}`}
                                                onClick={() => dropStaged(item.key)}
                                            >
                                                <XIcon />
                                            </AttachmentAction>
                                        </AttachmentActions>
                                    )}
                                </Attachment>
                            );
                        })}
                    </div>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" disabled={uploading} onClick={clearStaged}>
                            {tc("cancel")}
                        </Button>
                        <Button type="button" disabled={uploading || ready.length === 0} onClick={uploadStaged}>
                            {uploading ? <Spinner data-icon="inline-start" /> : <UploadIcon data-icon="inline-start" />}
                            {uploading ? t("uploading") : t("uploadCount", { count: ready.length })}
                        </Button>
                    </div>
                </div>
            )}

            {uploadsAvailable ? (
                <>
                    <input
                        ref={inputRef}
                        id={inputId}
                        type="file"
                        multiple={!replacing && slots > 1}
                        accept={DOCUMENT_CONTENT_TYPES.join(",")}
                        className="sr-only"
                        tabIndex={-1}
                        onChange={(event) => onPicked(event.target.files)}
                        disabled={uploading}
                        aria-invalid={Boolean(error)}
                    />
                    <input
                        ref={cameraRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="sr-only"
                        tabIndex={-1}
                        onChange={(event) => {
                            stage(event.target.files, slots - staged.length);
                            resetInputs();
                        }}
                        disabled={uploading}
                    />
                    {canAddMore && !replacing && (
                        <div
                            data-dragging={dragging}
                            onDragOver={onDragOver}
                            onDragLeave={() => setDragging(false)}
                            onDrop={onDrop}
                            className={cn(
                                "flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-4 py-6 text-center transition-colors",
                                "data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/5",
                                error && "border-destructive/50",
                            )}
                        >
                            <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                <UploadIcon />
                            </span>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium">{isMobile ? t("dropTitleTouch") : t("dropTitle")}</p>
                                <p className="text-xs text-muted-foreground">
                                    {t("dropHint")} · {t("filesCount", { count: attached.length, max: field.maxFiles })}
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => pickFiles(null)}>
                                    <UploadIcon data-icon="inline-start" />
                                    {t("chooseFiles")}
                                </Button>
                                {isMobile && (
                                    <Button type="button" variant="outline" size="sm" onClick={() => cameraRef.current?.click()}>
                                        <CameraIcon data-icon="inline-start" />
                                        {t("takePhoto")}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <p className="text-[14px] text-muted-foreground">{t("uploadsUnavailable")}</p>
            )}

            {error && <FormFieldError error={error} />}

            <DocumentPreviewDialog target={preview} onClose={() => setPreview(null)} />
        </FieldSet>
    );
}
