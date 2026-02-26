const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = 'g:\\matrix\\design screens\\web_inspiration';
const VIEWPORT = { width: 430, height: 932, deviceScaleFactor: 3 }; // iPhone 16 Plus

// Expanded Targets (Reflect: Zen, Ghost: Cyberpunk, Nexus: Deep Data)
const TARGETS = [
    // REFLECT: Zen / Minimalist / Glass
    { name: 'reflect_zen_journal', url: 'https://dribbble.com/search/shots/popular/mobile?q=minimalist%20journal%20app%20dark%20mode' },
    { name: 'reflect_glass_ui', url: 'https://ui8.net/categories/health-and-wellness' }, // Often has clean, zen apps

    // GHOST COMMAND: Cyberpunk / Terminal / Industrial
    { name: 'ghost_cyberpunk_ui', url: 'https://dribbble.com/search/shots/popular/mobile?q=cyberpunk%20ui%20mobile' },
    { name: 'ghost_terminal_dashboard', url: 'https://www.Pinterest.com/search/pins/?q=hud%20ui%20design%20mobile' },

    // NEXUS: Deep Data / Neumorphic
    { name: 'nexus_deep_analytics', url: 'https://dribbble.com/search/shots/popular/mobile?q=mobile%20analytics%20dark%20mode%20dashboard' },
    { name: 'nexus_settings_ui', url: 'https://mobbin.com/browse/ios/apps?category=finance&color=dark' } // Finance often has dense data UI
];

async function run() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    console.log('Capturing Expanded Design Inspiration...');
    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-gpu'],
    });

    try {
        const page = await browser.newPage();
        await page.setViewport(VIEWPORT);
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15');

        for (const target of TARGETS) {
            console.log(`Navigating to ${target.name}...`);
            try {
                await page.goto(target.url, { waitUntil: 'networkidle2', timeout: 35000 });
                await new Promise(r => setTimeout(r, 4000)); // Wait for lazy load

                // Scroll down to trigger more loading
                await page.evaluate(() => window.scrollBy(0, window.innerHeight));
                await new Promise(r => setTimeout(r, 2000));

                const filename = path.join(OUTPUT_DIR, `${target.name}.png`);
                await page.screenshot({ path: filename, fullPage: true });
                console.log(`Captured ${filename}`);
            } catch (err) {
                console.error(`Failed to capture ${target.name}:`, err.message);
            }
        }
    } catch (e) {
        console.error('Browser Error:', e);
    } finally {
        await browser.close();
    }
}

run();
