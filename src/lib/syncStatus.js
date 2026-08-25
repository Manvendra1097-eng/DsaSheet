const SYNC_DOT_CLASS = {
    success: "bg-emerald-500",
    error: "bg-rose-500",
    pending: "bg-amber-500 animate-pulse",
    neutral: "bg-muted-foreground/50",
};

export function classifySyncStatus(text) {
    const lower = text.toLowerCase();
    if (/fail|error|cancelled|blocked|invalid|not restored/.test(lower)) {
        return "error";
    }
    if (/synced|successful|complete/.test(lower)) {
        return "success";
    }
    if (/pulling|pushing|opening|continuing/.test(lower)) {
        return "pending";
    }
    return "neutral";
}

export function syncDotClass(text) {
    return SYNC_DOT_CLASS[classifySyncStatus(text)];
}
