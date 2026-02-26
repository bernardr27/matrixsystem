# Redis Cache Setup

## What Exists
- Shared cache library supports:
  - in-memory cache fallback
  - Redis backend when `REDIS_URL` is set
- Source: `libs/matrix-lib/cache/src/index.ts`

## Environment Variables
- `REDIS_URL` (required for Redis mode)
- `REDIS_CACHE_PREFIX` (optional, default: `matrix:cache:`)

## Runtime Wiring
In app startup/server bootstrap:

```ts
import { configureRedisCacheFromEnv } from "@matrix-lib/cache";

const cacheState = await configureRedisCacheFromEnv(process.env);
console.log(cacheState.reason);
```

## Health Check
Run:

```bash
npm run cache:redis:check
```

This pings Redis and prints JSON status.

## Production Notes
- Provision Redis service first (Upstash/Elasticache/Redis Cloud/self-hosted).
- Ensure private networking or TLS configuration for hosted environments.
- Keep `REDIS_URL` in secrets manager, not committed files.
