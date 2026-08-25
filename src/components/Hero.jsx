import { syncDotClass } from "../lib/syncStatus.js";

export default function Hero({ statusMessage }) {
    return (
        <header className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                DSA Progress Tracker
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Track solved and attempted problems across devices with Firebase
                login sync.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/60 px-3 py-1.5 text-xs font-medium text-secondary-foreground md:text-sm">
                <span
                    className={`h-2 w-2 shrink-0 rounded-full ${syncDotClass(statusMessage)}`}
                />
                <span>{statusMessage}</span>
            </p>
        </header>
    );
}
