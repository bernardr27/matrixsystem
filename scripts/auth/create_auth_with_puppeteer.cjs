#!/usr/bin/env node
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..', '..');
const AUTH_DIR = path.join(ROOT, 'scripts', 'auth');
fs.mkdirSync(AUTH_DIR, { recursive: true });

const APPS = {
  reflect: 'http://localhost:3000',
  nexus: 'http://localhost:3001',
  citadel: 'http://localhost:3005',
  ghost: 'http://localhost:5173',
  rocket: 'http://localhost:4000'
};

function findChrome() {
  const common = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.CHROME_PATH
  ];
  return common.find(p => p && fs.existsSync(p));
}

async function run() {
  const appArg = process.argv[2];
  if (!appArg || !APPS[appArg]) {
    console.error('Usage: node create_auth_with_puppeteer.cjs <app>');
    console.error('Available apps:', Object.keys(APPS).join(', '));
    process.exit(1);
  }

  const url = APPS[appArg];
  const executablePath = findChrome();
  if (!executablePath) {
    console.error('Chrome not found. Set CHROME_PATH env var or install Chrome.');
    process.exit(1);
  }

  const browser = await puppeteer.launch({ executablePath, headless: false, defaultViewport: null });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  console.log(`\nOpened non-headless browser for ${appArg} at ${url}.`);
  console.log('Please complete the interactive login (including 2FA) in the opened browser window.');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise((resolve) => rl.question('Press ENTER here after you have finished logging in in the browser...', () => { rl.close(); resolve(); }));

  try {
    const cookies = await page.cookies();
    const localStorage = await page.evaluate(() => {
      try { return Object.fromEntries(Object.entries(localStorage)); } catch (e) { return {}; }
    });

    const out = { cookies, localStorage };
    const outPath = path.join(AUTH_DIR, `${appArg}_auth.json`);
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
    console.log(`Auth snapshot written to ${outPath}`);
  } catch (e) {
    console.error('Failed to capture auth:', e.stack || e.message);
  } finally {
    await browser.close();
    process.exit(0);
  }
}

run().catch((e) => { console.error(e.stack || e.message); process.exit(1); });
