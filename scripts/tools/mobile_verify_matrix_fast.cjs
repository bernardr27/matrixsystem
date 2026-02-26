#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'temp_mobile_verification');
const DIAG_DIR = path.join(ROOT, 'docs', 'diagnostics');

const APPS = {
  reflect: {
    port: 3000,
    cwd: path.join(ROOT, 'apps', 'reflect'),
    baseUrl: 'http://localhost:3000',
    health: 'http://localhost:3000/api/health',
    routes: ['/session', '/auth']
  },
  nexus: {
    port: 3001,
    cwd: path.join(ROOT, 'apps', 'nexus'),
    baseUrl: 'http://localhost:3001',
    health: 'http://localhost:3001/api/health',
    routes: ['/', '/diagnostics']
  },
  citadel: {
    port: 3005,
    cwd: path.join(ROOT, 'apps', 'citadel'),
    baseUrl: 'http://localhost:3005',
    health: 'http://localhost:3005/api/health',
    routes: ['/', '/dashboard']
  },
  ghost: {
    port: 5173,
    cwd: path.join(ROOT, 'apps', 'ghost-command'),
    baseUrl: 'http://localhost:5173',
    health: 'http://localhost:5173/api/health',
    routes: ['/', '/vault']
  },
  rocket: {
    port: 4000,
    cwd: path.join(ROOT, 'apps', 'rocket-command'),
    baseUrl: 'http://localhost:4000',
    health: 'http://localhost:4000/api/health',
    routes: ['/', '/operations']
  }
};

const EDGE_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
];

function parseArgs() {
  const defaults = { app: 'all', autoStart: true, json: false, timeoutMs: 45000, ultra: false, screenshots: true, viewport: 'mobile' };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--app=')) defaults.app = arg.split('=')[1];
    if (arg === '--no-start') defaults.autoStart = false;
    if (arg === '--json') defaults.json = true;
    if (arg === '--ultra') defaults.ultra = true;
    if (arg === '--no-screenshots') defaults.screenshots = false;
    if (arg.startsWith('--timeout-ms=')) {
      const ms = Number(arg.split('=')[1]);
      if (Number.isFinite(ms) && ms >= 10000) defaults.timeoutMs = ms;
    }
    if (arg.startsWith('--viewport=')) {
      const v = arg.split('=')[1];
      if (v) defaults.viewport = v;
    }
  }
  return defaults;
}

function ensureDirs() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(DIAG_DIR, { recursive: true });
}

function resolveEdgePath() {
  for (const candidate of EDGE_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error('Edge executable not found.');
}

function resolveApps(appArg) {
  if (appArg === 'all') return Object.keys(APPS);
  return appArg.split(',').map((v) => v.trim()).filter((v) => APPS[v]);
}

function isPortListening(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1200);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));
    socket.connect(port, '127.0.0.1');
  });
}

function startApp(name, app) {
  if (process.platform === 'win32') {
    const child = spawn('cmd.exe', ['/d', '/s', '/c', 'npm run dev'], {
      cwd: app.cwd,
      windowsHide: true,
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    return { name, pid: child.pid, cwd: path.relative(ROOT, app.cwd), method: 'cmd-detached-hidden' };
  }

  const child = spawn('npm', ['run', 'dev'], {
    cwd: app.cwd,
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  child.unref();
  return { name, pid: child.pid, cwd: path.relative(ROOT, app.cwd), method: 'spawn' };
}

async function waitForUrl(url, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.status >= 200 && response.status < 500) return { ok: true, status: response.status };
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return { ok: false, status: 0 };
}

async function verifyRoute(browser, routeName, url, screenshots = true) {
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1');
  await page.setViewport({ width: 430, height: 932, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });

  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // Attempt to preload auth snapshot if available to bypass login/2FA pages
  try {
    const appName = routeName.split('_')[0];
    const authDir = path.join(ROOT, 'scripts', 'auth');
    const authPath = path.join(authDir, `${appName}_auth.json`);
    if (fs.existsSync(authPath)) {
      try {
        const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
        if (Array.isArray(auth.cookies) && auth.cookies.length) {
          await page.setCookie(...auth.cookies);
        }
        if (auth.localStorage && typeof auth.localStorage === 'object') {
          // Navigate to a blank page on the same origin to set localStorage safely
          await page.goto('about:blank');
          await page.evaluate((kv) => {
            for (const k of Object.keys(kv)) {
              try { localStorage.setItem(k, kv[k]); } catch (e) {}
            }
          }, auth.localStorage);
        }
        console.log(`[AUTH] Loaded auth snapshot for ${appName} from ${path.relative(ROOT, authPath)}`);
      } catch (e) {
        console.warn(`[AUTH] Failed to load auth snapshot ${authPath}: ${e.message}`);
      }
    }
  } catch (e) {
    console.warn('[AUTH] Auth preload error:', e.message);
  }

  let responseStatus = null;
  let navError = null;
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    responseStatus = response ? response.status() : null;
  } catch (error) {
    navError = error instanceof Error ? error.message : String(error);
  }

  await new Promise((resolve) => setTimeout(resolve, 900));
  const bodyText = String(await page.evaluate(() => document.body?.innerText || '')).toLowerCase();
  const hasClientException = bodyText.includes('client-side exception') || bodyText.includes('runtime error');
  const has404 = bodyText.includes('this page could not be found') || bodyText.trim() === '404';
  const fatalConsoleErrors = consoleErrors.filter((e) =>
    /module not found|runtime error|client-side exception|failed to load resource: the server responded with a status of 500/i.test(e)
  );

  const screenshotPath = path.join(OUT_DIR, `${routeName}_matrix_fast.png`);
  if (screenshots) {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  }
  await page.close();

  return {
    name: routeName,
    url,
    ok: !navError && !hasClientException && !has404 && pageErrors.length === 0 && fatalConsoleErrors.length === 0,
    responseStatus,
    navError,
    hasClientException,
    has404,
    pageErrors,
    consoleErrors: fatalConsoleErrors,
    screenshot: screenshots ? path.relative(ROOT, screenshotPath) : null
  };
}

async function main() {
  const args = parseArgs();
  ensureDirs();
  const selectedApps = resolveApps(args.app);
  if (selectedApps.length === 0) throw new Error(`No valid apps resolved from --app=${args.app}`);

  const startedAt = new Date().toISOString();
  const startedProcesses = [];
  const readiness = {};
  const health = [];
  const results = [];

  for (const appName of selectedApps) {
    const app = APPS[appName];
    const alreadyUp = await isPortListening(app.port);
    if (!alreadyUp && args.autoStart) {
      startedProcesses.push(startApp(appName, app));
    }
  }

  for (const appName of selectedApps) {
    const app = APPS[appName];
    const ready = await waitForUrl(app.baseUrl, args.timeoutMs);
    readiness[appName] = ready.ok;
    const healthProbe = await waitForUrl(app.health, 15000);
    health.push({ app: appName, url: app.health, ok: healthProbe.ok, status: healthProbe.status });
  }

  const browser = await puppeteer.launch({
    executablePath: resolveEdgePath(),
    headless: 'new',
    args: ['--no-sandbox']
  });
  try {
    for (const appName of selectedApps) {
      const app = APPS[appName];
      const routes = args.ultra ? [app.routes[0]] : app.routes;
      for (const route of routes) {
        const routeName = `${appName}${route === '/' ? '_home' : route.replace(/\//g, '_')}`;
        const url = `${app.baseUrl}${route}`;
        results.push(await verifyRoute(browser, routeName, url, args.screenshots));
      }
    }
  } finally {
    await browser.close();
  }

  const finishedAt = new Date().toISOString();
  const passed = results.filter((r) => r.ok).length;
  const summary = {
    mode: 'matrix-fast',
    app: args.app,
    ultra: args.ultra,
    screenshots: args.screenshots,
    autoStart: args.autoStart,
    startedAt,
    finishedAt,
    total: results.length,
    passed,
    failed: results.length - passed
  };

  const payload = { summary, selectedApps, readiness, startedProcesses, health, results };
  const ts = new Date().toISOString().replace(/[.:]/g, '-');
  const outPath = path.join(DIAG_DIR, `mobile_verify_matrix_fast_${ts}.json`);
  const latestPath = path.join(DIAG_DIR, 'mobile_verify_matrix_fast_latest.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  fs.writeFileSync(latestPath, JSON.stringify(payload, null, 2));

  if (args.json) {
    process.stdout.write(JSON.stringify(payload));
  } else {
    console.log(JSON.stringify({
      ok: summary.failed === 0,
      summary,
      out: path.relative(ROOT, outPath),
      latest: path.relative(ROOT, latestPath)
    }, null, 2));
  }
  process.exit(summary.failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
