const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = 'g:\\matrix\\screenshots';
const VIEWPORT = { width: 430, height: 932, deviceScaleFactor: 3 };

async function run() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    console.log('Capturing Nexus Diagnostics...');
    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-gpu'],
    });

    try {
        const page = await browser.newPage();
        await page.setViewport(VIEWPORT);
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15');

        await page.goto('http://localhost:3001/diagnostics', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000)); // Wait for data load

        await page.screenshot({ path: path.join(OUTPUT_DIR, 'nexus_03_diagnostics_seeded.png'), fullPage: true });
        console.log('Captured nexus_03_diagnostics_seeded.png');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
}

run();
