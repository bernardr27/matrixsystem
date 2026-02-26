#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const APPS = [
  { name: "reflect", pkg: "apps/reflect/package.json", expectedPort: "3000" },
  { name: "nexus", pkg: "apps/nexus/package.json", expectedPort: "3001" },
  { name: "citadel", pkg: "apps/citadel/package.json", expectedPort: "3005" },
  { name: "rocket-command-pro", pkg: "apps/rocket-command/package.json", expectedPort: "4000" },
  { name: "ghost-command", pkg: "apps/ghost-command/package.json", expectedPort: "5173" }
];

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf8"));
}

function validateDevScript(script, expectedPort) {
  const hasTurbo = script.includes("--turbopack");
  const hasPort = script.includes(`-p ${expectedPort}`) || script.includes(`--port ${expectedPort}`);
  const hasHost = script.includes("-H 0.0.0.0") || script.includes("--hostname 0.0.0.0");
  const ok = hasTurbo && hasPort && hasHost;
  const reasons = [];
  if (!hasTurbo) reasons.push("missing --turbopack");
  if (!hasPort) reasons.push(`missing port ${expectedPort}`);
  if (!hasHost) reasons.push("missing host 0.0.0.0");
  return { ok, reason: ok ? "ok" : reasons.join(", ") };
}

function main() {
  const checks = APPS.map((app) => {
    const pkg = readJson(app.pkg);
    const dev = (pkg.scripts && pkg.scripts.dev) || "";
    const status = validateDevScript(dev, app.expectedPort);
    return { app: app.name, dev, ...status };
  });

  const ok = checks.every((x) => x.ok);
  console.log(JSON.stringify({ ok, checks }, null, 2));
  if (!ok) process.exit(1);
}

main();
