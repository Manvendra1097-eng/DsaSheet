// One-off helper: reads local .env.local (VITE_FIREBASE_* vars) and pushes each value
// straight to GitHub Actions repo secrets via `gh secret set`. Never prints values.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

function parseEnvFile(filePath) {
    const raw = readFileSync(filePath, "utf8");
    const entries = {};
    for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1) {
            continue;
        }
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        entries[key] = value;
    }
    return entries;
}

const env = parseEnvFile(envPath);

const SECRET_MAP = {
    VITE_FIREBASE_API_KEY: "FIREBASE_API_KEY",
    VITE_FIREBASE_AUTH_DOMAIN: "FIREBASE_AUTH_DOMAIN",
    VITE_FIREBASE_DATABASE_URL: "FIREBASE_DATABASE_URL",
    VITE_FIREBASE_PROJECT_ID: "FIREBASE_PROJECT_ID",
    VITE_FIREBASE_STORAGE_BUCKET: "FIREBASE_STORAGE_BUCKET",
    VITE_FIREBASE_MESSAGING_SENDER_ID: "FIREBASE_MESSAGING_SENDER_ID",
    VITE_FIREBASE_APP_ID: "FIREBASE_APP_ID",
    VITE_FIREBASE_MEASUREMENT_ID: "FIREBASE_MEASUREMENT_ID",
};

const repo = process.argv[2];
if (!repo) {
    console.error("Usage: node push-firebase-secrets.mjs <owner/repo>");
    process.exit(1);
}

for (const [envKey, secretName] of Object.entries(SECRET_MAP)) {
    const value = env[envKey];
    if (!value || value.includes("REPLACE_ME")) {
        console.log(`skip ${secretName} (no value set)`);
        continue;
    }

    execFileSync(
        "gh",
        ["secret", "set", secretName, "--repo", repo, "--body", value],
        {
            stdio: "inherit",
        },
    );
    console.log(`set ${secretName}`);
}
