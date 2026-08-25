function StatCard({ label, value }) {
    return (
        <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight">
                {value}
            </p>
        </article>
    );
}

export default function StatsGrid({ stats }) {
    return (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Total Problems" value={stats.total} />
            <StatCard label="Solved" value={stats.solved} />
            <StatCard label="Attempted" value={stats.attempted} />
            <StatCard label="Solved %" value={`${stats.solvedPercent}%`} />
        </section>
    );
}
