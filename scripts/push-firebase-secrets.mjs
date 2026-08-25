// One-off helper: reads local src/firebase-config.js and pushes each value
// straight to GitHub Actions repo secrets via `gh secret set`. Never prints values.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, "..", "src", "firebase-config.js");

const { FIREBASE_CONFIG } = await import(`file://${configPath}`);

const SECRET_MAP = {
    apiKey: "FIREBASE_API_KEY",
    authDomain: "FIREBASE_AUTH_DOMAIN",
    databaseURL: "FIREBASE_DATABASE_URL",
    projectId: "FIREBASE_PROJECT_ID",
    storageBucket: "FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "FIREBASE_MESSAGING_SENDER_ID",
    appId: "FIREBASE_APP_ID",
    measurementId: "FIREBASE_MEASUREMENT_ID",
};

const repo = process.argv[2];
if (!repo) {
    console.error("Usage: node push-firebase-secrets.mjs <owner/repo>");
    process.exit(1);
}

for (const [configKey, secretName] of Object.entries(SECRET_MAP)) {
    const value = FIREBASE_CONFIG[configKey];
    if (!value || String(value).includes("REPLACE_ME")) {
        console.log(`skip ${secretName} (no value set)`);
        continue;
    }

    execFileSync(
        "gh",
        ["secret", "set", secretName, "--repo", repo, "--body", String(value)],
        {
            stdio: "inherit",
        },
    );
    console.log(`set ${secretName}`);
}
