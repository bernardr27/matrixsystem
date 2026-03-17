# App Certification Report

- Timestamp: 2026-03-07T11:04:28.651Z
- Overall: NOT CERTIFIED
- App Target: all
- Policy: quick-ultra-with-targeted-retry
- Ops Gate: warning-only
- Warnings: 1

## Per-App Verdict

- reflect: FAILED (0/2 mobile checks passed)
- nexus: CERTIFIED (1/1 mobile checks passed)
- citadel: CERTIFIED (1/1 mobile checks passed)
- ghost: FAILED (1/2 mobile checks passed)
- rocket: CERTIFIED (1/1 mobile checks passed)

## Warnings

- Ops autopilot is degraded (services)

## Remediation

- Ultra pass failed apps: reflect, ghost
- Deep retry still failed: reflect, ghost. Running stabilization pass.

## Legacy Standards

- APP_VALIDATION_CHECKLIST.md: missing
- APP_VALIDATION_TEST_REPORT.md: missing
- APP_VALIDATION_FINAL_ASSESSMENT.md: missing
- docs/archive/VERIFICATION_REPORT.md: found (no checklist boxes)
- get_started/AI_APP_DEV_BLUEPRINT.md: found (no checklist boxes)

## Inputs

- Mobile verifier: docs/diagnostics/mobile_verify_matrix_fast_latest.json
- Ops autopilot: docs/diagnostics/ops_autopilot_latest.json
- Protocol: docs/APP_CERTIFICATION_PROTOCOL.md
- Standards map: docs/CERTIFICATION_STANDARDS_MAP.md
- Failures: docs/diagnostics/app_certification_failures_latest.json
