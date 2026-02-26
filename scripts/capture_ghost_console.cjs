const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = 'g:\\matrix\\screenshots';
const VIEWPORT = { width: 430, height: 932, deviceScaleFactor: 3 }; // iPhone 16 Plus - Ghost is Mobile First? Or Desktop? Console implies desktop, but user said "App UI". I'll stick to mobile for consistency but maybe landscape? No, user said iPhone 16 Plus scaling.

async function run() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    console.log('Capturing Ghost Industrial Console...');
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

        // Try 3010 first (our manual start), then 5173 (default)
        try {
            console.log('Trying port 3010...');
            await page.goto('http://localhost:3010', { waitUntil: 'networkidle2', timeout: 5000 });
        } catch (e) {
            console.log('Port 3010 failed, trying 5173...');
            await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 30000 });
        }

        // Wait for boot sequence (2s)
        await new Promise(r => setTimeout(r, 4000));

        await page.screenshot({ path: path.join(OUTPUT_DIR, 'ghost_industrial_console.png'), fullPage: true });
        console.log('Captured ghost_industrial_console.png');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
}

run();
