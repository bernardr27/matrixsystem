# Ops Autopilot

Ops Autopilot is the Matrix self-healing workflow for remote/mobile operations.

## What it does
- Checks app health endpoints (`reflect`, `nexus`, `ghost`, `citadel`).
- Checks Supabase and Redis connectivity.
- Runs environment and production-readiness checks.
- Optionally runs lint remediation (`eslint --fix` through workspace lint scripts).
- Writes run artifacts to `docs/diagnostics/ops_autopilot_*.json` and `docs/diagnostics/ops_autopilot_latest.json`.

## Commands
- One-time check:
```bash
npm run ops:autopilot
```
- One-time heal pass:
```bash
npm run ops:autopilot:heal
```
- Fast heal pass (skips heavy lint stage):
```bash
npm run ops:autopilot:quick
```
- One-shot emergency recover trigger:
```bash
npm run ops:recover
```
- Continuous daemon:
```bash
npm run ops:daemon
```
- Weekly maintenance sequence:
```bash
npm run ops:maintenance:weekly
```

## Bridge commands
When Sentinel is running, these can be sent through `ghost_bridge`:
- `sys:autopilot` (quick heal)
- `sys:autopilot_full` (full heal)
- `sys:maintenance_window` (pause noncritical services, heal, verify, restart)
- `sys:maintenance_exit` (force maintenance mode off)
- `sys:emergency_recover` (maintenance window + follow-up quick heal)

These are now surfaced in Nexus Diagnostics as the **Ops Autopilot** panel.
The Nexus dashboard header now shows a **Maintenance Active** badge when maintenance is running.

## Chat shortcuts
- Telegram:
  - `/autopilot`
  - `/autopilotfull`
  - `/maintenance`
  - `/maintoff`
  - `/recover`
- Discord:
  - `!autopilot`
  - `!autopilotfull`
  - `!maintenance`
  - `!maintoff`
  - `!recover`

## Mobile workflow
1. Open Nexus on mobile.
2. Go to `/diagnostics`.
3. Run `Quick Heal` for immediate recovery.
4. Run `Full Heal` for deeper lint/readiness remediation.
5. Review latest score and failed checks from run history.

## Notes
- `ops:autopilot` exits non-zero when any critical checks fail.
- `ops:autopilot:quick` is optimized for live recovery and faster response.
- Use `launchers/autopilot.bat` for local long-running unattended mode.
- Sentinel now runs an internal auto-heal loop every 5 minutes when degradation is detected.
- Disable Sentinel auto-heal by setting `MATRIX_AUTO_HEAL=0`.
