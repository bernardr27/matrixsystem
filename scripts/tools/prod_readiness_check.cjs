#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    return dotenv.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function mergeEnvSources() {
  const merged = { ...process.env };
  const rootEnvFiles = [".env", ".env.local", ".env.production", ".env.production.local"];
  for (const rel of rootEnvFiles) {
    Object.assign(merged, readEnvFile(path.join(process.cwd(), rel)));
  }
  return merged;
}

async function checkRedis(url) {
  if (!url) return { ok: false, reason: "REDIS_URL missing" };
  try {
    const redis = await import("redis");
    const client = redis.createClient({ url });
    await client.connect();
    const pong = await client.ping();
    await client.quit();
    return { ok: true, reason: `Redis ping=${pong}` };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error)
    };
  }
}

function checkCdn(prefix) {
  if (!prefix) return { ok: true, reason: "CDN_ASSET_PREFIX not set (optional)" };
  try {
    const parsed = new URL(prefix);
    return { ok: true, reason: `CDN host=${parsed.host}` };
  } catch {
    return { ok: false, reason: "CDN_ASSET_PREFIX is not a valid URL" };
  }
}

function validDsn(dsn) {
  return Boolean(dsn) && /^https?:\/\//.test(String(dsn));
}

function checkSentry(env) {
  const nextDsn = env.SENTRY_DSN_NEXTJS || "";
  const nodeDsn = env.SENTRY_DSN_NODE || "";
  const legacyDsn = env.SENTRY_DSN || "";

  const nextOk = validDsn(nextDsn) || validDsn(legacyDsn);
  const nodeOk = validDsn(nodeDsn) || validDsn(legacyDsn);

  if (nextOk && nodeOk) {
    return { ok: true, reason: "Sentry DSNs present (nextjs/node)" };
  }

  const missing = [];
  if (!nextOk) missing.push("SENTRY_DSN_NEXTJS");
  if (!nodeOk) missing.push("SENTRY_DSN_NODE");
  return { ok: false, reason: `Missing/invalid ${missing.join(", ")}` };
}

function checkWorkflow() {
  const wf = path.join(process.cwd(), ".github", "workflows", "ci-turbo.yml");
  return fs.existsSync(wf)
    ? { ok: true, reason: "ci-turbo workflow present" }
    : { ok: false, reason: "ci-turbo workflow missing" };
}

async function main() {
  const env = mergeEnvSources();
  const checks = {
    ci_cd: checkWorkflow(),
    sentry: checkSentry(env),
    cdn: checkCdn(env.CDN_ASSET_PREFIX),
    redis: await checkRedis(env.REDIS_URL)
  };

  const allOk = Object.values(checks).every((x) => x.ok);
  console.log(
    JSON.stringify(
      {
        ok: allOk,
        checks
      },
      null,
      2
    )
  );

  if (!allOk) process.exit(1);
}

main();
