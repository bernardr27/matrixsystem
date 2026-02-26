Auth snapshot format and creation

This folder holds optional per-app auth snapshots used by the mobile verifier to bypass login and 2FA during automated captures.

Format (JSON):
{
  "cookies": [ /* puppeteer cookie objects */ ],
  "localStorage": { "key": "value", ... }
}

How to create an auth snapshot (quick methods):

1) Manual (via browser DevTools)
- Open app in browser (Edge/Chrome) and sign in interactively.
- Open DevTools -> Application -> Cookies. Export cookies as JSON (or copy relevant cookie values).
- In DevTools -> Application -> Local Storage, copy keys/values used for auth (e.g. `auth.token`, `persist:root`).
- Create file named `<app>_auth.json` in `scripts/auth/` with the structure above.

2) Puppeteer interactive (recommended for repeatability)
- Run a small Puppeteer script that opens a non-headless browser, navigates to the login page, and allows you to complete 2FA manually.
- After login, capture `await page.cookies()` and dump `localStorage` via `await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage))))`.
- Save both parts into the auth JSON file.

3) Automated TOTP flow (for CI)
- Use a dedicated test account and store credentials and TOTP secret securely in CI secrets.
- Write a small script that fills username/password, generates TOTP from the secret, submits, waits for authentication to complete, then writes cookies and localStorage.

Important notes
- Keep auth snapshots secure; they contain session cookies and tokens.
- Prefer dedicated test accounts with limited privileges.
- For robust CI, regenerate snapshots periodically or create session refresh logic.

Example filename:
- `scripts/auth/citadel_auth.json`

If you want, I can: create an interactive Puppeteer helper script that assists creating these snapshots locally (non-headless), or add an automated TOTP flow if you provide test credentials and TOTP secrets (use env vars or secret store).