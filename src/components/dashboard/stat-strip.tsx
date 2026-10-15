export type StatItem = { label: string; value?: string; node?: React.ReactNode };

export function StatStrip({ items }: { items: StatItem[] }) {
    return (
        <div className="rise r2 mt-7 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] rounded-2xl border border-green/10 bg-field">
            {items.map((item, index) => (
                <div key={item.label} className={`px-6 py-5 ${index === items.length - 1 ? "" : "border-r border-green/8"}`}>
                    <div className="label text-muted-ink [--fs:12px] [--ls:.14em]">{item.label}</div>
                    {item.node ? (
                        <div className="mt-2">{item.node}</div>
                    ) : (
                        <div className="display mt-1 text-[26px] text-green">{item.value}</div>
                    )}
                </div>
            ))}
        </div>
    );
}
