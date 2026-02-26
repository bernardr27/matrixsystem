# App Certification Protocol

## Purpose
Unified certification flow for all Matrix apps:
- `reflect`
- `nexus`
- `ghost-command`
- `citadel`
- `rocket-command`

This protocol upgrades and consolidates standards from:
- `APP_VALIDATION_CHECKLIST.md`
- `APP_VALIDATION_TEST_REPORT.md`
- `APP_VALIDATION_FINAL_ASSESSMENT.md`
- `docs/archive/VERIFICATION_REPORT.md`
- `get_started/AI_APP_DEV_BLUEPRINT.md`

## Certification Gates

### Gate 1: Mobile Route Reliability
- Run `npm run mobile:verify:matrix:ultra`
- Requirement: zero client exceptions, zero route 404s, no fatal console errors on critical route per app.
- Fast retry policy: automatically deep-retest only failed apps.

### Gate 2: Health and Runtime Signals
- Run `npm run ops:autopilot:quick`
- Requirement: telemetry and health checks recorded for all apps.
- Policy: ops degradation is currently warning-only unless promoted to blocking in script policy.

### Gate 3: Offline/Online Behavior Contracts
- Validate behavior from legacy checklists:
  - clear offline indicators
  - graceful disabled actions when telemetry unavailable
  - no silent failures
  - safe fallback/mock states where required

### Gate 4: UI Safety Baseline (Mobile)
- Touch targets should meet 44x44 baseline on key interactions.
- Text should avoid unreadable micro sizes on mobile critical paths.
- No horizontal overflow on primary routes.
- Use in-app debugger audit where available (Ghost `UIDebugger`, Nexus `DebugOverlay`).

### Gate 5: App-Specific Critical Paths
- Reflect: session/auth/setup routes.
- Nexus: dashboard/diagnostics/settings.
- Ghost: home/vault or equivalent command/ops path.
- Citadel: home/dashboard.
- Rocket: home/operations.

## Execution Modes

### Quick Certification (Default)
- `npm run certify:apps:quick`
- Behavior:
  - ultra mobile sweep first
  - targeted deep retry only for failed apps
  - ops quick check
  - generates machine + markdown reports

### Full Certification
- `npm run certify:apps:full`
- Behavior:
  - non-ultra route verification
  - full ops check
  - same report artifacts

## Artifacts
- `docs/diagnostics/app_certification_latest.json`
- `docs/diagnostics/app_certification_latest.md`
- `docs/diagnostics/mobile_verify_matrix_fast_latest.json`
- `docs/diagnostics/ops_autopilot_latest.json`

## Report Policy
- Current default: **mobile pass is required**, ops degradation is warning-only.
- To make ops blocking, set `requireOpsHealthy: true` in `scripts/tools/app_certification.cjs`.

