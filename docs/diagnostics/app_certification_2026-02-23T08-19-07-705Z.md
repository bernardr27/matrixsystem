# App Certification Report

- Timestamp: 2026-02-23T08:19:07.705Z
- Overall: NOT CERTIFIED
- App Target: reflect,citadel,rocket
- Policy: quick-ultra-with-targeted-retry
- Ops Gate: warning-only
- Warnings: 1

## Per-App Verdict

- reflect: FAILED (0/2 mobile checks passed)
- citadel: FAILED (0/2 mobile checks passed)
- rocket: FAILED (0/2 mobile checks passed)

## Warnings

- Ops autopilot is degraded (services)

## Remediation

- Ultra pass failed apps: reflect, citadel, rocket
- Deep retry still failed: reflect, citadel, rocket. Running stabilization pass.

## Legacy Standards

- APP_VALIDATION_CHECKLIST.md: 0/296 (0%)
- APP_VALIDATION_TEST_REPORT.md: 54/66 (81.8%)
- APP_VALIDATION_FINAL_ASSESSMENT.md: 0/43 (0%)
- docs/archive/VERIFICATION_REPORT.md: found (no checklist boxes)
- get_started/AI_APP_DEV_BLUEPRINT.md: found (no checklist boxes)

## Inputs

- Mobile verifier: docs/diagnostics/mobile_verify_matrix_fast_latest.json
- Ops autopilot: docs/diagnostics/ops_autopilot_latest.json
- Protocol: docs/APP_CERTIFICATION_PROTOCOL.md
- Standards map: docs/CERTIFICATION_STANDARDS_MAP.md
- Failures: docs/diagnostics/app_certification_failures_latest.json
