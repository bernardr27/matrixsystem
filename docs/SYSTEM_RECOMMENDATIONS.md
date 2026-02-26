**Matrix System Recommendations (priority and actions)**

Summary: this document lists prioritized, practical improvements for backups, security, monitoring, testing, CI, and performance. Use the included scripts in `scripts/` to automate checks and maintenance.

1) Backups — high priority
 - Verify `backup.config.json` maps to real backups under `backups/`.
 - Implement incremental, encrypted backups of critical data (DB dumps, auth snapshots, config). Recommended: use rclone to encrypted remote (S3/Wasabi) + local snapshot retention.
 - Actionable: add a scheduled job (cron or GitHub Actions) to run `backup` and verify checksums. See `docs/backup-playbook.md` (create on request).

2) Auth snapshots & CI — high priority for UI automation
 - Use `scripts/auth/generate_auth_ci.cjs` to generate per-app auth snapshots (`scripts/auth/<app>_auth.json`). Run interactively and store snapshots in secure storage (not committed to git). In CI, mount snapshots from an encrypted secrets store.
 - Add GitHub Actions secret `MATRIX_SNAPSHOT_*` for credentials; run snapshot generator in a secure runner with Chrome installed.

3) Maintenance & storage management — medium
 - `scripts/maintenance/cleanup_organize.cjs` archives old captures/logs to `backups/cleanup-<timestamp>`; schedule weekly via `.github/workflows/maintenance.yml` (already added). Dry-run by default; use `--prune` to move files.
 - Keep a conservative `--keep` value (150) to avoid removing recent diagnostics.

4) Monitoring & health checks — medium
 - Use `scripts/system/audit_system.cjs` and the new `scripts/system/health_check.cjs` (added) to detect service outages and port failures.
 - Integrate health checks with a simple alerting action: if any required port is closed, open an incident (email/Slack webhook).

5) Security & dependency hygiene — high
 - Run `npm audit` on every CI build; add Dependabot or Renovate for dependency updates.
 - Ensure no secrets are committed (scan via `git-secrets` or `truffleHog`).
 - Enforce CSP headers and secure cookie flags at the app server level.

6) Testing & CI — high
 - Add a CI pipeline (sample workflows can be added) that runs: `npm ci`, `npm run lint`, `npm run test`, `npm run build` for each app.
 - Capture artifacts (build logs, audit JSON) and fail pipelines on regressions.

7) Performance — medium
 - Add lightweight performance tests (Lighthouse CI for public pages) and measure server response times with a simple script.
 - Use Next.js production builds for load testing; identify large bundles and split code where appropriate.

8) Documentation & runbooks — medium
 - Document restore procedures, where snapshots live, and how to regenerate auth snapshots.
 - Add playbooks for incident response (service down, backup failure, security incident).

If you want, I can implement the CI build/test workflow and health-check alerting next — pick one: `ci-build`, `health-alerts`, `encrypted-backups`, or `auth-ci` (I will implement that next).
