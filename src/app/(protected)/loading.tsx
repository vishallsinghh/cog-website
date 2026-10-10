import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8" aria-busy="true">
            <div className="flex flex-col gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-72" />
                <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
}
