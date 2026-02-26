const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', 'interactive');
const VIEWPORT = { width: 430, height: 932, deviceScaleFactor: 3 }; // iPhone 16 Plus
const DESKTOP_VIEWPORT = { width: 1920, height: 1080, deviceScaleFactor: 1 };
const WAIT_MS = 3000;

// Shared interaction helpers
const clickAndCapture = async (page, selector, name, screenshotPath) => {
    try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.click(selector);
        await new Promise(r => setTimeout(r, 800)); // Animation wait
        await page.screenshot({ path: screenshotPath, fullPage: true });
        process.stdout.write(` +${name}`);
    } catch (e) {
        process.stdout.write(` (Err: ${name})`);
    }
};

const hoverAndCapture = async (page, selector, name, screenshotPath) => {
    try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.hover(selector);
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: screenshotPath, fullPage: true });
        process.stdout.write(` +${name}`);
    } catch (e) {
        process.stdout.write(` (Err: ${name})`);
    }
};

const pages = [
    // --- NEXUS ---
    {
        url: 'http://localhost:3001',
        name: 'nexus_dashboard',
        viewport: DESKTOP_VIEWPORT,
        interactions: [
            {
                name: 'diagnostics_run',
                action: async (page, baseName) => {
                    // Click 'Run Diagnostics' button
                    const btns = await page.$$('button');
                    for (const btn of btns) {
                        const text = await page.evaluate(el => el.textContent, btn);
                        if (text && text.includes('Run Diagnostics')) {
                            await btn.click();
                            await new Promise(r => setTimeout(r, 800));
                            await page.screenshot({ path: path.join(OUTPUT_DIR, `${baseName}_run.png`), fullPage: true });
                            process.stdout.write(` +run_diag`);
                            break;
                        }
                    }
                }
            }
        ]
    },
    {
        url: 'http://localhost:3001/analytics',
        name: 'nexus_analytics',
        viewport: DESKTOP_VIEWPORT,
        interactions: [
            {
                name: 'chart_hover',
                action: async (page, baseName) => {
                    // Hover over the center of the screen where charts usually are
                    await page.mouse.move(960, 540);
                    await new Promise(r => setTimeout(r, 500));
                    await page.screenshot({ path: path.join(OUTPUT_DIR, `${baseName}_hover.png`), fullPage: true });
                    process.stdout.write(` +hover`);
                }
            }
        ]
    },

    // --- GHOST COMMAND ---
    {
        url: 'http://localhost:5173',
        name: 'ghost_console',
        viewport: DESKTOP_VIEWPORT,
        interactions: [
            {
                name: 'command_input',
                action: async (page, baseName) => {
                    // Target the specific input by placeholder or type
                    const input = await page.$('input[placeholder*="Enter command"]');
                    if (input) {
                        await input.click();
                        await input.type('status --full');
                        await new Promise(r => setTimeout(r, 500));
                        await page.screenshot({ path: path.join(OUTPUT_DIR, `${baseName}_input.png`), fullPage: true });
                        process.stdout.write(` +input`);
                    }
                }
            }
        ]
    },

    // --- REFLECT ---
    {
        url: 'http://localhost:3000/journal',
        name: 'reflect_journal',
        viewport: VIEWPORT,
        interactions: [
            {
                name: 'switch_to_records',
                action: async (page, baseName) => {
                    const btns = await page.$$('button');
                    for (const btn of btns) {
                        const text = await page.evaluate(el => el.textContent, btn);
                        if (text && text.includes('Chronicle')) {
                            await btn.click();
                            await new Promise(r => setTimeout(r, 800));
                            await page.screenshot({ path: path.join(OUTPUT_DIR, `${baseName}_chronicle.png`), fullPage: true });
                            process.stdout.write(` +chronicle`);
                            break;
                        }
                    }
                }
            }
        ]
    },
    {
        url: 'http://localhost:3000/session',
        name: 'reflect_session',
        viewport: VIEWPORT,
        interactions: [
            {
                name: 'open_profile',
                action: async (page, baseName) => {
                    await clickAndCapture(page, 'button[class*="avatarButton"]', 'profile', path.join(OUTPUT_DIR, `${baseName}_profile.png`));
                }
            },
            {
                name: 'command_palette',
                action: async (page, baseName) => {
                    await page.mouse.click(10, 10); // reset
                    await page.keyboard.down('Control');
                    await page.keyboard.press('k');
                    await page.keyboard.up('Control');
                    await new Promise(r => setTimeout(r, 600));
                    await page.screenshot({ path: path.join(OUTPUT_DIR, `${baseName}_palette.png`), fullPage: true });
                    process.stdout.write(` +palette`);
                }
            }
        ]
    }
];

async function run() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    console.log('\n  MATRIX INTERACTIVE UI AUDIT');
    console.log('  ════════════════════════════════\n');

    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-gpu', '--disable-software-rasterizer'],
    });

    let success = 0;

    for (const pg of pages) {
        process.stdout.write(`  ${pg.name}...`);
        try {
            const page = await browser.newPage();
            await page.setViewport(pg.viewport || VIEWPORT);
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // Log Errors
            page.on('pageerror', err => console.log(`    [JS Error] ${err.toString()}`));
            page.on('console', msg => {
                if (msg.type() === 'error') console.log(`    [Console Error] ${msg.text()}`);
            });

            await page.goto(pg.url, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(r => setTimeout(r, WAIT_MS));

            // Base Capture
            const baseFile = path.join(OUTPUT_DIR, `${pg.name}_base.png`);
            await page.screenshot({ path: baseFile, fullPage: true });
            process.stdout.write(` base`);

            // Interactions
            if (pg.interactions) {
                for (const interaction of pg.interactions) {
                    await interaction.action(page, pg.name);
                }
            }

            console.log(` OK`);
            success++;
            await page.close();
        } catch (err) {
            console.log(` FAILED: ${err.message}`);
        }
    }

    await browser.close();
    console.log(`\n  Audit Complete. Images in: ${OUTPUT_DIR}\n`);
}

run().catch(console.error);
