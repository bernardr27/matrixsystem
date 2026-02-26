#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'temp_mobile_verification');
const DIAG_DIR = path.join(ROOT, 'docs', 'diagnostics');

const CORE_ROUTES = [
  { name: 'nexus_home', url: 'http://localhost:3001/' },
  { name: 'reflect_session', url: 'http://localhost:3000/session' }
];

const NEXUS_POOL = ['/nexus', '/diagnostics', '/analytics', '/integrations', '/knowledge', '/settings'];
const REFLECT_POOL = ['/auth', '/setup/initial', '/tutorial', '/journal', '/insights', '/system'];

const EDGE_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
];

function resolveEdgePath() {
  for (const candidate of EDGE_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error('Edge executable not found.');
}

function ensureDirs() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(DIAG_DIR, { recursive: true });
}

function parseArgs() {
  const appArg = process.argv.find((a) => a.startsWith('--app='));
  const app = appArg ? appArg.split('=')[1] : 'both';
  return { app: ['nexus', 'reflect', 'both'].includes(app) ? app : 'both' };
}

function hash(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0);
}

function pickRoutes(pool, baseUrl, prefix, count, seed) {
  const used = new Set();
  const picked = [];
  let n = 0;
  while (picked.length < count && n < pool.length * 3) {
    const idx = (seed + n * 17) % pool.length;
    const route = pool[idx];
    if (!used.has(route)) {
      used.add(route);
      picked.push({ name: `${prefix}_${route.replace(/\//g, '_') || 'root'}`, url: `${baseUrl}${route}` });
    }
    n++;
  }
  return picked;
}

async function waitForServerReady(url, timeoutMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.status >= 200 && response.status < 500) return true;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return false;
}

async function verifyRoute(browser, route) {
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1');
  await page.setViewport({ width: 430, height: 932, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });

  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  let responseStatus = null;
  let navError = null;
  try {
    const response = await page.goto(route.url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    responseStatus = response ? response.status() : null;
  } catch (error) {
    navError = error instanceof Error ? error.message : String(error);
  }

  await new Promise((resolve) => setTimeout(resolve, 1800));

  const screenshotPath = path.join(OUT_DIR, `${route.name}_fast.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const bodyText = String(await page.evaluate(() => document.body?.innerText || '')).toLowerCase();
  const hasClientException = bodyText.includes('client-side exception') || bodyText.includes('runtime error');
  const has404 = bodyText.includes('this page could not be found');

  const fatalConsoleErrors = consoleErrors.filter((e) =>
    /module not found|runtime error|client-side exception|failed to load resource: the server responded with a status of 500/i.test(e)
  );

  await page.close();

  return {
    name: route.name,
    url: route.url,
    ok: !navError && !hasClientException && !has404 && pageErrors.length === 0 && fatalConsoleErrors.length === 0,
    responseStatus,
    navError,
    hasClientException,
    has404,
    pageErrors,
    consoleErrors: fatalConsoleErrors,
    screenshot: path.relative(ROOT, screenshotPath)
  };
}

async function fetchHealth(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return { url, ok: response.ok, status: response.status, body: text.slice(0, 180) };
  } catch (error) {
    return { url, ok: false, status: null, body: String(error) };
  }
}

async function main() {
  ensureDirs();
  const { app } = parseArgs();
  const seedKey = process.env.VERIFY_SEED || new Date().toISOString().slice(0, 10);
  const nexusSeed = hash(`nexus:${seedKey}`);
  const reflectSeed = hash(`reflect:${seedKey}`);

  const core = [];
  if (app === 'both' || app === 'nexus') core.push({ name: 'nexus_home', url: 'http://localhost:3001/' });
  if (app === 'both' || app === 'reflect') core.push({ name: 'reflect_session', url: 'http://localhost:3000/session' });

  const sampled = [];
  if (app === 'both' || app === 'nexus') sampled.push(...pickRoutes(NEXUS_POOL, 'http://localhost:3001', 'nexus', 2, nexusSeed));
  if (app === 'both' || app === 'reflect') sampled.push(...pickRoutes(REFLECT_POOL, 'http://localhost:3000', 'reflect', 2, reflectSeed));
  const routes = [...core, ...sampled];
  const browser = await puppeteer.launch({
    executablePath: resolveEdgePath(),
    headless: 'new',
    args: ['--no-sandbox']
  });

  const startedAt = new Date().toISOString();
  let readiness = { nexus: false, reflect: false };
  const results = [];
  const health = [];

  try {
    if (app === 'both' || app === 'nexus') {
      readiness.nexus = await waitForServerReady('http://localhost:3001/');
      health.push(await fetchHealth('http://localhost:3001/api/health'));
    }
    if (app === 'both' || app === 'reflect') {
      readiness.reflect = await waitForServerReady('http://localhost:3000/session');
      health.push(await fetchHealth('http://localhost:3000/api/health'));
    }

    for (const route of routes) {
      results.push(await verifyRoute(browser, route));
    }
  } finally {
    await browser.close();
  }

  const finishedAt = new Date().toISOString();
  const passed = results.filter((r) => r.ok).length;
  const summary = {
    mode: 'fast-smoke+sample',
    app,
    seed: seedKey,
    device: 'iPhone 16 Plus (430x932)',
    startedAt,
    finishedAt,
    total: results.length,
    passed,
    failed: results.length - passed,
    readiness
  };

  const payload = { summary, health, routes, results };
  const ts = new Date().toISOString().replace(/[.:]/g, '-');
  const outPath = path.join(DIAG_DIR, `mobile_verify_fast_${ts}.json`);
  const latest = path.join(DIAG_DIR, 'mobile_verify_fast_latest.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  fs.writeFileSync(latest, JSON.stringify(payload, null, 2));

  console.log(JSON.stringify({ ok: summary.failed === 0, summary, out: path.relative(ROOT, outPath), latest: path.relative(ROOT, latest) }, null, 2));
  process.exit(summary.failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
