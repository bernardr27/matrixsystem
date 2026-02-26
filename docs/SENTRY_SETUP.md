# Sentry Rollout Plan (Optional)

This repo now exposes observability helpers in `@matrix-lib/observability`.

## Fast Integration

1. Set env var per app:
- `SENTRY_DSN_NEXTJS` (preferred for Next.js surface)
- `SENTRY_DSN_NODE` (preferred for Node/runtime surface)
- `SENTRY_DSN` (legacy fallback)

2. In app bootstrap, call:

```ts
import { initSentryLikeGuardrails } from '@matrix-lib/observability';

const sentry = initSentryLikeGuardrails(
  process.env.SENTRY_DSN_NODE || process.env.SENTRY_DSN || process.env.SENTRY_DSN_NEXTJS
);
console.log(sentry.reason);
```

3. Keep disabled in local/dev when no DSN is present.

## Notes

- This keeps baseline safe without forcing external vendor coupling.
- Swap helper with full Sentry SDK initialization when DSN + project policy is approved.
