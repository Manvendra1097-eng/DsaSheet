import { useState } from "react";
import { StickyNote } from "lucide-react";
import { normalizeLink } from "../lib/sheet.js";
import NotesModal from "./NotesModal.jsx";

const DIFFICULTY_CLASS = {
    easy: "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    medium: "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    hard: "border-rose-500/35 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

const STATUS_ACTIVE_CLASS = {
    solved: "border-emerald-500/45 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    attempted:
        "border-amber-500/45 bg-amber-500/15 text-amber-700 dark:text-amber-300",
    "not-started": "border-border bg-secondary text-secondary-foreground",
};

const STATUS_IDLE_CLASS =
    "border-border bg-background text-muted-foreground hover:bg-secondary";

const ROW_TONE_CLASS = {
    solved: "bg-emerald-500/10",
    attempted: "bg-amber-500/10",
    "not-started": "bg-background",
};

function StatusButton({ status, active, onClick }) {
    const label = status === "not-started" ? "Not Started" : status;
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                active ? STATUS_ACTIVE_CLASS[status] : STATUS_IDLE_CLASS
            }`}
        >
            {label}
        </button>
    );
}

export default function ProblemRow({
    problem,
    progress,
    onSetStatus,
    onSetNotes,
}) {
    const [notesOpen, setNotesOpen] = useState(false);
    const hasNotes = Boolean(progress.notes && progress.notes.trim());
    const difficultyClass = (problem.difficultyText || "easy").toLowerCase();
    const lcLink = normalizeLink(problem.lcLink);
    const gfgLink = normalizeLink(problem.gfgLink);
    const cnLink = normalizeLink(problem.cnLink);
    const videoLink = normalizeLink(problem.video);

    return (
        <article
            className={`grid grid-cols-1 gap-3 rounded-xl border border-border p-3 md:grid-cols-[1fr_auto] md:items-start ${ROW_TONE_CLASS[progress.status]}`}
        >
            <div>
                <p className="text-sm font-semibold md:text-base">
                    {problem.titleText}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                    <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${DIFFICULTY_CLASS[difficultyClass] || DIFFICULTY_CLASS.easy}`}
                    >
                        {problem.difficultyText}
                    </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                    {lcLink && (
                        <a
                            className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-xs text-primary hover:bg-secondary"
                            href={lcLink}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            LeetCode
                        </a>
                    )}
                    {gfgLink && (
                        <a
                            className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-xs text-primary hover:bg-secondary"
                            href={gfgLink}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            GFG
                        </a>
                    )}
                    {cnLink && (
                        <a
                            className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-xs text-primary hover:bg-secondary"
                            href={cnLink}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Code360
                        </a>
                    )}
                    {videoLink && (
                        <a
                            className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-xs text-teal-800 font-bold hover:bg-secondary"
                            href={videoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Solution
                        </a>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-start gap-1.5 md:flex-col md:items-end">
                <div className="flex flex-wrap gap-1.5 md:justify-end">
                    {["not-started", "attempted", "solved"].map((status) => (
                        <StatusButton
                            key={status}
                            status={status}
                            active={status === progress.status}
                            onClick={() => onSetStatus(problem.id, status)}
                        />
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => setNotesOpen(true)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        hasNotes
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:bg-secondary"
                    }`}
                >
                    <StickyNote className="h-3 w-3" />
                    {hasNotes ? "Notes" : "Add note"}
                </button>
            </div>

            <NotesModal
                open={notesOpen}
                title={problem.titleText}
                initialValue={progress.notes || ""}
                onClose={() => setNotesOpen(false)}
                onSave={(value) => {
                    onSetNotes(problem.id, value);
                    setNotesOpen(false);
                }}
            />
        </article>
    );
}
