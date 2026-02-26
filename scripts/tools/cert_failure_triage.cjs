#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DIAG_DIR = path.join(ROOT, 'docs', 'diagnostics');

function readJson(relPath) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch {
    return null;
  }
}

function reasonFor(f) {
  if (f.navError) return 'Server/route not reachable';
  if (f.has404) return 'Route not found';
  if (f.hasClientException) return 'Client runtime exception';
  return 'Potential console/runtime error';
}

function buildMarkdown(payload) {
  const lines = [];
  lines.push('# Certification Failure Triage');
  lines.push('');
  lines.push(`- Timestamp: ${new Date().toISOString()}`);
  lines.push(`- Source: docs/diagnostics/app_certification_failures_latest.json`);
  lines.push('');

  if (!Array.isArray(payload) || payload.length === 0) {
    lines.push('No failed apps detected.');
    return `${lines.join('\n')}\n`;
  }

  for (const appEntry of payload) {
    lines.push(`## ${appEntry.app}`);
    lines.push('');
    for (const failure of appEntry.failures || []) {
      lines.push(`- ${failure.name}: ${reasonFor(failure)}`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function main() {
  const failures = readJson('docs/diagnostics/app_certification_failures_latest.json') || [];
  const ts = new Date().toISOString().replace(/[.:]/g, '-');
  const outJson = path.join(DIAG_DIR, `cert_failure_triage_${ts}.json`);
  const outMd = path.join(DIAG_DIR, `cert_failure_triage_${ts}.md`);
  const latestJson = path.join(DIAG_DIR, 'cert_failure_triage_latest.json');
  const latestMd = path.join(DIAG_DIR, 'cert_failure_triage_latest.md');

  const triage = Array.isArray(failures)
    ? failures.map((appEntry) => ({
        app: appEntry.app,
        items: (appEntry.failures || []).map((f) => ({
          name: f.name,
          reason: reasonFor(f),
          details: {
            status: f.status ?? null,
            navError: f.navError || null,
            hasClientException: !!f.hasClientException,
            has404: !!f.has404
          }
        }))
      }))
    : [];

  fs.writeFileSync(outJson, JSON.stringify(triage, null, 2));
  fs.writeFileSync(outMd, buildMarkdown(failures));
  fs.writeFileSync(latestJson, JSON.stringify(triage, null, 2));
  fs.writeFileSync(latestMd, buildMarkdown(failures));

  console.log(JSON.stringify({
    ok: true,
    apps: triage.length,
    out: path.relative(ROOT, outJson),
    latest: path.relative(ROOT, latestJson)
  }, null, 2));
}

main();

