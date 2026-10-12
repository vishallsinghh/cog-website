"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { PAGE_SIZES } from "@/lib/list.schemas";

export function PagingBar({
    page,
    pageSize,
    total,
    disabled,
    onPageChange,
    onPageSizeChange,
}: {
    page: number;
    pageSize: number;
    total: number;
    disabled?: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
}) {
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const last = Math.min(total, page * pageSize);

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground" aria-live="polite">
                {first}–{last} of {total}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <NativeSelect
                    size="sm"
                    aria-label="Rows per page"
                    value={pageSize}
                    disabled={disabled}
                    onChange={(event) => onPageSizeChange(Number(event.target.value))}
                >
                    {PAGE_SIZES.map((size) => (
                        <option key={size} value={size}>
                            {size} per page
                        </option>
                    ))}
                </NativeSelect>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled || page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    <ChevronLeftIcon data-icon="inline-start" />
                    Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                    Page {page} of {pageCount}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled || page >= pageCount}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                    <ChevronRightIcon data-icon="inline-end" />
                </Button>
            </div>
        </div>
    );
}
