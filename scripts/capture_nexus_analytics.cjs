const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = 'g:\\matrix\\screenshots';
const VIEWPORT = { width: 430, height: 932, deviceScaleFactor: 3 }; // iPhone 16 Plus - Mobile Vibe check

async function run() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    console.log('Capturing Nexus Deep Analytics...');
    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-gpu'],
    });

    try {
        const page = await browser.newPage();

        // Capture console logs and errors from the page
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
        page.on('requestfailed', request => console.log('FAILED REQUEST:', request.url(), request.failure().errorText));

        await page.setViewport(VIEWPORT);
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15');

        // Nexus is likely on port 3001 based on scan
        try {
            console.log('Trying port 3001...');
            await page.goto('http://localhost:3001/analytics', { waitUntil: 'networkidle2', timeout: 30000 });
        } catch (e) {
            console.log('Port 3001 failed, trying 3000...');
            await page.goto('http://localhost:3000/analytics', { waitUntil: 'networkidle2', timeout: 30000 });
        }

        // Wait for animations
        await new Promise(r => setTimeout(r, 2000));

        await page.screenshot({ path: path.join(OUTPUT_DIR, 'nexus_deep_analytics.png'), fullPage: true });
        console.log('Captured nexus_deep_analytics.png');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
}

run();
