# DSA Sheet Tracker

A static DSA progress tracker built on top of `StriverDSASheet.js`.

- Works on GitHub Pages
- Google login via Firebase Authentication
- Cross-device sync via Firebase Realtime Database (per user account)

## Features

- View all Striver A2Z steps and problems
- Mark each problem: Not Started / Attempted / Solved
- Add notes per problem
- Search + difficulty filter + status filter
- Single-open accordion for steps (all collapsed at startup)
- Auto-save to browser local storage
- Optional cloud sync every 30 seconds

## Local Run

Open `index.html` directly in browser, or use a static server.

Example with Python:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500`.

## Firebase Setup (for cross-device sync)

1. Create a Firebase project.
2. Enable Google sign-in in Firebase Authentication.
3. Enable Realtime Database.
4. Copy `src/firebase-config.example.js` to `src/firebase-config.js` and fill in your values.
5. Set Realtime Database rules.

`src/firebase-config.js` is gitignored so your real keys are never committed — see
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

`src/firebase-config.js` holds your Firebase Web API config. It's listed in `.gitignore` so it
never gets pushed to GitHub. Note: this config is not a traditional secret — it's meant to be
public in client-side apps, and real protection comes from Firebase Auth + your Realtime
Database rules (step above), not from hiding these values. Keeping it out of git is still good
practice since it saves you from having to rotate keys later.

- **Local development:** copy `src/firebase-config.example.js` to `src/firebase-config.js` and
  fill in your real values. This file stays on your machine only.
- **GitHub Pages deployment:** the workflow at `.github/workflows/deploy.yml` generates
  `src/firebase-config.js` at deploy time from GitHub Actions secrets, so the real file never
  needs to exist in the repo.

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
3. Push to `main` — the workflow writes `src/firebase-config.js` from these secrets before
   deploying, then discards the runner (nothing is committed back to the repo).

Alternatively, if you have the [GitHub CLI](https://cli.github.com) installed and authenticated
(`gh auth login`), run `node scripts/push-firebase-secrets.mjs <owner>/<repo>` to push all 8
secrets from your local `src/firebase-config.js` in one step.

## Deploy to GitHub Pages

1. Push this project to a GitHub repo.
2. Ensure default branch is `main`.
3. In GitHub repo settings, enable Pages using GitHub Actions.
4. Add the Firebase repository secrets listed above.
5. Push to `main` and workflow at `.github/workflows/deploy.yml` will deploy automatically.

## Re-deploying after changes

Redeploying is automatic — no need to touch GitHub Pages settings again.

1. Edit files locally as usual.
2. Commit and push to `main`:
    ```bash
    git add -A
    git commit -m "Describe your change"
    git push
    ```
3. `.github/workflows/deploy.yml` triggers automatically on every push to `main`, regenerates
   `src/firebase-config.js` from your GitHub secrets, and redeploys to Pages within ~15-20 seconds.

Check deployment status:

```bash
gh run list --repo <owner>/<repo> --limit 3
```

Trigger a redeploy manually without pushing new code:

```bash
gh workflow run deploy.yml --repo <owner>/<repo>
```

Only re-run the secrets push if you change your **Firebase project values** (not app code) in
`src/firebase-config.js`:

```bash
node scripts/push-firebase-secrets.mjs <owner>/<repo>
```

## Usage Across Devices

1. Open app and sign in with the same Google account on every device.
2. Your progress auto-syncs; use **Sync Now** any time to force refresh.
