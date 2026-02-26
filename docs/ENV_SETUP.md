# Environment Bootstrap and Validation

## Commands
- Generate env templates:
```bash
npm run env:bootstrap
```
- Regenerate/overwrite templates:
```bash
npm run env:bootstrap:force
```
- Validate required production variables:
```bash
npm run env:check
```

## Notes
- `env:bootstrap` writes templates only when missing.
- Use `env:bootstrap:force` to regenerate all templates.
- `env:check` reads process env plus root `.env*` files and exits non-zero if required vars are missing.

## Generated templates
- Root: `.env.example`
- Apps:
  - `apps/reflect/.env.example`
  - `apps/nexus/.env.example`
  - `apps/citadel/.env.example`
  - `apps/rocket-command/.env.example`
  - `apps/ghost-command/.env.example`

## Required production variables (checked)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SENTRY_DSN_NEXTJS`
- `SENTRY_DSN_NODE`
- `REDIS_URL`

## Optional production variable
- `CDN_ASSET_PREFIX`
- Optional Cloudflare configuration guide: `docs/CLOUDFLARE_CDN_SETUP.md`
