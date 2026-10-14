"use client";

import { useTranslations, type Messages } from "next-intl";
import type { FieldError as HookFormError } from "react-hook-form";
import { FieldError } from "@/components/ui/field";

type ValidationKey = keyof Messages["Validation"];

/**
 * Zod schemas carry a key from messages.Validation as their error message, so the
 * same schema works on the server and in both languages. Unknown messages pass through.
 */
export function FormFieldError({ error }: { error?: HookFormError }) {
    const t = useTranslations("Validation");

    if (!error?.message) return null;

    const key = error.message as ValidationKey;
    const message = t.has(key) ? t(key) : error.message;

    return <FieldError errors={[{ message }]} />;
}
