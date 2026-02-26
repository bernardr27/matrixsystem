import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const MATRIX_ROOT = process.env.MATRIX_ROOT || 'g:\\matrix';
const LOGS_DIR = path.join(MATRIX_ROOT, 'logs');

const APPS = [
    { name: 'Reflect', port: 3000, dir: 'apps/reflect' },
    { name: 'Nexus', port: 3001, dir: 'apps/nexus' },
    { name: 'Ghost Command', port: 5173, dir: 'apps/ghost-command' },
    { name: 'RocketCommand', port: 4000, dir: 'apps/rocket-command' },
];

interface FixResult {
    action: string;
    status: 'success' | 'failed' | 'skipped';
    detail: string;
}

/**
 * GET /api/fix-issues — Returns categorized issues with suggested fixes
 */
export async function GET() {
    try {
        const issues = scanAndCategorize();
        return NextResponse.json({ issues, timestamp: new Date().toISOString() });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/**
 * POST /api/fix-issues — Attempt to auto-fix issues
 * Body: { actions: string[] }  — which fix categories to run
 *   'restart-services'  — restart any offline services
 *   'install-deps'      — npm install for missing node_modules
 *   'rebuild-apps'      — rebuild apps missing .next
 *   'archive-logs'      — archive old log files to clear stale issue count
 *   'fix-config'        — fix known config issues (triage.config.json parse errors)
 *   'all'               — run all available fixes
 */
export async function POST(req: NextRequest) {
    try {
        const { actions } = await req.json() as { actions: string[] };
        if (!actions || !Array.isArray(actions) || actions.length === 0) {
            return NextResponse.json({ error: 'Missing actions array' }, { status: 400 });
        }

        const runAll = actions.includes('all');
        const results: FixResult[] = [];

        // 1. Fix config files
        if (runAll || actions.includes('fix-config')) {
            results.push(...(await fixConfigs()));
        }

        // 2. Install missing dependencies
        if (runAll || actions.includes('install-deps')) {
            results.push(...(await installMissingDeps()));
        }

        // 3. Restart offline services
        if (runAll || actions.includes('restart-services')) {
            results.push(...(await restartOfflineServices()));
        }

        // 4. Rebuild apps missing .next
        if (runAll || actions.includes('rebuild-apps')) {
            results.push(...(await rebuildApps()));
        }

        // 5. Archive stale logs
        if (runAll || actions.includes('archive-logs')) {
            results.push(...archiveStaleLogs());
        }

        const succeeded = results.filter(r => r.status === 'success').length;
        const failed = results.filter(r => r.status === 'failed').length;
        const skipped = results.filter(r => r.status === 'skipped').length;

        return NextResponse.json({
            summary: `${succeeded} fixed, ${failed} failed, ${skipped} skipped`,
            succeeded,
            failed,
            skipped,
            results,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/* ── Categorize Issues ─────────────────────────────────── */

interface CategorizedIssue {
    category: string;
    fixAction: string;
    count: number;
    samples: string[];
    severity: 'critical' | 'warning' | 'info';
}

function scanAndCategorize(): CategorizedIssue[] {
    const categories: Record<string, CategorizedIssue> = {};

    const logFiles = getLogFiles();
    for (const file of logFiles) {
        try {
            const content = fs.readFileSync(path.join(LOGS_DIR, file), 'utf8');
            const lines = content.split('\n');
            for (const line of lines) {
                if (!/error|fail|crash|fatal|exception/i.test(line)) continue;
                const trimmed = line.trim();
                if (!trimmed) continue;

                // Categorize by pattern
                if (/HEALTH FAIL/i.test(trimmed)) {
                    addToCategory(categories, 'Service Health Failures', 'restart-services', trimmed, 'warning');
                } else if (/triage\.config\.json/i.test(trimmed)) {
                    addToCategory(categories, 'Config Parse Errors', 'fix-config', trimmed, 'warning');
                } else if (/row-level security|RLS/i.test(trimmed)) {
                    addToCategory(categories, 'Supabase RLS Policy Errors', 'archive-logs', trimmed, 'info');
                } else if (/npm|node_modules|dependency|package/i.test(trimmed)) {
                    addToCategory(categories, 'Dependency Issues', 'install-deps', trimmed, 'critical');
                } else if (/build|compile|webpack|turbopack/i.test(trimmed)) {
                    addToCategory(categories, 'Build Failures', 'rebuild-apps', trimmed, 'critical');
                } else if (/ECONNREFUSED|timeout|disconnect|upstream connect/i.test(trimmed)) {
                    addToCategory(categories, 'Connection / Network Errors', 'restart-services', trimmed, 'warning');
                } else if (/crash|fatal|SIGTERM|SIGKILL/i.test(trimmed)) {
                    addToCategory(categories, 'Process Crashes', 'restart-services', trimmed, 'critical');
                } else {
                    addToCategory(categories, 'Other Log Errors', 'archive-logs', trimmed, 'info');
                }
            }
        } catch { /* skip unreadable */ }
    }

    return Object.values(categories).sort((a, b) => {
        const sev = { critical: 0, warning: 1, info: 2 };
        return sev[a.severity] - sev[b.severity];
    });
}

function addToCategory(
    cats: Record<string, CategorizedIssue>,
    category: string,
    fixAction: string,
    sample: string,
    severity: CategorizedIssue['severity']
) {
    if (!cats[category]) {
        cats[category] = { category, fixAction, count: 0, samples: [], severity };
    }
    cats[category].count++;
    if (cats[category].samples.length < 3) {
        cats[category].samples.push(sample.substring(0, 160));
    }
}

function getLogFiles(): string[] {
    try {
        if (!fs.existsSync(LOGS_DIR)) return [];
        return fs.readdirSync(LOGS_DIR).filter(f => f.endsWith('.log') || f.endsWith('.md'));
    } catch {
        return [];
    }
}

/* ── Fix Actions ───────────────────────────────────────── */

async function fixConfigs(): Promise<FixResult[]> {
    const results: FixResult[] = [];
    const triagePath = path.join(MATRIX_ROOT, 'triage.config.json');

    try {
        if (fs.existsSync(triagePath)) {
            const raw = fs.readFileSync(triagePath, 'utf8');
            try {
                JSON.parse(raw);
                results.push({ action: 'Validate triage.config.json', status: 'skipped', detail: 'Already valid JSON' });
            } catch {
                // Try to fix — strip BOM, trailing commas, comments
                let fixed = raw
                    .replace(/^\uFEFF/, '')             // strip BOM
                    .replace(/,\s*([\]}])/g, '$1')      // trailing commas
                    .replace(/\/\/.*$/gm, '')            // single-line comments
                    .replace(/\/\*[\s\S]*?\*\//g, '');   // block comments
                try {
                    JSON.parse(fixed);
                    fs.writeFileSync(triagePath, fixed, 'utf8');
                    results.push({ action: 'Fix triage.config.json', status: 'success', detail: 'Repaired JSON syntax (stripped BOM/comments/trailing commas)' });
                } catch {
                    results.push({ action: 'Fix triage.config.json', status: 'failed', detail: 'Could not auto-repair — manual edit needed' });
                }
            }
        } else {
            // Create a default config so sentinel stops erroring
            const defaultConfig = JSON.stringify({
                enabled: true,
                interval: 300000,
                checks: ['ports', 'health', 'logs']
            }, null, 2);
            fs.writeFileSync(triagePath, defaultConfig, 'utf8');
            results.push({ action: 'Create triage.config.json', status: 'success', detail: 'Created default config to stop sentinel parse errors' });
        }
    } catch (err) {
        results.push({ action: 'Fix triage.config.json', status: 'failed', detail: String(err) });
    }

    return results;
}

async function installMissingDeps(): Promise<FixResult[]> {
    const results: FixResult[] = [];

    for (const app of APPS) {
        const nmPath = path.join(MATRIX_ROOT, app.dir, 'node_modules');
        if (fs.existsSync(nmPath)) {
            results.push({ action: `Install deps for ${app.name}`, status: 'skipped', detail: 'node_modules already exists' });
            continue;
        }

        const appDir = path.join(MATRIX_ROOT, app.dir);
        if (!fs.existsSync(path.join(appDir, 'package.json'))) {
            results.push({ action: `Install deps for ${app.name}`, status: 'skipped', detail: 'No package.json found' });
            continue;
        }

        try {
            await execAsync('npm install', { cwd: appDir, timeout: 120000 });
            results.push({ action: `Install deps for ${app.name}`, status: 'success', detail: 'npm install completed' });
        } catch (err) {
            const e = err as { stderr?: string };
            results.push({ action: `Install deps for ${app.name}`, status: 'failed', detail: (e.stderr || String(err)).substring(0, 200) });
        }
    }

    return results;
}

async function restartOfflineServices(): Promise<FixResult[]> {
    const results: FixResult[] = [];

    for (const app of APPS) {
        // Skip RocketCommand — we're running inside it
        if (app.port === 4000) continue;

        const isUp = await checkPortAlive(app.port);
        if (isUp) {
            results.push({ action: `Restart ${app.name}`, status: 'skipped', detail: `Port ${app.port} already responding` });
            continue;
        }

        const appDir = path.join(MATRIX_ROOT, app.dir);
        if (!fs.existsSync(path.join(appDir, 'package.json'))) {
            results.push({ action: `Restart ${app.name}`, status: 'skipped', detail: 'No package.json' });
            continue;
        }

        try {
            // Start with detached process so it outlives this request
            const cmd = `Start-Process -FilePath "npx" -ArgumentList "next","dev","-p","${app.port}" -WorkingDirectory "${appDir}" -WindowStyle Hidden -PassThru | Select-Object -ExpandProperty Id`;
            const { stdout } = await execAsync(`powershell -Command "${cmd}"`, { timeout: 15000 });
            const pid = stdout.trim();
            results.push({ action: `Restart ${app.name}`, status: 'success', detail: `Started on port ${app.port} (PID: ${pid})` });
        } catch (err) {
            const e = err as { stderr?: string };
            results.push({ action: `Restart ${app.name}`, status: 'failed', detail: (e.stderr || String(err)).substring(0, 200) });
        }
    }

    return results;
}

async function rebuildApps(): Promise<FixResult[]> {
    const results: FixResult[] = [];

    for (const app of APPS) {
        const nextDir = path.join(MATRIX_ROOT, app.dir, '.next');
        if (fs.existsSync(nextDir)) {
            results.push({ action: `Rebuild ${app.name}`, status: 'skipped', detail: '.next directory already exists' });
            continue;
        }

        const appDir = path.join(MATRIX_ROOT, app.dir);
        if (!fs.existsSync(path.join(appDir, 'package.json'))) {
            results.push({ action: `Rebuild ${app.name}`, status: 'skipped', detail: 'No package.json' });
            continue;
        }

        try {
            await execAsync('npx next build', { cwd: appDir, timeout: 180000, maxBuffer: 2 * 1024 * 1024 });
            results.push({ action: `Rebuild ${app.name}`, status: 'success', detail: 'Build completed' });
        } catch (err) {
            const e = err as { stderr?: string; stdout?: string };
            const output = ((e.stdout || '') + (e.stderr || '')).substring(0, 200);
            results.push({ action: `Rebuild ${app.name}`, status: 'failed', detail: output || String(err) });
        }
    }

    return results;
}

function archiveStaleLogs(): FixResult[] {
    const results: FixResult[] = [];

    try {
        const archiveDir = path.join(LOGS_DIR, 'archived');
        if (!fs.existsSync(archiveDir)) {
            fs.mkdirSync(archiveDir, { recursive: true });
        }

        const now = Date.now();
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
        const logFiles = getLogFiles();
        let archived = 0;

        for (const file of logFiles) {
            const filePath = path.join(LOGS_DIR, file);
            try {
                const stat = fs.statSync(filePath);
                // Archive files older than 2 days, or log files that have grown very large
                if ((now - stat.mtimeMs > twoDaysMs) || stat.size > 500000) {
                    const stamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
                    const archiveName = `${stamp}_${file}`;
                    fs.copyFileSync(filePath, path.join(archiveDir, archiveName));
                    // Truncate the original (don't delete — other processes may be writing)
                    fs.writeFileSync(filePath, `[${new Date().toISOString()}] Log archived and reset by RocketCommand issue fixer\n`, 'utf8');
                    archived++;
                }
            } catch { /* skip locked files */ }
        }

        if (archived > 0) {
            results.push({ action: 'Archive stale logs', status: 'success', detail: `Archived ${archived} log file(s) to logs/archived/ and reset originals` });
        } else {
            results.push({ action: 'Archive stale logs', status: 'skipped', detail: 'No logs older than 2 days or over 500KB' });
        }
    } catch (err) {
        results.push({ action: 'Archive stale logs', status: 'failed', detail: String(err) });
    }

    return results;
}

/* ── Helpers ───────────────────────────────────────────── */

function checkPortAlive(port: number): Promise<boolean> {
    return new Promise(resolve => {
        const http = require('http');
        const req = http.request(
            { hostname: 'localhost', port, path: '/', method: 'HEAD', timeout: 3000 },
            () => resolve(true)
        );
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
        req.end();
    });
}
