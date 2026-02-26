#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DIAG_DIR = path.join(ROOT, 'docs', 'diagnostics');

function parseArgs() {
  const args = { maxAttempts: 3, full: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--full') args.full = true;
    if (arg.startsWith('--max-attempts=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value >= 1 && value <= 10) args.maxAttempts = value;
    }
  }
  return args;
}

function runNodeScript(script, params = [], timeoutMs = 900000) {
  return new Promise((resolve) => {
    execFile(process.execPath, [path.join(ROOT, script), ...params], {
      cwd: ROOT,
      timeout: timeoutMs,
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024
    }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        code: error && typeof error.code === 'number' ? error.code : 0,
        stdout: String(stdout || '').trim(),
        stderr: String(stderr || '').trim()
      });
    });
  });
}

function readLatestCertification() {
  const latest = path.join(DIAG_DIR, 'app_certification_latest.json');
  if (!fs.existsSync(latest)) return null;
  try {
    return JSON.parse(fs.readFileSync(latest, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  const args = parseArgs();
  fs.mkdirSync(DIAG_DIR, { recursive: true });

  const runs = [];
  const startedAt = new Date().toISOString();

  const initialParams = ['--app=all'];
  if (args.full) initialParams.push('--full');
  const initial = await runNodeScript('scripts/tools/app_certification.cjs', initialParams, 900000);
  const latestAfterInitial = readLatestCertification();
  runs.push({
    stage: 'initial',
    command: `app_certification ${initialParams.join(' ')}`,
    code: initial.code,
    ok: !!(latestAfterInitial && latestAfterInitial.ok),
    app: latestAfterInitial ? latestAfterInitial.app : 'unknown'
  });

  let current = latestAfterInitial;
  let attempt = 0;
  while (attempt < args.maxAttempts && current && !current.ok) {
    const hasFailures = Array.isArray(current.failures) && current.failures.length > 0;
    if (!hasFailures) break;
    attempt += 1;

    const retryParams = ['--failed-only'];
    if (args.full) retryParams.push('--full');
    const retry = await runNodeScript('scripts/tools/app_certification.cjs', retryParams, 900000);
    current = readLatestCertification();
    runs.push({
      stage: `retry_${attempt}`,
      command: `app_certification ${retryParams.join(' ')}`,
      code: retry.code,
      ok: !!(current && current.ok),
      app: current ? current.app : 'unknown'
    });
  }

  const final = readLatestCertification();
  const report = {
    ok: !!(final && final.ok),
    startedAt,
    finishedAt: new Date().toISOString(),
    maxAttempts: args.maxAttempts,
    attemptsUsed: runs.length,
    runs,
    finalArtifacts: {
      latestCertification: 'docs/diagnostics/app_certification_latest.json',
      latestFailures: 'docs/diagnostics/app_certification_failures_latest.json'
    }
  };

  const ts = new Date().toISOString().replace(/[.:]/g, '-');
  const out = path.join(DIAG_DIR, `certify_rapid_${ts}.json`);
  const latest = path.join(DIAG_DIR, 'certify_rapid_latest.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  fs.writeFileSync(latest, JSON.stringify(report, null, 2));

  console.log(JSON.stringify({
    ok: report.ok,
    attemptsUsed: report.attemptsUsed,
    out: path.relative(ROOT, out),
    latest: path.relative(ROOT, latest)
  }, null, 2));

  process.exit(report.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});

