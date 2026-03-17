# Runtime Profiles

Matrix now supports explicit runtime profiles for predictable behavior:

- `dev`
- `local-prod`
- `cloud-prod`

Resolution order:
1. `MATRIX_PROFILE` (if set)
2. Derived from `MATRIX_MODE` + `MATRIX_CLOUD_MODE`

## Examples
- `MATRIX_PROFILE=dev`
- `MATRIX_PROFILE=local-prod`
- `MATRIX_PROFILE=cloud-prod`

## Current Consumers
- `scripts/tools/cloud_preflight.cjs`
- `scripts/tools/ops_autopilot.cjs`

## Why
- Prevent hidden environment branching.
- Keep production requirements strict while preserving local developer ergonomics.
