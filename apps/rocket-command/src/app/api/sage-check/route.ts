import { NextResponse } from 'next/server';
import http from 'http';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/sage-check — Sage Environment Protocol
 * Returns full environment health: ports, deps, builds, Ollama, logs
 * Zero-cost local checks. No API credits spent.
 */

const MATRIX_ROOT = process.env.MATRIX_ROOT || 'g:\\matrix';

const APPS = [
    { name: 'Reflect', port: 3000, dir: 'apps/reflect' },
    { name: 'Nexus', port: 3001, dir: 'apps/nexus' },
    { name: 'Ghost Command', port: 5173, dir: 'apps/ghost-command' },
    { name: 'RocketCommand', port: 4000, dir: 'apps/rocket-command' },
];

async function checkPort(port: number): Promise<{ port: number; status: string; latency: number }> {
    const start = Date.now();
    return new Promise(resolve => {
        const req = http.request(
            { hostname: 'localhost', port, path: '/', method: 'HEAD', timeout: 3000 },
            (res) => resolve({ port, status: 'up', latency: Date.now() - start })
        );
        req.on('error', () => resolve({ port, status: 'down', latency: Date.now() - start }));
        req.on('timeout', () => { req.destroy(); resolve({ port, status: 'timeout', latency: Date.now() - start }); });
        req.end();
    });
}

function scanLogs(): { count: number; recent: { file: string; line: number; text: string }[] } {
    const logDir = path.join(MATRIX_ROOT, 'logs');
    const issues: { file: string; line: number; text: string }[] = [];

    try {
        if (!fs.existsSync(logDir)) return { count: 0, recent: [] };
        const files = fs.readdirSync(logDir).filter(f => f.endsWith('.log') || f.endsWith('.md'));
        for (const file of files.slice(-5)) {
            try {
                const content = fs.readFileSync(path.join(logDir, file), 'utf8');
                const lines = content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    if (/error|fail|crash|fatal|exception/i.test(lines[i])) {
                        issues.push({ file, line: i + 1, text: lines[i].trim().substring(0, 200) });
                    }
                }
            } catch { /* skip */ }
        }
    } catch { /* dir not found */ }

    return { count: issues.length, recent: issues.slice(0, 10) };
}

function scanPRDs() {
    const prdDir = path.join(MATRIX_ROOT, 'docs', 'prd');
    const result: { file: string; total: number; done: number; remaining: number }[] = [];

    try {
        if (!fs.existsSync(prdDir)) return result;
        const files = fs.readdirSync(prdDir).filter(f => f.endsWith('.md'));
        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(prdDir, file), 'utf8');
                const unchecked = (content.match(/- \[ \]/g) || []).length;
                const checked = (content.match(/- \[x\]/gi) || []).length;
                result.push({ file, total: checked + unchecked, done: checked, remaining: unchecked });
            } catch { /* skip */ }
        }
    } catch { /* dir not found */ }

    return result;
}

export async function GET() {
    try {
        const portResults = await Promise.all(APPS.map(app => checkPort(app.port)));
        const ollama = await checkPort(11434);

        const services: Record<string, { port: number; status: string; latency: number }> = {};
        APPS.forEach((app, i) => {
            services[app.name] = portResults[i];
        });

        const deps = APPS.map(app => ({
            name: app.name,
            nodeModules: fs.existsSync(path.join(MATRIX_ROOT, app.dir, 'node_modules')),
            lockFile: fs.existsSync(path.join(MATRIX_ROOT, app.dir, 'package-lock.json')),
        }));

        const builds = APPS.map(app => ({
            name: app.name,
            hasBuild: fs.existsSync(path.join(MATRIX_ROOT, app.dir, '.next')),
        }));

        const logs = scanLogs();
        const prds = scanPRDs();

        const allUp = portResults.every(p => p.status === 'up');
        const allDeps = deps.every(d => d.nodeModules);
        const allBuilt = builds.every(b => b.hasBuild);

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            overall: allUp && allDeps && allBuilt ? 'HEALTHY' : 'ISSUES_DETECTED',
            services,
            ollama: { status: ollama.status, latency: ollama.latency },
            dependencies: deps,
            builds,
            logs,
            prds,
            protocols: {
                sage: 'Environment validation — zero API credits',
                ralph: 'PRD-driven autonomous loop — core/sage/ralph-core.mjs',
                pipeline: 'Phone → Antigravity → PRD → Ralph → Claude Code → Deploy',
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Sage check failed', details: String(error) },
            { status: 500 }
        );
    }
}
