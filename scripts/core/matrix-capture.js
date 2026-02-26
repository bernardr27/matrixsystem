const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

/**
 * MATRIX CAPTURE v2.0 — Neural Optical Array with UI Validation
 * Synthesized from: OpenAI SDK, AG-UI, Ink, Avalonia capture patterns
 * ──────────────────────────────────────────────────────────────────
 * 
 * Features:
 *   - Multi-viewport capture (mobile, tablet, desktop, ultrawide)
 *   - Automated UI issue detection (clipping, overflow, sizing)
 *   - Touch target validation (min 44px per WCAG)
 *   - Font readability checks (min 10px)
 *   - Z-index stacking audit
 *   - Ghost Command target support
 */

const OUTPUT_DIR = path.join(__dirname, '../../captures');

const TARGETS = [
    // Reflect
    { name: 'reflect_dashboard', url: 'http://localhost:3000', app: 'reflect' },
    { name: 'reflect_journal', url: 'http://localhost:3000/journal', app: 'reflect' },
    { name: 'reflect_settings', url: 'http://localhost:3000/settings', app: 'reflect' },
    { name: 'reflect_developer', url: 'http://localhost:3000/settings/developer', app: 'reflect' },
    { name: 'reflect_data', url: 'http://localhost:3000/data', app: 'reflect' },
    { name: 'reflect_graph', url: 'http://localhost:3000/graph', app: 'reflect' },
    { name: 'reflect_sage', url: 'http://localhost:3000/sage', app: 'reflect' },
    { name: 'reflect_archive', url: 'http://localhost:3000/archive', app: 'reflect' },
    { name: 'reflect_session_list', url: 'http://localhost:3000/session', app: 'reflect' },
    // Nexus
    { name: 'nexus_cockpit', url: 'http://localhost:3001', app: 'nexus' },
    { name: 'nexus_diagnostics', url: 'http://localhost:3001/diagnostics', app: 'nexus' },
    // Citadel
    { name: 'citadel_home', url: 'http://localhost:3005', app: 'citadel' },
    { name: 'citadel_dashboard', url: 'http://localhost:3005/dashboard', app: 'citadel' },
    // Ghost Command
    { name: 'ghost_command', url: 'http://localhost:5173', app: 'ghost' },
    { name: 'ghost_architect', url: 'http://localhost:5173/architect', app: 'ghost' },
    { name: 'ghost_vault', url: 'http://localhost:5173/vault', app: 'ghost' },
    // Rocket
    { name: 'rocket_home', url: 'http://localhost:4000', app: 'rocket' },
    { name: 'rocket_console', url: 'http://localhost:4000/console', app: 'rocket' },
];

const VIEWPORTS = {
    mobile: { width: 430, height: 932, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    tablet: { width: 820, height: 1180, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    desktop: { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    ultrawide: { width: 2560, height: 1440, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};

function findChrome() {
    const commonPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.CHROME_PATH
    ];
    return commonPaths.find(p => p && fs.existsSync(p));
}

/**
 * UI VALIDATION ENGINE
 * Runs in-browser checks for common UI issues
 */
async function validateUI(page, targetName, viewport) {
    const issues = [];

    const results = await page.evaluate((minTouch, minFont) => {
        const problems = [];

        // 1. OVERFLOW DETECTION — Check for horizontal overflow
        if (document.documentElement.scrollWidth > document.documentElement.clientWidth) {
            // collect top offenders (elements wider than viewport)
            const offenders = [];
            for (const el of Array.from(document.querySelectorAll('*')).slice(0, 200)) {
                try {
                    if (el.scrollWidth && el.scrollWidth > document.documentElement.clientWidth) {
                        offenders.push({ tag: el.tagName.toLowerCase(), class: (el.className || '').toString().substring(0, 120), width: el.scrollWidth });
                        if (offenders.length >= 8) break;
                    }
                } catch (e) {}
            }
            problems.push({
                type: 'OVERFLOW',
                severity: 'error',
                message: `Horizontal overflow detected: ${document.documentElement.scrollWidth}px > ${document.documentElement.clientWidth}px`,
                details: offenders
            });
        }

        // 2. CLIPPED TEXT DETECTION — Elements with overflow hidden and text that doesn't fit
        const allElements = document.querySelectorAll('*');
        let clippedCount = 0;
        for (const el of allElements) {
            const style = window.getComputedStyle(el);
            if (style.overflow === 'hidden' || style.overflowX === 'hidden' || style.overflowY === 'hidden') {
                if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) {
                    if (el.textContent && el.textContent.trim().length > 0 && el.children.length < 3) {
                        clippedCount++;
                        if (clippedCount <= 5) {
                            problems.push({
                                type: 'CLIP',
                                severity: 'warning',
                                message: `Clipped content in <${el.tagName.toLowerCase()}> class="${el.className?.substring?.(0, 60)}": scroll=${el.scrollWidth}x${el.scrollHeight} vs client=${el.clientWidth}x${el.clientHeight}`,
                                selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')
                            });
                        }
                    }
                }
            }
        }
        if (clippedCount > 5) {
            problems.push({ type: 'CLIP', severity: 'info', message: `+${clippedCount - 5} more clipped elements` });
        }

        // 3. TOUCH TARGET VALIDATION — Interactive elements must be >= 44px
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [onclick]');
        let smallTargets = 0;
        for (const el of interactiveElements) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                if (rect.width < minTouch || rect.height < minTouch) {
                    smallTargets++;
                    if (smallTargets <= 3) {
                        problems.push({
                            type: 'TOUCH_TARGET',
                            severity: 'warning',
                            message: `Small touch target <${el.tagName.toLowerCase()}>: ${Math.round(rect.width)}x${Math.round(rect.height)}px (min: ${minTouch}px)`,
                            selector: el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : '')
                        });
                    }
                }
            }
        }
        if (smallTargets > 3) {
            problems.push({ type: 'TOUCH_TARGET', severity: 'info', message: `+${smallTargets - 3} more small touch targets` });
        }

        // 4. FONT SIZE VALIDATION — No text below minimum
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, li, td, th, label, a, button');
        let tinyText = 0;
        for (const el of textElements) {
            if (el.textContent?.trim() && el.children.length === 0) {
                const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
                if (fontSize < minFont) {
                    tinyText++;
                    if (tinyText <= 3) {
                        problems.push({
                            type: 'FONT_SIZE',
                            severity: 'warning',
                            message: `Text "${el.textContent.trim().substring(0, 30)}" at ${fontSize}px (min: ${minFont}px)`,
                        });
                    }
                }
            }
        }
        if (tinyText > 3) {
            problems.push({ type: 'FONT_SIZE', severity: 'info', message: `+${tinyText - 3} more tiny text elements` });
        }

        // 5. OFFSCREEN ELEMENT DETECTION
        const viewW = document.documentElement.clientWidth;
        const viewH = document.documentElement.clientHeight;
        let offscreen = 0;
        for (const el of interactiveElements) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                if (rect.right < 0 || rect.left > viewW || rect.bottom < 0 || rect.top > viewH * 2) {
                    offscreen++;
                }
            }
        }
        if (offscreen > 0) {
            problems.push({
                type: 'OFFSCREEN',
                severity: 'info',
                message: `${offscreen} interactive elements positioned offscreen`
            });
        }

        // 6. Z-INDEX AUDIT
        const zElements = [];
        for (const el of allElements) {
            const z = window.getComputedStyle(el).zIndex;
            if (z !== 'auto' && parseInt(z) > 100) {
                zElements.push({ tag: el.tagName, z: parseInt(z), class: el.className?.substring?.(0, 40) });
            }
        }
        if (zElements.length > 0) {
            const maxZ = Math.max(...zElements.map(e => e.z));
            problems.push({
                type: 'Z_INDEX',
                severity: maxZ > 9999 ? 'warning' : 'info',
                message: `${zElements.length} high z-index elements (max: ${maxZ})`
            });
        }

        return problems;
    }, 44, 10);

    return results;
}

async function capture() {
    const mode = process.argv.includes('--validate') ? 'validate' :
        process.argv.includes('--full') ? 'full' : 'capture';
    const viewportArg = process.argv.find(a => a.startsWith('--viewport='))?.split('=')[1] || 'mobile';
    const targetArg = process.argv[2];

    console.log(`[MATRIX_CAPTURE v2.0] Initializing Neural Optical Array...`);
    console.log(`[MODE] ${mode.toUpperCase()} | Viewport: ${viewportArg}`);

    const executablePath = findChrome();
    if (!executablePath) {
        console.error('[FATAL] Chrome executable not found. Set CHROME_PATH env var.');
        process.exit(1);
    }

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const browser = await puppeteer.launch({
        executablePath,
        headless: 'new',
        defaultViewport: VIEWPORTS[viewportArg] || VIEWPORTS.mobile
    });

    console.log('[MATRIX_CAPTURE] Optical Array Online.');

    // Filter targets
    let activeTargets = TARGETS;
    if (targetArg && !targetArg.startsWith('--')) {
        activeTargets = TARGETS.filter(t => t.name === targetArg || t.app === targetArg);
    }

    if (activeTargets.length === 0) {
        console.error(`[ERROR] No targets found for: ${targetArg}`);
        console.log('Available:', TARGETS.map(t => t.name).join(', '));
        process.exit(1);
    }

    const allIssues = {};
    const ALL_VIEWPORTS_FLAG = process.argv.includes('--all-viewports');
    // Strict rule: default to mobile-only captures. Use `--all-viewports` to opt-in to other sizes.
    const viewportsToCapture = (mode === 'full' && !ALL_VIEWPORTS_FLAG)
        ? [['mobile', VIEWPORTS.mobile]]
        : mode === 'full' && ALL_VIEWPORTS_FLAG
            ? Object.entries(VIEWPORTS)
            : [[viewportArg, VIEWPORTS[viewportArg] || VIEWPORTS.mobile]];

    for (const target of activeTargets) {
        for (const [vpName, vp] of viewportsToCapture) {
            console.log(`\n[CAPTURE] ${target.name} @ ${vpName} (${vp.width}x${vp.height})...`);
            try {
                const page = await browser.newPage();
                await page.setViewport(vp);
                // Preload auth snapshot if present to bypass login/2FA
                try {
                    const authDir = path.join(__dirname, '..', 'auth');
                    const authPath = path.join(authDir, `${target.app}_auth.json`);
                    if (fs.existsSync(authPath)) {
                        const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
                        if (Array.isArray(auth.cookies) && auth.cookies.length) {
                            await page.setCookie(...auth.cookies);
                        }
                        if (auth.localStorage && typeof auth.localStorage === 'object') {
                            const origin = new URL(target.url).origin;
                            await page.goto(origin, { waitUntil: 'domcontentloaded' });
                            await page.evaluate((kv) => {
                                for (const k of Object.keys(kv)) {
                                    try { localStorage.setItem(k, kv[k]); } catch (e) {}
                                }
                            }, auth.localStorage);
                        }
                        console.log(`[AUTH] Loaded auth snapshot for ${target.name} from ${path.relative(__dirname, authPath)}`);
                    }
                } catch (e) {
                    console.warn('[AUTH] preload error:', e.message);
                }

                await page.goto(target.url, { waitUntil: 'networkidle0', timeout: 30000 });
                await new Promise(r => setTimeout(r, 2000)); // Let animations settle

                // CAPTURE
                if (mode !== 'validate') {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const filename = `${target.name}_${vpName}_${timestamp}.png`;
                    const filepath = path.join(OUTPUT_DIR, filename);
                    await page.screenshot({ path: filepath, fullPage: true });
                    console.log(`  [✓] Screenshot: ${filename}`);
                }

                // VALIDATE
                if (mode === 'validate' || mode === 'full') {
                    const issues = await validateUI(page, target.name, vpName);
                    const key = `${target.name}@${vpName}`;
                    allIssues[key] = issues;

                    if (issues.length > 0) {
                        const errors = issues.filter(i => i.severity === 'error');
                        const warnings = issues.filter(i => i.severity === 'warning');
                        const info = issues.filter(i => i.severity === 'info');
                        console.log(`  [AUDIT] ${errors.length} errors | ${warnings.length} warnings | ${info.length} info`);
                        for (const issue of issues) {
                            const icon = issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '⚠' : 'ℹ';
                            console.log(`    ${icon} [${issue.type}] ${issue.message}`);
                        }
                    } else {
                        console.log(`  [✓] No UI issues detected`);
                    }
                }

                await page.close();
            } catch (e) {
                console.error(`  [✗] Failed: ${e.message}`);
            }
        }
    }

    // Write validation report
    if (mode === 'validate' || mode === 'full') {
        const reportPath = path.join(OUTPUT_DIR, `ui_audit_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            mode,
            viewport: viewportArg,
            targets: activeTargets.map(t => t.name),
            issues: allIssues,
            summary: {
                totalTargets: Object.keys(allIssues).length,
                totalErrors: Object.values(allIssues).flat().filter(i => i.severity === 'error').length,
                totalWarnings: Object.values(allIssues).flat().filter(i => i.severity === 'warning').length,
                clean: Object.values(allIssues).filter(arr => arr.length === 0).length,
            }
        }, null, 2));
        console.log(`\n[REPORT] Written to: ${reportPath}`);
    }

    await browser.close();
    console.log('[MATRIX_CAPTURE v2.0] Session Complete. Optical Array Offline.');
}

capture();
