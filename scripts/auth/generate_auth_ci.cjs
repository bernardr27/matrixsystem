const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Usage:
// CHROME_PATH="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" \
// APP=ghost URL=http://localhost:5173 USERNAME=you@example.com PASSWORD=secret TOTP_SECRET=BASE32 node generate_auth_ci.cjs

async function findChrome() {
  const p = process.env.CHROME_PATH || process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (p && require('fs').existsSync(p)) return p;
  throw new Error('Chrome not found. Set CHROME_PATH env var.');
}

async function run() {
  const executablePath = await findChrome();
  const APP = process.env.APP; // app id (ghost, reflect, nexus, citadel, rocket)
  const URL = process.env.URL; // e.g. http://localhost:5173
  const USERNAME = process.env.USERNAME;
  const PASSWORD = process.env.PASSWORD;
  if (!APP || !URL) {
    console.error('Required env: APP and URL');
    process.exit(2);
  }

  const browser = await puppeteer.launch({ executablePath, headless: false });
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle2' });

  // The script attempts common login flows; for custom apps you can modify selectors via env vars.
  try {
    if (USERNAME && PASSWORD) {
      // try email input
      const emailSel = process.env.EMAIL_SELECTOR || 'input[type=email], input[name=email], input#email';
      const passSel = process.env.PASSWORD_SELECTOR || 'input[type=password], input[name=password], input#password';
      await page.waitForTimeout(1000);
      const emailExists = await page.$(emailSel);
      if (emailExists) {
        await page.type(emailSel, USERNAME, { delay: 50 });
      }
      const passExists = await page.$(passSel);
      if (passExists) {
        await page.type(passSel, PASSWORD, { delay: 50 });
      }
      const submitSel = process.env.SUBMIT_SELECTOR || 'button[type=submit], button.login, button.sign-in';
      const submit = await page.$(submitSel);
      if (submit) await submit.click();
    }

    // If TOTP provided, wait for a TOTP input
    if (process.env.TOTP_SECRET) {
      // allow manual TOTP entry or add automation later
      console.log('TOTP secret provided — please enter TOTP in the browser when prompted.');
    }

    // Give time for interactive login (useful for social / 2FA flows)
    console.log('Waiting for interactive login to complete in browser...');
    await page.waitForTimeout(20000);

    // collect cookies and localStorage
    const cookies = await page.cookies();
    const localStorageData = await page.evaluate(() => {
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        out[k] = localStorage.getItem(k);
      }
      return out;
    });

    const authDir = path.join(__dirname, '..', 'auth');
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
    const file = path.join(authDir, `${APP}_auth.json`);
    fs.writeFileSync(file, JSON.stringify({ cookies, localStorage: localStorageData }, null, 2));
    console.log('Auth snapshot written to', file);
  } catch (e) {
    console.error('Auth generation failed:', e.message);
  } finally {
    console.log('Keeping browser open for inspection; close manually when done.');
  }
}

run().catch(e => { console.error(e); process.exit(1); });
