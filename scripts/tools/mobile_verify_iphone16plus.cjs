#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'temp_mobile_verification');
const DIAG_DIR = path.join(ROOT, 'docs', 'diagnostics');

const ROUTES = [
  { name: 'nexus_dashboard', url: 'http://localhost:3001/' },
  { name: 'nexus_alias', url: 'http://localhost:3001/nexus' },
  { name: 'nexus_diagnostics', url: 'http://localhost:3001/diagnostics' },
  { name: 'nexus_analytics', url: 'http://localhost:3001/analytics' },
  { name: 'nexus_integrations', url: 'http://localhost:3001/integrations' },
  { name: 'nexus_settings', url: 'http://localhost:3001/settings' },
  { name: 'reflect_setup', url: 'http://localhost:3000/setup/initial' },
  { name: 'reflect_auth', url: 'http://localhost:3000/auth' },
  { name: 'reflect_tutorial', url: 'http://localhost:3000/tutorial' },
  { name: 'reflect_session', url: 'http://localhost:3000/session' }
];

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

async function waitForServerReady(url, timeoutMs = 180000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.status >= 200 && response.status < 500) return true;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 2500));
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
    const response = await page.goto(route.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    responseStatus = response ? response.status() : null;
  } catch (error) {
    navError = error instanceof Error ? error.message : String(error);
  }

  await new Promise((resolve) => setTimeout(resolve, 7000));

  const screenshot = `${route.name}_iphone16plus.png`;
  const screenshotPath = path.join(OUT_DIR, screenshot);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  let html = '';
  let bodyText = '';
  for (let i = 0; i < 3; i++) {
    try {
      html = (await page.content()).toLowerCase();
      bodyText = String(await page.evaluate(() => document.body?.innerText || '')).toLowerCase();
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }
  const hasClientException = bodyText.includes('client-side exception') || bodyText.includes('runtime error');
  const has404 = bodyText.includes('this page could not be found');

  const fatalConsoleErrors = consoleErrors.filter((e) =>
    /module not found|runtime error|client-side exception|failed to load resource: the server responded with a status of 500/i.test(e)
  );

  await page.close();

  const ok = !navError && !hasClientException && !has404 && pageErrors.length === 0 && fatalConsoleErrors.length === 0;

  return {
    name: route.name,
    url: route.url,
    ok,
    responseStatus,
    navError,
    hasClientException,
    has404,
    pageErrors,
    consoleErrors: fatalConsoleErrors,
    screenshot: path.relative(ROOT, screenshotPath)
  };
}

async function main() {
  ensureDirs();
  const edgePath = resolveEdgePath();

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox']
  });

  const startedAt = new Date().toISOString();
  const results = [];

  try {
    const readyTargets = ['http://localhost:3001/', 'http://localhost:3000/session'];
    for (const target of readyTargets) {
      await waitForServerReady(target);
    }

    for (const route of ROUTES) {
      results.push(await verifyRoute(browser, route));
    }
  } finally {
    await browser.close();
  }

  const finishedAt = new Date().toISOString();
  const passCount = results.filter((r) => r.ok).length;
  const summary = {
    device: 'iPhone 16 Plus (430x932)',
    startedAt,
    finishedAt,
    total: results.length,
    passed: passCount,
    failed: results.length - passCount
  };

  const payload = { summary, results };
  const ts = new Date().toISOString().replace(/[.:]/g, '-');
  const outPath = path.join(DIAG_DIR, `mobile_verify_iphone16plus_${ts}.json`);
  const latest = path.join(DIAG_DIR, 'mobile_verify_iphone16plus_latest.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  fs.writeFileSync(latest, JSON.stringify(payload, null, 2));

  console.log(JSON.stringify({ ok: summary.failed === 0, summary, out: path.relative(ROOT, outPath), latest: path.relative(ROOT, latest) }, null, 2));
  process.exit(summary.failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
