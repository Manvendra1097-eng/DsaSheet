import { useCallback, useEffect, useRef, useState } from "react";
import {
    isFirebaseEnabled,
    observeAuthState,
    getCurrentAuthUser,
    waitForAuthReady,
    signInWithGoogle,
    consumeRedirectResult,
    signOutCurrentUser,
    authErrorToMessage,
} from "../lib/firebase.js";

const LOGIN_ATTEMPT_KEY = "dsa_login_attempt_in_progress";

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCurrentUserWithRetry({
    maxWaitMs = 6000,
    intervalMs = 300,
} = {}) {
    const deadline = Date.now() + maxWaitMs;
    let user = getCurrentAuthUser();

    while (!user && Date.now() < deadline) {
        await delay(intervalMs);
        user = getCurrentAuthUser();
    }

    return user;
}

export function useAuth() {
    const [user, setUser] = useState(null);
    const [authBusy, setAuthBusy] = useState(false);
    const [authMessage, setAuthMessage] = useState("waiting for login");
    const bootstrapped = useRef(false);

    useEffect(() => {
        if (bootstrapped.current) {
            return undefined;
        }
        bootstrapped.current = true;

        if (!isFirebaseEnabled()) {
            setAuthMessage("local only (set Firebase config)");
            return undefined;
        }

        const unsubscribe = observeAuthState((nextUser) => {
            setUser(nextUser);
        });

        (async () => {
            await waitForAuthReady();

            try {
                const redirectResult = await consumeRedirectResult();
                if (redirectResult?.user) {
                    sessionStorage.removeItem(LOGIN_ATTEMPT_KEY);
                    setAuthMessage("login successful");
                    setUser(redirectResult.user);
                    return;
                }
            } catch (error) {
                console.error(error);
                sessionStorage.removeItem(LOGIN_ATTEMPT_KEY);
                setAuthMessage(authErrorToMessage(error));
                return;
            }

            const hadLoginAttempt =
                sessionStorage.getItem(LOGIN_ATTEMPT_KEY) === "1";
            const currentUser = hadLoginAttempt
                ? await getCurrentUserWithRetry({
                      maxWaitMs: 7000,
                      intervalMs: 350,
                  })
                : getCurrentAuthUser();

            if (currentUser) {
                sessionStorage.removeItem(LOGIN_ATTEMPT_KEY);
                setUser(currentUser);
            } else if (hadLoginAttempt) {
                setAuthMessage(
                    "login returned but no session restored (allow cookies / disable strict shields)",
                );
                sessionStorage.removeItem(LOGIN_ATTEMPT_KEY);
            } else {
                setAuthMessage("login required for cloud sync");
            }
        })();

        return unsubscribe;
    }, []);

    const login = useCallback(async () => {
        if (authBusy) {
            setAuthMessage("login already in progress");
            return;
        }

        setAuthBusy(true);
        const watchdogId = setTimeout(() => {
            setAuthBusy(false);
            setAuthMessage(
                "login taking too long; check popup/cookies and retry",
            );
        }, 12000);

        try {
            sessionStorage.setItem(LOGIN_ATTEMPT_KEY, "1");
            setAuthMessage("opening Google login...");
            const result = await signInWithGoogle();

            if (result?.user) {
                sessionStorage.removeItem(LOGIN_ATTEMPT_KEY);
                setAuthMessage("login successful");
                setUser(result.user);
            } else {
                setAuthMessage("continuing login...");
            }
        } catch (error) {
            console.error(error);
            setAuthMessage(authErrorToMessage(error));
        } finally {
            clearTimeout(watchdogId);
            setAuthBusy(false);
        }
    }, [authBusy]);

    const logout = useCallback(async () => {
        try {
            await signOutCurrentUser();
            setAuthMessage("signed out");
            setUser(null);
        } catch (error) {
            console.error(error);
            setAuthMessage("sign out failed");
        }
    }, []);

    return {
        user,
        authBusy,
        authMessage,
        setAuthMessage,
        firebaseEnabled: isFirebaseEnabled(),
        login,
        logout,
    };
}
