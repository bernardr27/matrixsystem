# Certification Standards Map

## Adopted Into Active Pipeline

These files are now consumed by `scripts/tools/app_certification.cjs` as legacy standards:
- `APP_VALIDATION_CHECKLIST.md`
- `APP_VALIDATION_TEST_REPORT.md`
- `APP_VALIDATION_FINAL_ASSESSMENT.md`
- `docs/archive/VERIFICATION_REPORT.md`
- `get_started/AI_APP_DEV_BLUEPRINT.md`

Implementation:
- checklist completion stats are parsed and added to certification JSON/MD reports under `legacyDocs`.
- protocol/gate model is defined in `docs/APP_CERTIFICATION_PROTOCOL.md`.

## Active Automation Sources

- Mobile certification runtime:
  - `scripts/tools/mobile_verify_matrix_fast.cjs`
- App certification orchestrator:
  - `scripts/tools/app_certification.cjs`
- Ops/health verification:
  - `scripts/tools/ops_autopilot.cjs`

## Policy Upgrades Implemented

- Quick certification now runs:
  - ultra pass first
  - targeted deep retry only for failed apps
- Ops health is warning-only by default (`requireOpsHealthy: false`), while mobile pass remains required.

## Reference-Only (Not Directly Parsed)

These contain useful context but are not used as machine-readable certification inputs:
- `docs/audits/*.md`
- `brain share/brains/**/mobile_audit.md`
- `brain share/brains/**/error_audit.md`
- `docs/archive/Restoring Nexus Stability.md`

Reason: highly session-specific or narrative format; not stable checklist schema.

