"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileTextIcon, ImageIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { FormFieldError } from "@/components/form/form-field-error";
import { Button } from "@/components/ui/button";
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { localize, type FieldOf } from "@/lib/forms/definition";
import { DOCUMENT_CONTENT_TYPES, isDocumentContentType, MAX_DOCUMENT_BYTES } from "@/lib/forms/documents";
import { formatFileSize } from "@/lib/format";
import { useTRPC } from "@/trpc/client";
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

export function DocumentField({
    field,
    applicationId,
    value,
    documents,
    uploadsAvailable,
    error,
    onUploaded,
    onRemoved,
}: {
    field: FieldOf<"document">;
    applicationId: string;
    value: string[];
    documents: UploadedDocument[];
    uploadsAvailable: boolean;
    error?: FieldError;
    onUploaded: (document: UploadedDocument) => void;
    onRemoved: (document: UploadedDocument) => void;
}) {
    const locale = useLocale();
    const t = useTranslations("ApplicationForm");
    const tc = useTranslations("Common");
    const trpc = useTRPC();
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [removing, setRemoving] = useState<string | null>(null);
    const requestUpload = useMutation(trpc.applications.requestUpload.mutationOptions());
    const confirmUpload = useMutation(trpc.applications.confirmUpload.mutationOptions());
    const removeDocument = useMutation(trpc.applications.removeDocument.mutationOptions());

    const attached = value
        .map((id) => documents.find((document) => document.id === id))
        .filter((document): document is UploadedDocument => Boolean(document));
    const remaining = field.maxFiles - attached.length;
    const inputId = `answer-${field.id}`;

    async function uploadOne(file: File) {
        if (!isDocumentContentType(file.type)) {
            toast.error(t("fileTypeNotAllowed"));
            return;
        }

        if (file.size > MAX_DOCUMENT_BYTES) {
            toast.error(t("fileTooLarge"));
            return;
        }

        const { documentId, uploadUrl } = await requestUpload.mutateAsync({
            applicationId,
            fieldId: field.id,
            fileName: file.name,
            contentType: file.type,
            size: file.size,
        });

        const response = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "content-type": file.type },
            body: file,
        });

        if (!response.ok) throw new Error(t("uploadFailed"));

        onUploaded(await confirmUpload.mutateAsync({ documentId }));
    }

    async function handleFiles(files: FileList | null) {
        if (!files?.length) return;

        setUploading(true);
        try {
            for (const file of Array.from(files).slice(0, remaining)) {
                await uploadOne(file);
            }
        } catch (uploadError) {
            toast.error(errorMessage(uploadError, t("uploadFailed")));
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
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
                <ul className="flex flex-col gap-2">
                    {attached.map((document) => (
                        <li
                            key={document.id}
                            className="flex items-center gap-3 rounded-[12px] border border-green/10 bg-white px-3 py-2.5"
                        >
                            <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-green/5 text-green">
                                {document.contentType === "application/pdf" ? <FileTextIcon /> : <ImageIcon />}
                            </span>
                            <a
                                href={`/api/documents/${document.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-w-0 flex-1 text-[15px] hover:underline"
                            >
                                <span className="block truncate">{document.fileName}</span>
                                <span className="text-[13px] text-muted-foreground">{formatFileSize(document.size)}</span>
                            </a>
                            {document.removable && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={removing === document.id}
                                    onClick={() => remove(document)}
                                    aria-label={`${t("remove")} ${document.fileName}`}
                                >
                                    {removing === document.id ? <Spinner /> : <Trash2Icon />}
                                </Button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {uploadsAvailable ? (
                remaining > 0 && (
                    <div className="flex flex-col gap-1.5">
                        <input
                            ref={inputRef}
                            id={inputId}
                            type="file"
                            multiple={remaining > 1}
                            accept={DOCUMENT_CONTENT_TYPES.join(",")}
                            className="sr-only"
                            onChange={(event) => handleFiles(event.target.files)}
                            disabled={uploading}
                            aria-invalid={Boolean(error)}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            className="w-fit"
                            disabled={uploading}
                            onClick={() => inputRef.current?.click()}
                        >
                            {uploading ? <Spinner data-icon="inline-start" /> : <UploadIcon data-icon="inline-start" />}
                            {uploading ? t("uploading") : t("upload")}
                        </Button>
                        <p className="text-[13px] text-muted-foreground">
                            {t("uploadHelp")} {t("filesCount", { count: attached.length, max: field.maxFiles })}
                        </p>
                    </div>
                )
            ) : (
                <p className="text-[14px] text-muted-foreground">{t("uploadsUnavailable")}</p>
            )}

            {error && <FormFieldError error={error} />}
        </FieldSet>
    );
}
