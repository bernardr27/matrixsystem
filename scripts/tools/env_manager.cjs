#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const ROOT = process.cwd();
const APPS = [
  { name: "reflect", dir: "apps/reflect", port: 3000 },
  { name: "nexus", dir: "apps/nexus", port: 3001 },
  { name: "citadel", dir: "apps/citadel", port: 3005 },
  { name: "rocket-command", dir: "apps/rocket-command", port: 4000 },
  { name: "ghost-command", dir: "apps/ghost-command", port: 5173 }
];

const REQUIRED_PROD = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SENTRY_DSN_NEXTJS",
  "SENTRY_DSN_NODE",
  "REDIS_URL"
];

function parseArgs(argv) {
  const args = { cmd: "check", force: false };
  for (const token of argv.slice(2)) {
    if (token === "bootstrap" || token === "check") args.cmd = token;
    if (token === "--force") args.force = true;
  }
  return args;
}

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
    Object.assign(merged, readEnvFile(path.join(ROOT, rel)));
  }
  return merged;
}

function ensureFile(filePath, content, force) {
  if (fs.existsSync(filePath) && !force) return false;
  fs.writeFileSync(filePath, content, "utf8");
  return true;
}

function bootstrap(force) {
  const rootExample = [
    "# Matrix environment template",
    "NEXT_PUBLIC_SUPABASE_URL=",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=",
    "SUPABASE_SERVICE_ROLE_KEY=",
    "SENTRY_DSN_NEXTJS=",
    "SENTRY_DSN_NODE=",
    "SENTRY_DSN=",
    "REDIS_URL=",
    "REDIS_CACHE_PREFIX=matrix:cache:",
    "CDN_ASSET_PREFIX=",
    "OPENAI_API_KEY=",
    "GROQ_API_KEY=",
    ""
  ].join("\n");

  const written = [];
  if (ensureFile(path.join(ROOT, ".env.example"), rootExample, force)) {
    written.push(".env.example");
  }

  for (const app of APPS) {
    const appExample = [
      `# ${app.name} app env template`,
      `PORT=${app.port}`,
      "NEXT_PUBLIC_SUPABASE_URL=",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY=",
      "SUPABASE_SERVICE_ROLE_KEY=",
      "SENTRY_DSN_NEXTJS=",
      "SENTRY_DSN_NODE=",
      "SENTRY_DSN=",
      "REDIS_URL=",
      "REDIS_CACHE_PREFIX=matrix:cache:",
      "CDN_ASSET_PREFIX=",
      ""
    ].join("\n");

    const rel = path.join(app.dir, ".env.example");
    if (ensureFile(path.join(ROOT, rel), appExample, force)) {
      written.push(rel.replace(/\\/g, "/"));
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: "bootstrap",
        force,
        files_written: written
      },
      null,
      2
    )
  );
}

function check() {
  const env = mergeEnvSources();
  const missing = REQUIRED_PROD.filter((k) => !String(env[k] || "").trim());
  const checks = Object.fromEntries(
    REQUIRED_PROD.map((k) => [k, String(env[k] || "").trim() ? "present" : "missing"])
  );

  const ok = missing.length === 0;
  console.log(
    JSON.stringify(
      {
        ok,
        action: "check",
        checks,
        missing
      },
      null,
      2
    )
  );
  if (!ok) process.exit(1);
}

function main() {
  const args = parseArgs(process.argv);
  if (args.cmd === "bootstrap") {
    bootstrap(args.force);
    return;
  }
  check();
}

main();
