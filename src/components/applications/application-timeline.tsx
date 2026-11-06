import { useLocale, useTranslations } from "next-intl";
import { isApplicationStatus } from "@/lib/forms/application-status";
import { formatDateTime } from "@/lib/format";

export type TimelineEvent = {
    id: string;
    toStatus: string;
    message: string | null;
    createdAt: Date;
    actor?: string | null;
};

export function ApplicationTimeline({ title, events }: { title: string; events: TimelineEvent[] }) {
    const locale = useLocale();
    const ts = useTranslations("ApplicationStatuses");

    return (
        <section className="rounded-[18px] border border-green/10 bg-field p-[clamp(20px,2.6vw,32px)]">
            <h2 className="display m-0 text-[24px] text-green">{title}</h2>
            <ol className="mt-4 flex flex-col gap-4 border-l-2 border-green/15 pl-5">
                {[...events].reverse().map((event) => (
                    <li key={event.id} className="relative">
                        <span
                            aria-hidden="true"
                            className="absolute top-1.5 -left-[27px] size-3 rounded-full border-2 border-field bg-green"
                        />
                        <div className="text-[15px] font-semibold text-green">
                            {isApplicationStatus(event.toStatus) ? ts(event.toStatus) : event.toStatus}
                        </div>
                        <div className="text-[13px] text-muted-foreground">
                            {formatDateTime(event.createdAt, locale)}
                            {event.actor && <> · {event.actor}</>}
                        </div>
                        {event.message && (
                            <p className="mt-1 text-[15px] whitespace-pre-wrap text-[#4A5451]">{event.message}</p>
                        )}
                    </li>
                ))}
            </ol>
        </section>
    );
}
