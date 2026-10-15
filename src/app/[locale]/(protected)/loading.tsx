import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex w-full flex-col gap-6" aria-busy="true">
            <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-72 max-w-full" />
                <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
    );
}
