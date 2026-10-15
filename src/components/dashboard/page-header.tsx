export function PageHeader({
    title,
    description,
    children,
}: {
    title: React.ReactNode;
    description?: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="rise flex flex-col">
            <h1 className="display text-[clamp(36px,4vw,44px)] leading-[1.05] text-green">{title}</h1>
            {description && <p className="mt-1.5 max-w-2xl text-[16px] text-[#4A5451]">{description}</p>}
            {children}
        </div>
    );
}
