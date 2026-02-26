export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { initSentryLikeGuardrails, recordMetric } = await import("@matrix-lib/observability");
  const sentryDsn = process.env.SENTRY_DSN_NODE || process.env.SENTRY_DSN || process.env.SENTRY_DSN_NEXTJS;
  const sentry = initSentryLikeGuardrails(sentryDsn);
  recordMetric("app.bootstrap", 1, {
    app: "ghost-command",
    sentry: sentry.enabled ? "enabled" : "disabled"
  });
}
