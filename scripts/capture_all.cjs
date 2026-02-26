const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots');
const VIEWPORT = { width: 430, height: 932, deviceScaleFactor: 3 };
const WAIT_MS = 4000;

const pages = [
    // NEXUS
    { url: 'http://localhost:3001', name: 'nexus_01_dashboard' },
    { url: 'http://localhost:3001/analytics', name: 'nexus_02_analytics' },
    { url: 'http://localhost:3001/diagnostics', name: 'nexus_03_diagnostics' },
    { url: 'http://localhost:3001/integrations', name: 'nexus_04_integrations' },
    { url: 'http://localhost:3001/knowledge', name: 'nexus_05_knowledge' },
    { url: 'http://localhost:3001/settings', name: 'nexus_06_settings' },

    // REFLECT
    { url: 'http://localhost:3000', name: 'reflect_01_landing' },
    { url: 'http://localhost:3000/login', name: 'reflect_02_login' },
    { url: 'http://localhost:3000/auth', name: 'reflect_03_auth' },
    { url: 'http://localhost:3000/setup', name: 'reflect_04_setup' },
    { url: 'http://localhost:3000/setup/initial', name: 'reflect_05_setup_initial' },
    { url: 'http://localhost:3000/neural-initialize', name: 'reflect_06_neural_init' },
    { url: 'http://localhost:3000/onboarding', name: 'reflect_07_onboarding' },
    { url: 'http://localhost:3000/tutorial', name: 'reflect_08_tutorial' },
    {
        url: 'http://localhost:3000/session',
        name: 'reflect_09_session',
        interactions: [
            {
                suffix: '_profile_menu',
                action: async (page) => {
                    // Click Profile Avatar to open menu
                    const btn = await page.$('button[class*="avatarButton"]');
                    if (btn) {
                        await btn.click();
                        await new Promise(r => setTimeout(r, 600)); // Wait for animation
                    }
                }
            },
            {
                suffix: '_command_palette',
                action: async (page) => {
                    // Close any open menus first by clicking safe area
                    await page.mouse.click(10, 10);
                    await new Promise(r => setTimeout(r, 300));

                    // Trigger Command Palette (Ctrl+K)
                    await page.keyboard.down('Control');
                    await page.keyboard.press('k');
                    await page.keyboard.up('Control');
                    await new Promise(r => setTimeout(r, 600)); // Wait for animation
                }
            }
        ]
    },
    { url: 'http://localhost:3000/dashboard-loading', name: 'reflect_10_dashboard_loading' },
    { url: 'http://localhost:3000/journal', name: 'reflect_11_journal' },
    { url: 'http://localhost:3000/archive', name: 'reflect_12_archive' },
    { url: 'http://localhost:3000/capsule', name: 'reflect_13_capsule' },
    { url: 'http://localhost:3000/growth', name: 'reflect_14_growth' },
    { url: 'http://localhost:3000/insights', name: 'reflect_15_insights' },
    { url: 'http://localhost:3000/patterns', name: 'reflect_16_patterns' },
    { url: 'http://localhost:3000/graph', name: 'reflect_17_graph' },
    { url: 'http://localhost:3000/paths', name: 'reflect_18_paths' },
    { url: 'http://localhost:3000/search', name: 'reflect_19_search' },
    { url: 'http://localhost:3000/sage', name: 'reflect_20_sage' },
    { url: 'http://localhost:3000/chat', name: 'reflect_21_chat' },
    { url: 'http://localhost:3000/voice', name: 'reflect_22_voice' },
    { url: 'http://localhost:3000/profile', name: 'reflect_23_profile' },
    { url: 'http://localhost:3000/settings', name: 'reflect_24_settings' },
    { url: 'http://localhost:3000/settings/developer', name: 'reflect_25_settings_dev' },
    { url: 'http://localhost:3000/system', name: 'reflect_26_system' },
    { url: 'http://localhost:3000/debug', name: 'reflect_27_debug' },
    { url: 'http://localhost:3000/demo', name: 'reflect_28_demo' },
    { url: 'http://localhost:3000/common', name: 'reflect_29_common' },
    { url: 'http://localhost:3000/trash', name: 'reflect_30_trash' },

    // GHOST COMMAND
    { url: 'http://localhost:5173', name: 'ghost_01_dashboard' },
];

async function run() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    console.log('\n  MATRIX COMPREHENSIVE UI CAPTURE');
    console.log('  ════════════════════════════════\n');

    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-gpu', '--disable-software-rasterizer'],
    });

    let success = 0;
    let failed = 0;

    for (const pg of pages) {
        process.stdout.write(`  [${String(success + failed + 1).padStart(2)}/${pages.length}] ${pg.name}...`);

        try {
            const page = await browser.newPage();
            await page.setViewport(VIEWPORT);
            await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15');

            // 1. Base Capture
            await page.goto(pg.url, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(r => setTimeout(r, WAIT_MS));

            const baseOutFile = path.join(OUTPUT_DIR, `${pg.name}.png`);
            await page.screenshot({ path: baseOutFile, fullPage: true });

            // 2. Interaction Captures
            if (pg.interactions) {
                for (const interaction of pg.interactions) {
                    try {
                        await interaction.action(page);
                        const subOutFile = path.join(OUTPUT_DIR, `${pg.name}${interaction.suffix}.png`);
                        await page.screenshot({ path: subOutFile, fullPage: true });
                        process.stdout.write(` +${interaction.suffix}`);
                    } catch (intErr) {
                        process.stdout.write(` (Err: ${interaction.suffix})`);
                    }
                }
            }

            const size = fs.statSync(baseOutFile).size;
            console.log(` OK (${Math.round(size / 1024)}KB)`);
            success++;
            await page.close();
        } catch (err) {
            console.log(` FAILED: ${err.message.slice(0, 60)}`);
            failed++;
        }
    }

    await browser.close();

    console.log('\n  ════════════════════════════════');
    console.log(`  DONE: ${success} captured, ${failed} failed`);
    console.log(`  Output: ${OUTPUT_DIR}\n`);
}

run().catch(console.error);
