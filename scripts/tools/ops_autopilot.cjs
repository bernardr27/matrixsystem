#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { resolveRuntimeProfile } = require('./runtime_profile.cjs');

const ROOT = path.resolve(__dirname, '..', '..');
const DIAG_DIR = path.join(ROOT, 'docs', 'diagnostics');

function parseArgs(argv) {
  const args = {
    heal: false,
    json: false,
    quick: false,
    fixLint: true,
    restartServices: true,
    strictLint: false,
    timeoutMs: 120000
  };

  for (const arg of argv) {
    if (arg === '--heal') args.heal = true;
    if (arg === '--json') args.json = true;
    if (arg === '--quick') args.quick = true;
    if (arg === '--strict-lint') args.strictLint = true;
    if (arg === '--no-fix-lint') args.fixLint = false;
    if (arg === '--no-restart-services') args.restartServices = false;
    if (arg.startsWith('--timeout-ms=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value >= 1000) args.timeoutMs = value;
    }
  }

  return args;
}

function loadEnv() {
  const files = ['.env', '.env.local', '.env.production', '.env.production.local'];
  for (const rel of files) {
    const full = path.join(ROOT, rel);
    if (fs.existsSync(full)) {
      const parsed = dotenv.parse(fs.readFileSync(full, 'utf8'));
      for (const [k, v] of Object.entries(parsed)) {
        if (!(k in process.env)) process.env[k] = v;
      }
    }
  }
}

function execNodeScript(relPath, args = [], timeoutMs = 60000) {
  return new Promise((resolve) => {
    const scriptPath = path.join(ROOT, relPath);
    const execCmd = process.platform === 'win32' ? `"${process.execPath}"` : process.execPath;
    execFile(execCmd, [scriptPath, ...args], {
      cwd: ROOT,
      timeout: timeoutMs,
      windowsHide: true,
      maxBuffer: 4 * 1024 * 1024,
      shell: process.platform === 'win32'
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

function execNpm(args = [], timeoutMs = 120000) {
  return new Promise((resolve) => {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    execFile(npmCmd, args, {
      cwd: ROOT,
      timeout: timeoutMs,
      windowsHide: true,
      maxBuffer: 8 * 1024 * 1024,
      shell: process.platform === 'win32'
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

async function checkHealthEndpoint(name, url) {
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return {
      name,
      url,
      ok: response.status >= 200 && response.status < 500,
      status: response.status,
      latencyMs: Date.now() - started
    };
  } catch (error) {
    return {
      name,
      url,
      ok: false,
      status: 0,
      latencyMs: Date.now() - started,
      reason: error instanceof Error ? error.message : String(error)
    };
  }
}

async function checkSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { ok: false, reason: 'Supabase env missing (SUPABASE_URL and key)' };
  }

  try {
    const client = createClient(url, key, { auth: { persistSession: false } });
    const started = Date.now();
    const { error } = await client.from('ghost_bridge').select('id').limit(1);
    return {
      ok: !error,
      latencyMs: Date.now() - started,
      reason: error ? error.message : 'Supabase query ok'
    };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

async function checkRedis() {
  const url = process.env.REDIS_URL;
  if (!url) return { ok: false, reason: 'REDIS_URL missing' };

  try {
    const redis = await import('redis');
    const client = redis.createClient({ url });
    const started = Date.now();
    await client.connect();
    const pong = await client.ping();
    await client.quit();
    return { ok: true, latencyMs: Date.now() - started, reason: `Redis ping=${pong}` };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

function summarize(report) {
  const degradedServices = report.checks.services.filter((s) => !s.ok).map((s) => s.name);
  const failedChecks = Object.entries(report.checks)
    .filter(([name, value]) => {
      if (name === 'services') return degradedServices.length > 0;
      if (Array.isArray(value)) return value.some((item) => !item.ok);
      return value && typeof value === 'object' && value.ok === false;
    })
    .map(([name]) => name);

  let score = 100;
  score -= degradedServices.length * 15;
  if (!report.checks.supabase.ok) score -= 20;
  if (report.runtime?.production && !report.checks.redis.ok) score -= 10;
  if (!report.checks.env.ok) score -= 10;
  if (!report.checks.prodReadiness.ok) score -= 15;
  if (!report.checks.lint.ok) score -= 10;

  return {
    healthScore: Math.max(0, score),
    degradedServices,
    failedChecks
  };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  loadEnv();
  fs.mkdirSync(DIAG_DIR, { recursive: true });

  const report = {
    ok: true,
    mode: args.heal ? 'heal' : 'check',
    startedAt: new Date().toISOString(),
    runtime: resolveRuntimeProfile(process.env),
    checks: {
      services: [],
      supabase: { ok: false, reason: 'not_run' },
      redis: { ok: false, reason: 'not_run' },
      env: { ok: false, reason: 'not_run' },
      prodReadiness: { ok: false, reason: 'not_run' },
      lint: { ok: false, reason: 'not_run' }
    },
    actions: [],
    artifacts: []
  };

  const targets = [
    { name: 'reflect', url: 'http://127.0.0.1:3000/api/health' },
    { name: 'nexus', url: 'http://127.0.0.1:3001/api/health' },
    { name: 'ghost', url: 'http://127.0.0.1:5173/api/health' },
    { name: 'citadel', url: 'http://127.0.0.1:3005/api/health' }
  ];

  report.checks.services = await Promise.all(targets.map((t) => checkHealthEndpoint(t.name, t.url)));
  report.checks.supabase = await checkSupabase();
  report.checks.redis = await checkRedis();
  if (!report.runtime.production && !report.checks.redis.ok) {
    report.checks.redis = { ok: true, reason: 'Redis optional outside production profile' };
  }

  const envRes = await execNodeScript('scripts/tools/env_manager.cjs', ['check'], Math.min(args.timeoutMs, 60000));
  report.checks.env = {
    ok: envRes.ok,
    reason: envRes.ok ? 'Environment check passed' : (envRes.stderr || envRes.stdout || 'Environment check failed')
  };

  const readinessRes = await execNodeScript('scripts/tools/prod_readiness_check.cjs', [], Math.min(args.timeoutMs, 90000));
  report.checks.prodReadiness = {
    ok: readinessRes.ok,
    reason: readinessRes.ok ? 'Production readiness passed' : (readinessRes.stderr || readinessRes.stdout || 'Production readiness failed')
  };

  if (!args.quick) {
    const lintArgs = args.strictLint
      ? ['run', 'lint:turbo', '--', '--max-warnings=0']
      : ['run', 'lint:turbo'];
    const lintRes = await execNpm(lintArgs, args.timeoutMs);
    report.checks.lint = {
      ok: lintRes.ok,
      reason: lintRes.ok ? 'Lint passed' : (lintRes.stderr || lintRes.stdout || 'Lint failed')
    };
  } else {
    report.checks.lint = { ok: true, reason: 'Skipped in quick mode' };
  }

  if (args.heal) {
    const downServices = report.checks.services.filter((s) => !s.ok).map((s) => s.name);

    if (downServices.length > 0 && args.restartServices) {
      report.actions.push(`Restart requested for services: ${downServices.join(', ')}`);
      const restartRes = await execNodeScript('scripts/tools/trigger_restart.js', [], 45000);
      report.actions.push(restartRes.ok
        ? 'System restart command queued via bridge'
        : `System restart queue failed: ${restartRes.stderr || restartRes.stdout}`);
    }

    if (!report.checks.lint.ok && args.fixLint && !args.quick) {
      const lintFix = await execNpm(['run', 'lint:turbo', '--', '--fix'], args.timeoutMs);
      report.actions.push(lintFix.ok ? 'Applied lint autofix' : `Lint autofix failed: ${lintFix.stderr || lintFix.stdout}`);
      if (lintFix.ok) {
        const lintVerify = await execNpm(['run', 'lint:turbo'], args.timeoutMs);
        report.checks.lint = {
          ok: lintVerify.ok,
          reason: lintVerify.ok ? 'Lint passed after autofix' : (lintVerify.stderr || lintVerify.stdout || 'Lint still failing after autofix')
        };
      }
    }

    if (!report.checks.env.ok) {
      const envBootstrap = await execNodeScript('scripts/tools/env_manager.cjs', ['bootstrap'], 45000);
      report.actions.push(envBootstrap.ok ? 'Ran env bootstrap' : `Env bootstrap failed: ${envBootstrap.stderr || envBootstrap.stdout}`);
    }

    if (!report.checks.prodReadiness.ok) {
      const readinessRetry = await execNodeScript('scripts/tools/prod_readiness_check.cjs', [], Math.min(args.timeoutMs, 90000));
      report.checks.prodReadiness = {
        ok: readinessRetry.ok,
        reason: readinessRetry.ok ? 'Production readiness passed after remediation' : (readinessRetry.stderr || readinessRetry.stdout || 'Production readiness still failing')
      };
      report.actions.push(readinessRetry.ok ? 'Production readiness recovered' : 'Production readiness still degraded');
    }

    if (!report.checks.supabase.ok) {
      const cloudRecover = await execNodeScript('scripts/tools/cloud_preflight.cjs', ['--recover', '--skip-github'], 60000);
      report.actions.push(
        cloudRecover.ok
          ? 'Cloud preflight auto-recover queued bootstrap commands'
          : `Cloud auto-recover failed: ${cloudRecover.stderr || cloudRecover.stdout || 'unknown error'}`
      );
    }
  }

  const summary = summarize(report);
  report.summary = summary;
  report.ok = summary.failedChecks.length === 0;
  report.finishedAt = new Date().toISOString();

  const ts = new Date().toISOString().replace(/[.:]/g, '-');
  const outPath = path.join(DIAG_DIR, `ops_autopilot_${ts}.json`);
  const latestPath = path.join(DIAG_DIR, 'ops_autopilot_latest.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));
  report.artifacts.push(path.relative(ROOT, outPath));
  report.artifacts.push(path.relative(ROOT, latestPath));

  if (args.json) {
    process.stdout.write(JSON.stringify(report));
  } else {
    console.log(`[ops_autopilot] mode=${report.mode} ok=${report.ok} score=${report.summary.healthScore}`);
    if (report.summary.degradedServices.length > 0) {
      console.log(`[ops_autopilot] degraded_services=${report.summary.degradedServices.join(',')}`);
    }
    if (report.summary.failedChecks.length > 0) {
      console.log(`[ops_autopilot] failed_checks=${report.summary.failedChecks.join(',')}`);
    }
    if (report.actions.length > 0) {
      for (const action of report.actions) {
        console.log(`[ops_autopilot] action=${action}`);
      }
    }
    console.log(`[ops_autopilot] report=${path.relative(ROOT, outPath)}`);
  }

  process.exit(report.ok ? 0 : 1);
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(`[ops_autopilot] fatal=${message}`);
  process.exit(1);
});
