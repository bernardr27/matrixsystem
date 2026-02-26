#!/usr/bin/env node
const process = require("process");
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

function mergedEnv() {
  const env = { ...process.env };
  const root = process.cwd();
  const files = [".env", ".env.local", ".env.production", ".env.production.local"];
  for (const f of files) {
    Object.assign(env, readEnvFile(path.join(root, f)));
  }
  return env;
}

async function main() {
  const env = mergedEnv();
  const url = env.REDIS_URL;
  if (!url) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          reason: "REDIS_URL is not set",
          action: "Set REDIS_URL and rerun"
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  try {
    const redis = await import("redis");
    const client = redis.createClient({ url });
    await client.connect();
    const pong = await client.ping();
    await client.quit();

    console.log(
      JSON.stringify(
        {
          ok: true,
          ping: pong,
          url_host: new URL(url).host
        },
        null,
        2
      )
    );
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          reason: error instanceof Error ? error.message : String(error)
        },
        null,
        2
      )
    );
    process.exit(1);
  }
}

main();
