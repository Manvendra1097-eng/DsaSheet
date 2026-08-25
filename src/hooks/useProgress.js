import { useCallback, useEffect, useRef, useState } from "react";
import {
    getProgressMap,
    setProgressMap,
    updateProblemProgress,
} from "../lib/storage.js";
import {
    pullRemoteProgressByUid,
    pushRemoteProgressByUid,
} from "../lib/firebase.js";

function mergeProgressMaps(localMap, remoteMap) {
    const merged = { ...localMap };
    for (const [problemId, remoteProgress] of Object.entries(remoteMap || {})) {
        const localProgress = merged[problemId];
        if (
            !localProgress ||
            (remoteProgress.updatedAt || 0) > (localProgress.updatedAt || 0)
        ) {
            merged[problemId] = remoteProgress;
        }
    }
    return merged;
}

export function useProgress(user, setStatusMessage) {
    const scopeId = user?.uid || "guest";
    const scopeRef = useRef(scopeId);
    const [progressMap, setProgressMapState] = useState(() =>
        getProgressMap(scopeId),
    );

    useEffect(() => {
        scopeRef.current = scopeId;
        setProgressMapState(getProgressMap(scopeId));
    }, [scopeId]);

    const syncToRemote = useCallback(
        async (mapOverride) => {
            if (!user?.uid) {
                return;
            }

            try {
                setStatusMessage("pushing changes...");
                await pushRemoteProgressByUid(
                    user.uid,
                    mapOverride || progressMap,
                );
                setStatusMessage("synced");
            } catch (error) {
                console.error(error);
                setStatusMessage("sync failed while pushing");
            }
        },
        [user, progressMap, setStatusMessage],
    );

    const syncFromRemote = useCallback(async () => {
        if (!user?.uid) {
            return;
        }

        setStatusMessage("pulling cloud data...");
        try {
            const remote = await pullRemoteProgressByUid(user.uid);
            if (remote?.progressMap && typeof remote.progressMap === "object") {
                setProgressMapState((prev) => {
                    const merged = mergeProgressMaps(prev, remote.progressMap);
                    setProgressMap(scopeRef.current, merged);
                    return merged;
                });
            }
            setStatusMessage("cloud pull complete");
        } catch (error) {
            console.error(error);
            setStatusMessage("sync failed while pulling");
        }
    }, [user, setStatusMessage]);

    useEffect(() => {
        if (!user?.uid) {
            return undefined;
        }

        let cancelled = false;
        (async () => {
            await syncFromRemote();
            if (!cancelled) {
                await syncToRemote();
            }
        })();

        const interval = setInterval(() => {
            void syncToRemote();
        }, 30000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]);

    const updateProgress = useCallback(
        (problemId, fields) => {
            setProgressMapState((prev) => {
                const nextMap = updateProblemProgress(prev, problemId, fields);
                setProgressMap(scopeRef.current, nextMap);
                void syncToRemote(nextMap);
                return nextMap;
            });
        },
        [syncToRemote],
    );

    const syncNow = useCallback(async () => {
        if (!user?.uid) {
            setStatusMessage("login first");
            return;
        }
        await syncFromRemote();
        await syncToRemote();
    }, [user, syncFromRemote, syncToRemote, setStatusMessage]);

    return { progressMap, updateProgress, syncNow };
}
