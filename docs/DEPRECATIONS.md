# Deprecations

This file tracks legacy operational paths and their canonical replacements.

## Active Deprecations
- `launchers/matrix_hub_v7.ps1`
  - Replacement: `launchers/matrix_hub.ps1`
- `scripts/tools/nexus_doctor.js`
  - Replacement: `npm run ops:autopilot:quick`
  - Archived implementation: `scripts/archive/legacy-tools/nexus_doctor.js`
- `scripts/tools/matrix_audit.js`
  - Replacement: `npm run cloud:preflight` or `npm run ops:autopilot:quick`
  - Archived implementation: `scripts/archive/legacy-tools/matrix_audit.js`
- `scripts/tools/query_heartbeats.js`
  - Replacement: `npm run diag:heartbeat`
- `scripts/tools/diagnose_nexus.js`
  - Replacement: `npm run diag:heartbeat`

## Policy
- Deprecated tools may remain temporarily for compatibility.
- New operational features must land only in canonical runtime paths.
- Deprecated tools should emit warnings on execution.
- Use `npm run diag:schema` during migration to ensure deprecations are not sending non-canonical commands.
