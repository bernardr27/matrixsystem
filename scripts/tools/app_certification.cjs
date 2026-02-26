#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DIAG_DIR = path.join(ROOT, 'docs', 'diagnostics');
const LEGACY_CERT_DOCS = [
  'APP_VALIDATION_CHECKLIST.md',
  'APP_VALIDATION_TEST_REPORT.md',
  'APP_VALIDATION_FINAL_ASSESSMENT.md',
  'docs/archive/VERIFICATION_REPORT.md',
  'get_started/AI_APP_DEV_BLUEPRINT.md'
];

function parseArgs() {
  const args = { app: 'all', quick: true, failedOnly: false };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--app=')) args.app = arg.split('=')[1];
    if (arg === '--full') args.quick = false;
    if (arg === '--failed-only') args.failedOnly = true;
  }
  return args;
}

function runNodeScript(script, params = [], timeoutMs = 900000) {
  return new Promise((resolve) => {
    execFile(process.execPath, [path.join(ROOT, script), ...params], {
      cwd: ROOT,
      timeout: timeoutMs,
      windowsHide: true,
      maxBuffer: 12 * 1024 * 1024
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

async function runMobileVerifierFresh(params = [], timeoutMs = 900000) {
  const jsonAttempt = await runNodeScript('scripts/tools/mobile_verify_matrix_fast.cjs', [...params, '--json'], timeoutMs);
  if (jsonAttempt.stdout) {
    try {
      const parsed = JSON.parse(jsonAttempt.stdout);
      if (parsed && parsed.summary) return parsed;
    } catch {
      // Fall through to non-json run.
    }
  }

  // Fallback: run again without --json to force-write latest report, then read it.
  await runNodeScript('scripts/tools/mobile_verify_matrix_fast.cjs', params, timeoutMs);
  return safeReadJson(path.join(DIAG_DIR, 'mobile_verify_matrix_fast_latest.json'));
}

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function summarizeByApp(results = []) {
  const buckets = {};
  for (const item of results) {
    const app = String(item.name || '').split('_')[0] || 'unknown';
    if (!buckets[app]) buckets[app] = { app, total: 0, passed: 0, failed: 0, failures: [] };
    buckets[app].total += 1;
    if (item.ok) buckets[app].passed += 1;
    else {
      buckets[app].failed += 1;
      buckets[app].failures.push({
        name: item.name,
        status: item.responseStatus,
        navError: item.navError || null,
        hasClientException: !!item.hasClientException,
        has404: !!item.has404
      });
    }
  }
  return Object.values(buckets);
}

function mergeResults(primary = [], secondary = []) {
  const byName = new Map();
  for (const item of primary) byName.set(item.name, item);
  for (const item of secondary) byName.set(item.name, item);
  return [...byName.values()];
}

function parseChecklistStats(relPath) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    return { file: relPath, exists: false, total: 0, done: 0, pending: 0, completionRate: null };
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const total = (content.match(/-\s*\[[ xX]\]/g) || []).length;
  const done = (content.match(/-\s*\[[xX]\]/g) || []).length;
  const pending = Math.max(0, total - done);
  const completionRate = total > 0 ? Number(((done / total) * 100).toFixed(1)) : null;
  return { file: relPath, exists: true, total, done, pending, completionRate };
}

function resolveFailedAppsFromLatest() {
  const latestFailuresPath = path.join(DIAG_DIR, 'app_certification_failures_latest.json');
  if (!fs.existsSync(latestFailuresPath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(latestFailuresPath, 'utf8'));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => entry && typeof entry.app === 'string' ? entry.app : null)
      .filter(Boolean);
  } catch {
    return [];
  }
}

function toMarkdown(report) {
  const lines = [];
  lines.push('# App Certification Report');
  lines.push('');
  lines.push(`- Timestamp: ${report.finishedAt}`);
  lines.push(`- Overall: ${report.ok ? 'CERTIFIED' : 'NOT CERTIFIED'}`);
  lines.push(`- App Target: ${report.app}`);
  lines.push(`- Policy: ${report.policy.mode}`);
  lines.push(`- Ops Gate: ${report.policy.requireOpsHealthy ? 'required' : 'warning-only'}`);
  if (report.warnings.length > 0) lines.push(`- Warnings: ${report.warnings.length}`);
  lines.push('');
  lines.push('## Per-App Verdict');
  lines.push('');
  for (const app of report.apps) {
    lines.push(`- ${app.app}: ${app.certified ? 'CERTIFIED' : 'FAILED'} (${app.passed}/${app.total} mobile checks passed)`);
  }
  if (report.warnings.length > 0) {
    lines.push('');
    lines.push('## Warnings');
    lines.push('');
    for (const warning of report.warnings) lines.push(`- ${warning}`);
  }
  if (report.remediation && report.remediation.length > 0) {
    lines.push('');
    lines.push('## Remediation');
    lines.push('');
    for (const item of report.remediation) lines.push(`- ${item}`);
  }
  lines.push('');
  lines.push('## Legacy Standards');
  lines.push('');
  for (const doc of report.legacyDocs) {
    if (!doc.exists) {
      lines.push(`- ${doc.file}: missing`);
    } else if (doc.completionRate === null) {
      lines.push(`- ${doc.file}: found (no checklist boxes)`);
    } else {
      lines.push(`- ${doc.file}: ${doc.done}/${doc.total} (${doc.completionRate}%)`);
    }
  }
  lines.push('');
  lines.push('## Inputs');
  lines.push('');
  lines.push(`- Mobile verifier: ${report.artifacts.mobile}`);
  lines.push(`- Ops autopilot: ${report.artifacts.ops}`);
  lines.push(`- Protocol: ${report.artifacts.protocol}`);
  lines.push(`- Standards map: ${report.artifacts.standardsMap}`);
  lines.push(`- Failures: ${report.artifacts.failures}`);
  return `${lines.join('\n')}\n`;
}

async function main() {
  const args = parseArgs();
  fs.mkdirSync(DIAG_DIR, { recursive: true });

  if (args.failedOnly) {
    const failedApps = resolveFailedAppsFromLatest();
    if (failedApps.length === 0) {
      const emptyReport = {
        ok: true,
        app: 'failed-only',
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        mode: args.quick ? 'quick-ultra-with-targeted-retry' : 'full',
        policy: { mode: args.quick ? 'quick-ultra-with-targeted-retry' : 'full', requireOpsHealthy: false },
        warnings: [],
        remediation: ['No previously failed apps found in app_certification_failures_latest.json'],
        mobilePasses: [],
        apps: [],
        failures: [],
        legacyDocs: LEGACY_CERT_DOCS.map(parseChecklistStats),
        mobileSummary: null,
        opsSummary: null,
        artifacts: {
          mobile: 'docs/diagnostics/mobile_verify_matrix_fast_latest.json',
          ops: 'docs/diagnostics/ops_autopilot_latest.json',
          protocol: 'docs/APP_CERTIFICATION_PROTOCOL.md',
          standardsMap: 'docs/CERTIFICATION_STANDARDS_MAP.md',
          failures: 'docs/diagnostics/app_certification_failures_latest.json'
        }
      };
      const ts = new Date().toISOString().replace(/[.:]/g, '-');
      const jsonPath = path.join(DIAG_DIR, `app_certification_${ts}.json`);
      const mdPath = path.join(DIAG_DIR, `app_certification_${ts}.md`);
      const failuresPath = path.join(DIAG_DIR, `app_certification_failures_${ts}.json`);
      const latestJson = path.join(DIAG_DIR, 'app_certification_latest.json');
      const latestMd = path.join(DIAG_DIR, 'app_certification_latest.md');
      const latestFailures = path.join(DIAG_DIR, 'app_certification_failures_latest.json');
      fs.writeFileSync(jsonPath, JSON.stringify(emptyReport, null, 2));
      fs.writeFileSync(mdPath, toMarkdown(emptyReport));
      fs.writeFileSync(failuresPath, JSON.stringify([], null, 2));
      fs.writeFileSync(latestJson, JSON.stringify(emptyReport, null, 2));
      fs.writeFileSync(latestMd, toMarkdown(emptyReport));
      fs.writeFileSync(latestFailures, JSON.stringify([], null, 2));
      console.log(JSON.stringify({ ok: true, app: 'failed-only', out: path.relative(ROOT, jsonPath), latest: path.relative(ROOT, latestJson) }, null, 2));
      return;
    }
    args.app = failedApps.join(',');
  }

  const startedAt = new Date().toISOString();
  const mobilePasses = [];
  const remediation = [];

  let baseMobileArgs = [`--app=${args.app}`, '--json'];
  if (args.quick) {
    baseMobileArgs = [`--app=${args.app}`, '--json', '--ultra', '--timeout-ms=15000', '--no-screenshots'];
  }
  const ultraJson = await runMobileVerifierFresh(baseMobileArgs.filter((arg) => arg !== '--json'), 900000);
  if (ultraJson) mobilePasses.push({ stage: args.quick ? 'ultra' : 'base', data: ultraJson });

  let mergedMobile = ultraJson || { summary: null, results: [] };
  if (args.quick && ultraJson && Array.isArray(ultraJson.results)) {
    let failedApps = [...new Set(ultraJson.results.filter((r) => !r.ok).map((r) => String(r.name || '').split('_')[0]).filter(Boolean))];
    if (failedApps.length > 0) {
      remediation.push(`Ultra pass failed apps: ${failedApps.join(', ')}`);
      const deepAppArg = failedApps.join(',');
      const deepJson = await runMobileVerifierFresh(
        [`--app=${deepAppArg}`, '--timeout-ms=45000'],
        900000
      );
      if (deepJson) {
        mobilePasses.push({ stage: 'retry_failed_apps', apps: failedApps, data: deepJson });
        mergedMobile = {
          ...ultraJson,
          summary: {
            ...(ultraJson.summary || {}),
            secondPassApps: failedApps,
            secondPassTotal: deepJson.summary ? deepJson.summary.total : 0
          },
          results: mergeResults(ultraJson.results || [], deepJson.results || [])
        };
        failedApps = [...new Set((mergedMobile.results || []).filter((r) => !r.ok).map((r) => String(r.name || '').split('_')[0]).filter(Boolean))];
      }

      if (failedApps.length > 0) {
        remediation.push(`Deep retry still failed: ${failedApps.join(', ')}. Running stabilization pass.`);
        const stabilizeAppArg = failedApps.join(',');
        const stabilizeJson = await runMobileVerifierFresh(
          [`--app=${stabilizeAppArg}`, '--ultra', '--timeout-ms=20000', '--no-screenshots'],
          900000
        );
        if (stabilizeJson) {
          mobilePasses.push({ stage: 'stabilization_pass', apps: failedApps, data: stabilizeJson });
          mergedMobile = {
            ...mergedMobile,
            summary: {
              ...(mergedMobile.summary || {}),
              stabilizationApps: failedApps,
              stabilizationTotal: stabilizeJson.summary ? stabilizeJson.summary.total : 0
            },
            results: mergeResults(mergedMobile.results || [], stabilizeJson.results || [])
          };
        }
      }
    }
  }

  const opsArgs = args.quick ? ['--quick', '--json'] : ['--json'];
  const ops = await runNodeScript('scripts/tools/ops_autopilot.cjs', opsArgs, 240000);

  const mobileJson = mergedMobile;
  const opsJson = ops.stdout ? JSON.parse(ops.stdout) : safeReadJson(path.join(DIAG_DIR, 'ops_autopilot_latest.json'));

  const perApp = summarizeByApp((mobileJson && mobileJson.results) || []);
  const apps = perApp.map((a) => ({
    ...a,
    certified: a.failed === 0
  }));
  const legacyDocs = LEGACY_CERT_DOCS.map(parseChecklistStats);
  const mobileCertified = apps.length > 0 && apps.every((a) => a.certified);
  const opsHealthy = !!(opsJson && opsJson.ok);
  const warnings = [];
  if (!opsHealthy) {
    const failedChecks = opsJson && opsJson.summary ? (opsJson.summary.failedChecks || []) : [];
    warnings.push(`Ops autopilot is degraded${failedChecks.length > 0 ? ` (${failedChecks.join(', ')})` : ''}`);
  }
  const policy = {
    mode: args.quick ? 'quick-ultra-with-targeted-retry' : 'full',
    requireOpsHealthy: false
  };

  const report = {
    ok: mobileCertified && (!policy.requireOpsHealthy || opsHealthy),
    app: args.app,
    startedAt,
    finishedAt: new Date().toISOString(),
    mode: policy.mode,
    policy,
    warnings,
    remediation,
    mobilePasses: mobilePasses.map((p) => ({
      stage: p.stage,
      apps: p.apps || null,
      summary: p.data && p.data.summary ? p.data.summary : null
    })),
    apps,
    failures: apps
      .filter((a) => !a.certified)
      .map((a) => ({ app: a.app, failures: a.failures })),
    legacyDocs,
    mobileSummary: mobileJson ? mobileJson.summary : null,
    opsSummary: opsJson
      ? { ok: !!opsJson.ok, score: opsJson.summary && opsJson.summary.healthScore, failedChecks: (opsJson.summary && opsJson.summary.failedChecks) || [] }
      : null,
    artifacts: {
      mobile: 'docs/diagnostics/mobile_verify_matrix_fast_latest.json',
      ops: 'docs/diagnostics/ops_autopilot_latest.json',
      protocol: 'docs/APP_CERTIFICATION_PROTOCOL.md',
      standardsMap: 'docs/CERTIFICATION_STANDARDS_MAP.md',
      failures: 'docs/diagnostics/app_certification_failures_latest.json'
    }
  };

  const ts = new Date().toISOString().replace(/[.:]/g, '-');
  const jsonPath = path.join(DIAG_DIR, `app_certification_${ts}.json`);
  const mdPath = path.join(DIAG_DIR, `app_certification_${ts}.md`);
  const failuresPath = path.join(DIAG_DIR, `app_certification_failures_${ts}.json`);
  const latestJson = path.join(DIAG_DIR, 'app_certification_latest.json');
  const latestMd = path.join(DIAG_DIR, 'app_certification_latest.md');
  const latestFailures = path.join(DIAG_DIR, 'app_certification_failures_latest.json');

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(mdPath, toMarkdown(report));
  fs.writeFileSync(failuresPath, JSON.stringify(report.failures, null, 2));
  fs.writeFileSync(latestJson, JSON.stringify(report, null, 2));
  fs.writeFileSync(latestMd, toMarkdown(report));
  fs.writeFileSync(latestFailures, JSON.stringify(report.failures, null, 2));

  console.log(JSON.stringify({
    ok: report.ok,
    app: report.app,
    out: path.relative(ROOT, jsonPath),
    latest: path.relative(ROOT, latestJson)
  }, null, 2));

  process.exit(report.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
