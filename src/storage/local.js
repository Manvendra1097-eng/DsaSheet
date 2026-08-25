const STORAGE_KEYS = {
    LEGACY_PROGRESS: "dsa_progress_map_v1",
    PROGRESS_PREFIX: "dsa_progress_map_v2_",
};

function storageKeyFor(scopeId) {
    return `${STORAGE_KEYS.PROGRESS_PREFIX}${scopeId || "guest"}`;
}

export function getProgressMap(scopeId = "guest") {
    const scopedKey = storageKeyFor(scopeId);
    let raw = localStorage.getItem(scopedKey);

    // One-time fallback for old app data before per-user storage.
    if (!raw && scopeId === "guest") {
        raw = localStorage.getItem(STORAGE_KEYS.LEGACY_PROGRESS);
    }

    if (!raw) {
        return {};
    }

    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export function setProgressMap(scopeId = "guest", progressMap) {
    localStorage.setItem(storageKeyFor(scopeId), JSON.stringify(progressMap));
}

export function updateProblemProgress(progressMap, problemId, nextFields) {
    const now = Date.now();
    const existing = progressMap[problemId] || {
        status: "not-started",
        notes: "",
        updatedAt: 0,
    };

    const updated = {
        ...existing,
        ...nextFields,
        updatedAt: now,
    };

    return {
        ...progressMap,
        [problemId]: updated,
    };
}
