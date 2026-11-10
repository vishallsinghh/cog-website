"use client";

import { useState } from "react";
import { format, isValid, parse } from "date-fns";
import { enIN, gu } from "date-fns/locale";
import { CalendarIcon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const VALUE_FORMAT = "yyyy-MM-dd";
const FIRST_YEAR = 1900;
const YEARS_AHEAD = 10;

function toDate(value: string | undefined) {
    if (!value) return undefined;
    const date = parse(value, VALUE_FORMAT, new Date());
    return isValid(date) ? date : undefined;
}

export function DatePicker({
    id,
    name,
    ref,
    value,
    onChange,
    onBlur,
    min,
    max,
    disabled,
    clearable = false,
    placeholder,
    className,
    "aria-invalid": ariaInvalid,
}: {
    id?: string;
    name?: string;
    ref?: React.Ref<HTMLButtonElement>;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    min?: string;
    max?: string;
    disabled?: boolean;
    clearable?: boolean;
    placeholder?: string;
    className?: string;
    "aria-invalid"?: boolean;
}) {
    const locale = useLocale();
    const t = useTranslations("DatePicker");
    const [open, setOpen] = useState(false);
    const dateLocale = locale === "gu" ? gu : enIN;
    const selected = toDate(value);
    const minDate = toDate(min);
    const maxDate = toDate(max);
    const today = new Date();
    const thisYear = today.getFullYear();
    const todayValue = format(today, VALUE_FORMAT);
    const todayAllowed = (!min || todayValue >= min) && (!max || todayValue <= max);

    function choose(date: Date | undefined) {
        onChange(date ? format(date, VALUE_FORMAT) : "");
        setOpen(false);
    }

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) onBlur?.();
            }}
        >
            <div className={cn("relative w-full", className)}>
                <PopoverTrigger asChild>
                    <Button
                        ref={ref}
                        id={id}
                        name={name}
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        aria-invalid={ariaInvalid}
                        className={cn(
                            "h-11 w-full justify-start gap-2.5 rounded-lg border-input bg-white px-3.5 text-left text-base font-normal hover:bg-white aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
                            !selected && "text-muted-foreground",
                            clearable && selected && "pr-10",
                        )}
                    >
                        <CalendarIcon data-icon="inline-start" className="text-green" />
                        <span className="truncate">
                            {selected ? format(selected, "d MMM yyyy", { locale: dateLocale }) : (placeholder ?? t("placeholder"))}
                        </span>
                    </Button>
                </PopoverTrigger>
                {clearable && selected && !disabled && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
                        onClick={() => onChange("")}
                        aria-label={t("clear")}
                    >
                        <XIcon />
                    </Button>
                )}
            </div>
            <PopoverContent align="start" className="w-auto overflow-hidden rounded-xl p-0">
                <Calendar
                    mode="single"
                    selected={selected}
                    defaultMonth={selected ?? maxDate ?? minDate}
                    onSelect={choose}
                    captionLayout="dropdown"
                    startMonth={minDate ?? new Date(FIRST_YEAR, 0)}
                    endMonth={maxDate ?? new Date(thisYear + YEARS_AHEAD, 11)}
                    disabled={[...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])]}
                    locale={dateLocale}
                    className="p-3 [--cell-size:--spacing(10)]"
                    autoFocus
                />
                <div className="flex items-center justify-between gap-2 border-t border-green/10 px-3 py-2">
                    {todayAllowed ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => choose(new Date())}>
                            {t("today")}
                        </Button>
                    ) : (
                        <span />
                    )}
                    {selected && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => choose(undefined)}>
                            {t("clear")}
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
