import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function NotesModal({
    open,
    title,
    initialValue,
    onSave,
    onClose,
}) {
    const [value, setValue] = useState(initialValue || "");

    useEffect(() => {
        if (open) {
            setValue(initialValue || "");
        }
    }, [open, initialValue]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-xl border border-border bg-card p-4 shadow-lg"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start gap-3">
                    <h3 className="text-sm font-semibold md:text-base">
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-secondary"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <textarea
                    autoFocus
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="Notes"
                    className="mt-3 h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />

                <div className="mt-3 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave(value.trim())}
                        className="inline-flex items-center rounded-md border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
