# Production Enablement

## Implemented in codebase
- Turbo CI workflow: `.github/workflows/ci-turbo.yml`
- CDN asset prefix wiring in all app Next configs via `CDN_ASSET_PREFIX`
- Static asset cache headers for `/_next/static/*` in all app Next configs
- Redis cache backend support in `@matrix-lib/cache`
- Sentry readiness helper in `@matrix-lib/observability`
- Runtime startup integration in all apps via `src/instrumentation.ts`:
  - `configureRedisCacheFromEnv(process.env)`
  - `initSentryLikeGuardrails(process.env.SENTRY_DSN_NODE || process.env.SENTRY_DSN || process.env.SENTRY_DSN_NEXTJS)`
  - bootstrap metric emission per app

## Commands
- Bootstrap env templates:
```bash
npm run env:bootstrap
```
- Validate required env variables:
```bash
npm run env:check
```
- Validate turbopack scripts:
```bash
npm run turbopack:validate
```
- Check Redis connection:
```bash
npm run cache:redis:check
```
- Full production readiness check:
```bash
npm run prod:readiness
```
- One-command full verification:
```bash
npm run verify:all
```
- Ops Autopilot:
```bash
npm run ops:autopilot
npm run ops:autopilot:heal
npm run ops:daemon
```

## Required env vars for full-green readiness
- `REDIS_URL`
- `SENTRY_DSN_NEXTJS`
- `SENTRY_DSN_NODE`
- `SENTRY_DSN` (optional legacy fallback)

## Optional env var
- `CDN_ASSET_PREFIX` (recommended for static asset acceleration)
- Cloudflare setup guide: `docs/CLOUDFLARE_CDN_SETUP.md`

## Notes
- `prod:readiness` returns non-zero until required env vars/services are available.
- Redis and Sentry are wired as optional guardrailed integrations and fail safely when unset.
- GitHub manual gate available:
  - `.github/workflows/prod-readiness.yml`
- Ops Autopilot guide:
  - `docs/OPS_AUTOPILOT.md`
