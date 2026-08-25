import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, get, set } from "firebase/database";
import {
    getAuth,
    browserLocalPersistence,
    browserSessionPersistence,
    indexedDBLocalPersistence,
    getRedirectResult,
    GoogleAuthProvider,
    onAuthStateChanged,
    setPersistence,
    signInWithPopup,
    signInWithRedirect,
    signOut,
} from "firebase/auth";

const PLACEHOLDER_VALUE = "REPLACE_ME";

const FIREBASE_CONFIG = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

function hasRequiredConfig() {
    return ["apiKey", "authDomain", "databaseURL", "projectId", "appId"].every(
        (key) => {
            const value = FIREBASE_CONFIG[key];
            return value && !String(value).includes(PLACEHOLDER_VALUE);
        },
    );
}

function getApp() {
    return getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
}

function getDb() {
    return getDatabase(getApp());
}

function getFirebaseAuth() {
    return getAuth(getApp());
}

function userPath(uid) {
    return `users/${uid}`;
}

export function isFirebaseEnabled() {
    return hasRequiredConfig();
}

export function observeAuthState(callback) {
    if (!isFirebaseEnabled()) {
        callback(null);
        return () => {};
    }

    return onAuthStateChanged(getFirebaseAuth(), callback);
}

export function getCurrentAuthUser() {
    if (!isFirebaseEnabled()) {
        return null;
    }

    return getFirebaseAuth().currentUser;
}

export async function waitForAuthReady() {
    if (!isFirebaseEnabled()) {
        return;
    }

    const auth = getFirebaseAuth();
    if (typeof auth.authStateReady === "function") {
        await auth.authStateReady();
    }
}

export async function signInWithGoogle() {
    if (!isFirebaseEnabled()) {
        throw new Error("Firebase is not configured.");
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const auth = getFirebaseAuth();
    const persistenceOptions = [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
    ];

    for (const persistence of persistenceOptions) {
        try {
            await setPersistence(auth, persistence);
            break;
        } catch {
            // Try next persistence option when browser policies block one.
        }
    }

    try {
        return await signInWithPopup(auth, provider);
    } catch (error) {
        const code = error?.code || "";
        const shouldFallbackToRedirect =
            code.includes("popup-blocked") ||
            code.includes("popup-closed-by-user") ||
            code.includes("cancelled-popup-request") ||
            code.includes("operation-not-supported-in-this-environment");

        if (!shouldFallbackToRedirect) {
            throw error;
        }

        await signInWithRedirect(auth, provider);
        return null;
    }
}

export async function signOutCurrentUser() {
    if (!isFirebaseEnabled()) {
        return;
    }

    await signOut(getFirebaseAuth());
}

export async function consumeRedirectResult() {
    if (!isFirebaseEnabled()) {
        return null;
    }

    return getRedirectResult(getFirebaseAuth());
}

export async function pullRemoteProgressByUid(uid) {
    if (!isFirebaseEnabled() || !uid) {
        return null;
    }

    const db = getDb();
    const snapshot = await get(ref(db, userPath(uid)));
    return snapshot.exists() ? snapshot.val() : null;
}

export async function pushRemoteProgressByUid(uid, progressMap) {
    if (!isFirebaseEnabled() || !uid) {
        return;
    }

    const payload = {
        progressMap,
        updatedAt: Date.now(),
    };

    const db = getDb();
    await set(ref(db, userPath(uid)), payload);
}

export function authErrorToMessage(error) {
    const code = error?.code || "";
    if (code.includes("popup-blocked")) {
        return "popup blocked; allow popups or retry";
    }
    if (code.includes("popup-closed-by-user")) {
        return "popup closed before sign-in completed";
    }
    if (code.includes("redirect-cancelled-by-user")) {
        return "redirect cancelled, try sign in again";
    }
    if (code.includes("operation-not-allowed")) {
        return "enable Google sign-in in Firebase Auth";
    }
    if (code.includes("unauthorized-domain")) {
        return "add localhost and 127.0.0.1 in Firebase authorized domains";
    }
    if (code.includes("invalid-api-key")) {
        return "invalid Firebase apiKey in config";
    }
    if (code.includes("network-request-failed")) {
        return "network blocked request to Firebase";
    }
    return "authentication error";
}
