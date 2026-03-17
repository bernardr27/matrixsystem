# Permanent Cloud Runbook (Oracle Free VM)

## Why this replaces the current setup
- GitHub-hosted workflows are not designed for permanent long-running server processes.
- This runbook moves runtime to a free always-on VM tier and keeps your PC out of the loop.

## Target architecture
- Host: Oracle Cloud Always Free VM (`VM.Standard.A1.Flex` recommended).
- Process manager: PM2 with reboot persistence.
- Services:
  - `apps/ghost-command/core/sentinel.cjs`
  - `apps/ghost-command/core/ghost-runner.cjs`
- Source of truth remains this GitHub repo; runtime no longer depends on GitHub Actions job uptime.

## One-time setup
1. Create Oracle Free VM (Ubuntu).
2. SSH into VM as root (or sudo root shell).
3. Run:
```bash
curl -fsSL https://raw.githubusercontent.com/bernardr27/matrixsystem/main/infra/oracle-free/install_oracle_free.sh -o /tmp/install_oracle_free.sh
bash /tmp/install_oracle_free.sh
```
4. Create `/opt/matrix/.env` with production credentials:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `REDIS_URL` (if used)
   - any other app-critical keys
5. Start/refresh PM2:
```bash
cd /opt/matrix
pm2 start infra/oracle-free/ecosystem.config.cjs
pm2 save
```

## Verification
```bash
bash /opt/matrix/infra/oracle-free/verify_oracle_free.sh
```

Expected:
- PM2 shows both services `online`
- Heartbeat diagnostics show fresh records
- Bridge diagnostics do not show stale failures

## Update workflow
```bash
cd /opt/matrix
git fetch origin main
git checkout main
git pull --ff-only origin main
npm install --no-audit --no-fund
pm2 reload infra/oracle-free/ecosystem.config.cjs
```

## Desktop resource guarantee
On your local PC:
- run `npm run local:disable:autostart`
- run `npm run local:stop:matrix`
- run `npm run local:guard:no-listeners`

This ensures no local Matrix runtime consumes CPU on startup.
