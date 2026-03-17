# Strict Matrix Quality Workflow

Use this sequence before and after any significant Matrix change.

## 1) Environment and cloud preflight

```powershell
cmd /c npm run env:check
cmd /c npm run cloud:preflight
```

If cloud preflight fails and you want bootstrap queued:

```powershell
cmd /c npm run cloud:recover:test
```

## 2) Static quality gates

```powershell
cmd /c npm run lint:turbo
cmd /c npm run type-check:turbo
```

## 3) Runtime readiness checks

```powershell
node scripts/tools/prod_readiness_check.cjs
node scripts/tools/cloud_preflight.cjs --dispatch
```

## 4) Bridge and heartbeat verification

```powershell
node scripts/tools/query_heartbeats.js
node scripts/tools/audit_bridge.cjs
```

## 5) Launch and health assertion

```powershell
.\matrix.bat cloud-on
.\matrix.bat cloud-preflight-recover
```

Validate online state from hub dashboard (`launchers/matrix_hub.ps1`) and ensure:

- `Cloud Node` heartbeat age < 300s
- `Cloud Bridge` status = `ACTIVE` or `STALE`
- Services report `ONLINE` consistently for Reflect/Nexus/Ghost/Rocket/Citadel

## 6) Regression guardrails

- Never hardcode Supabase keys/tokens in scripts.
- Prefer `.env` (`SUPABASE_URL`, `SUPABASE_KEY`, `GITHUB_TOKEN`, `GITHUB_REPO`).
- Keep health paths aligned across orchestrator + app endpoints.
- Any failing gate blocks release until remediated.

