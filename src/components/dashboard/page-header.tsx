export function PageHeader({
    eyebrow,
    title,
    description,
    children,
}: {
    eyebrow: string;
    title: string;
    description?: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3">
            <p className="text-xs font-bold tracking-[0.3em] text-accent-foreground/60">{eyebrow}</p>
            <h1 className="font-heading text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
                {title}
            </h1>
            {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
            {children}
        </div>
    );
}
