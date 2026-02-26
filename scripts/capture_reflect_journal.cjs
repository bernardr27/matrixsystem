const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = 'g:\\matrix\\screenshots';
const VIEWPORT = { width: 430, height: 932, deviceScaleFactor: 3 }; // iPhone 16 Plus

async function run() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    console.log('Capturing Reflect Zen Journal...');
    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-gpu'],
    });

    try {
        const page = await browser.newPage();
        await page.setViewport(VIEWPORT);
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15');

        // Note: Reflect runs on port 3000 usually, check if it's 3000 or 3002
        // Based on previous logs, Nexus is 3001. Reflect is usually 3000. Ghost is 3002?
        // I'll try 3000.
        await page.goto('http://localhost:3000/journal', { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for animation
        await new Promise(r => setTimeout(r, 2000));

        await page.screenshot({ path: path.join(OUTPUT_DIR, 'reflect_zen_journal_v2.png'), fullPage: true });
        console.log('Captured reflect_zen_journal_v2.png');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
}

run();
