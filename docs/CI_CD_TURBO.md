# CI/CD Turbo Pipeline

## Workflow
- File: `.github/workflows/ci-turbo.yml`
- Triggers:
  - pull requests
  - pushes to `main`, `master`, `develop`
- Stages:
  1. `npm ci`
  2. `npm run lint:turbo`
  3. `npm run type-check:turbo`
  4. `npm run test:turbo`
  5. `npm run build:turbo`

## Caching
- Uses npm cache via `actions/setup-node`.
- Uses Turbo local cache via `actions/cache` on:
  - `.turbo`
  - `apps/*/.turbo`
  - `libs/*/.turbo`

## Optional Remote Turbo Cache
Set repository secrets to enable remote cache:
- `TURBO_TOKEN`
- `TURBO_TEAM`

If unset, workflow still runs using local cache only.

## Production Gate Workflow
- File: `.github/workflows/prod-readiness.yml`
- Trigger: manual (`workflow_dispatch`)
- Validates:
  - `npm run env:check`
  - `npm run prod:readiness` (strict mode)
- Expected repository secrets:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SENTRY_DSN_NEXTJS`
  - `SENTRY_DSN_NODE`
  - `SENTRY_DSN` (optional legacy fallback)
  - `REDIS_URL`
  - `CDN_ASSET_PREFIX` (optional)
