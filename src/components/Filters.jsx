export default function Filters({ filters, setFilters, topics }) {
    return (
        <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-lg font-bold tracking-tight">Filters</h2>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-12">
                <input
                    type="text"
                    placeholder="Search problems..."
                    value={filters.search}
                    onChange={(event) =>
                        setFilters((prev) => ({
                            ...prev,
                            search: event.target.value,
                        }))
                    }
                    className="col-span-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:col-span-5"
                />
                <select
                    value={filters.topic}
                    onChange={(event) =>
                        setFilters((prev) => ({
                            ...prev,
                            topic: event.target.value,
                        }))
                    }
                    className="col-span-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring md:col-span-4"
                >
                    <option value="all">All Topics</option>
                    {topics.map((topic) => (
                        <option key={topic.stepNo} value={topic.stepNo}>
                            Step {topic.stepNo}: {topic.stepTitle}
                        </option>
                    ))}
                </select>
                <select
                    value={filters.difficulty}
                    onChange={(event) =>
                        setFilters((prev) => ({
                            ...prev,
                            difficulty: event.target.value,
                        }))
                    }
                    className="col-span-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring md:col-span-2"
                >
                    <option value="all">All Difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                </select>
                <select
                    value={filters.status}
                    onChange={(event) =>
                        setFilters((prev) => ({
                            ...prev,
                            status: event.target.value,
                        }))
                    }
                    className="col-span-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring md:col-span-1"
                >
                    <option value="all">All Status</option>
                    <option value="not-started">Not Started</option>
                    <option value="attempted">Attempted</option>
                    <option value="solved">Solved</option>
                </select>
            </div>
        </section>
    );
}
