# DSA Sheet Tracker

A React + Vite DSA progress tracker built on top of Striver's A2Z sheet data.

- Works on GitHub Pages
- Google login via Firebase Authentication
- Cross-device sync via Firebase Realtime Database (per user account)

## Features

- View all Striver A2Z steps and problems
- Mark each problem: Not Started / Attempted / Solved
- Add notes per problem
- Search + topic filter + difficulty filter + status filter
- Single-open accordion for steps (all collapsed at startup)
- Auto-save to browser local storage
- Optional cloud sync every 30 seconds
- Amber / Orange shadcn color palettes, each with light/dark mode

## Project Structure

```
public/            static assets served as-is (favicons, manifest)
src/
  components/      presentational React components
  hooks/           useTheme, useAuth, useProgress
  lib/             firebase.js, storage.js, sheet.js, syncStatus.js
  data/            striversSheet.js (problem data)
  App.jsx          top-level component wiring hooks + components
  main.jsx         React entry point
  index.css        Tailwind directives + theme tokens
scripts/           one-off tooling (push-firebase-secrets.mjs)
```

## Local Run

```bash
npm install
npm run dev
```

Then open the printed `http://localhost:5173/...` URL.

## Firebase Setup (for cross-device sync)

1. Create a Firebase project.
2. Enable Google sign-in in Firebase Authentication.
3. Enable Realtime Database.
4. Copy `.env.example` to `.env.local` and fill in your values (all prefixed `VITE_FIREBASE_`).
5. Set Realtime Database rules.

`.env.local` is gitignored so your real keys are never committed — see
[Managing secrets](#managing-secrets) below for how the deployed site still gets them.

### Realtime Database rules for authenticated users

```json
{
    "rules": {
        "users": {
            "$uid": {
                ".read": "$uid === auth.uid",
                ".write": "$uid === auth.uid"
            }
        }
    }
}
```

Also add your domains in Firebase Auth authorized domains.

## Managing secrets

Firebase Web API config is read via Vite env vars (`import.meta.env.VITE_FIREBASE_*`) at build
time. It's not a traditional secret — it's meant to be public in client-side apps, and real
protection comes from Firebase Auth + your Realtime Database rules above, not from hiding these
values. Keeping it out of git is still good practice since it saves you from having to rotate
keys later.

- **Local development:** copy `.env.example` to `.env.local` and fill in your real values. This
  file stays on your machine only.
- **GitHub Pages deployment:** the workflow at `.github/workflows/ci-cd.yml` builds the app with
  these values injected from GitHub Actions secrets, so no real `.env` file ever needs to exist
  in the repo.

To set this up:

1. In your GitHub repo, go to **Settings -> Secrets and variables -> Actions**.
2. Add a repository secret for each value from your Firebase config:
    - `FIREBASE_API_KEY`
    - `FIREBASE_AUTH_DOMAIN`
    - `FIREBASE_DATABASE_URL`
    - `FIREBASE_PROJECT_ID`
    - `FIREBASE_STORAGE_BUCKET`
    - `FIREBASE_MESSAGING_SENDER_ID`
    - `FIREBASE_APP_ID`
    - `FIREBASE_MEASUREMENT_ID`
3. Push to `main` — the workflow builds with these secrets as `VITE_FIREBASE_*` env vars, then
   discards the runner (nothing is committed back to the repo).

Alternatively, if you have the [GitHub CLI](https://cli.github.com) installed and authenticated
(`gh auth login`), run `node scripts/push-firebase-secrets.mjs <owner>/<repo>` to push all 8
secrets from your local `.env.local` in one step.

## Deploy to GitHub Pages

1. Push this project to a GitHub repo.
2. Ensure default branch is `main`.
3. In GitHub repo settings, enable Pages using GitHub Actions.
4. Add the Firebase repository secrets listed above.
5. Push to `main` and workflow at `.github/workflows/ci-cd.yml` will validate then build and
   deploy automatically.

## Re-deploying after changes

Redeploying is automatic — no need to touch GitHub Pages settings again.

1. Edit files locally as usual.
2. Commit and push to `main`:
    ```bash
    git add -A
    git commit -m "Describe your change"
    git push
    ```
3. `.github/workflows/ci-cd.yml` runs automatically on every push and pull request:
    - **validate** job: installs dependencies, confirms no local secrets files were committed,
      and runs a sanity build with placeholder env values.
    - **deploy** job: only runs for pushes to `main` (skipped on pull requests), and only if
      `validate` passes. It builds the app with your real secrets and redeploys to Pages.

Opening a pull request runs `validate` only, so you get a pass/fail check before merging without
deploying unfinished work.

Check deployment status:

```bash
gh run list --repo <owner>/<repo> --limit 3
```

Trigger a redeploy manually without pushing new code:

```bash
gh workflow run ci-cd.yml --repo <owner>/<repo>
```

Only re-run the secrets push if you change your **Firebase project values** (not app code) in
`.env.local`:

```bash
node scripts/push-firebase-secrets.mjs <owner>/<repo>
```

## Usage Across Devices

1. Open app and sign in with the same Google account on every device.
2. Your progress auto-syncs; use the avatar menu's **Sync** option any time to force refresh.
