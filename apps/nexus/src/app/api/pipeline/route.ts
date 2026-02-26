import { NextResponse } from 'next/server';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { createAnonSupabaseClientFromEnv } from '@matrix-lib/supabase/admin';

/**
 * GET /api/pipeline — Pipeline & environment status
 * Returns: service ports, deps, builds, Ollama, active PRDs, Ralph status
 * This is the Sage Protocol check exposed as an API route.
 */

const MATRIX_ROOT = process.env.MATRIX_ROOT || 'g:\\matrix';

const APPS = [
    { name: 'Reflect', port: 3000, dir: 'apps/reflect' },
    { name: 'Nexus', port: 3001, dir: 'apps/nexus' },
    { name: 'Ghost Command', port: 5173, dir: 'apps/ghost-command' },
    { name: 'RocketCommand', port: 4000, dir: 'apps/rocket-command' },
];
const supabase = createAnonSupabaseClientFromEnv(process.env);

async function checkPort(port: number): Promise<{ port: number; status: string }> {
    return new Promise(resolve => {
        const req = http.request(
            { hostname: 'localhost', port, path: '/', method: 'HEAD', timeout: 2000 },
            () => resolve({ port, status: 'up' })
        );
        req.on('error', () => resolve({ port, status: 'down' }));
        req.on('timeout', () => { req.destroy(); resolve({ port, status: 'timeout' }); });
        req.end();
    });
}

function scanPRDs(): { active: string[]; completed: string[] } {
    const prdDir = path.join(MATRIX_ROOT, 'docs', 'prd');
    const active: string[] = [];
    const completed: string[] = [];

    try {
        if (!fs.existsSync(prdDir)) return { active, completed };
        const files = fs.readdirSync(prdDir).filter(f => f.endsWith('.md'));

        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(prdDir, file), 'utf8');
                const unchecked = (content.match(/- \[ \]/g) || []).length;
                const checked = (content.match(/- \[x\]/gi) || []).length;

                if (unchecked === 0 && checked > 0) {
                    completed.push(file);
                } else if (unchecked > 0) {
                    active.push(file);
                }
            } catch { /* skip */ }
        }
    } catch { /* dir not found */ }

    return { active, completed };
}

export async function GET() {
    try {
        // Check all ports in parallel
        const portResults = await Promise.all(APPS.map(app => checkPort(app.port)));
        const services: Record<string, { port: number; status: string }> = {};
        APPS.forEach((app, i) => {
            services[app.name] = portResults[i];
        });

        // Check Ollama
        const ollama = await checkPort(11434);

        // Check dependencies
        const deps = APPS.map(app => ({
            name: app.name,
            installed: fs.existsSync(path.join(MATRIX_ROOT, app.dir, 'node_modules')),
        }));

        // Check builds
        const builds = APPS.map(app => ({
            name: app.name,
            built: fs.existsSync(path.join(MATRIX_ROOT, app.dir, '.next')),
        }));

        // Scan PRDs
        const prds = scanPRDs();

        let autopilot: {
            status: string;
            score: number | null;
            failedChecks: string[];
            lastRunAt: string | null;
            mode: string | null;
        } = {
            status: 'unknown',
            score: null,
            failedChecks: [],
            lastRunAt: null,
            mode: null
        };
        let maintenance: {
            active: boolean;
            status: string;
            lastCommand: string | null;
            lastRunAt: string | null;
        } = {
            active: false,
            status: 'idle',
            lastCommand: null,
            lastRunAt: null
        };

        if (supabase) {
            try {
                const { data } = await supabase
                    .from('ghost_bridge')
                    .select('command,status,output,created_at')
                    .in('command', ['sys:autopilot', 'sys:autopilot_full'])
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (data) {
                    autopilot.status = data.status || 'unknown';
                    autopilot.lastRunAt = data.created_at || null;
                    autopilot.mode = data.command === 'sys:autopilot_full' ? 'full' : 'quick';
                    try {
                        const parsed = typeof data.output === 'string' ? JSON.parse(data.output) : data.output;
                        autopilot.score = parsed?.summary?.healthScore ?? null;
                        autopilot.failedChecks = Array.isArray(parsed?.summary?.failedChecks) ? parsed.summary.failedChecks : [];
                    } catch { }
                }
            } catch { }

            try {
                const { data: maintenanceData } = await supabase
                    .from('ghost_bridge')
                    .select('command,status,created_at')
                    .in('command', ['sys:maintenance_window', 'sys:maintenance_exit', 'sys:emergency_recover'])
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (maintenanceData) {
                    maintenance.lastCommand = maintenanceData.command || null;
                    maintenance.lastRunAt = maintenanceData.created_at || null;
                    maintenance.status = maintenanceData.status || 'unknown';
                    maintenance.active =
                        (maintenanceData.command === 'sys:maintenance_window' || maintenanceData.command === 'sys:emergency_recover') &&
                        ['pending', 'executing', 'processing'].includes(String(maintenanceData.status || '').toLowerCase());
                }
            } catch { }
        }

        // Overall health
        const healthy = portResults.every(p => p.status === 'up') &&
                        deps.every(d => d.installed) &&
                        builds.every(b => b.built);

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            healthy,
            services,
            ollama: ollama.status,
            dependencies: deps,
            builds,
            prds,
            autopilot,
            maintenance,
            pipeline: {
                antigravity: 'Antigravity — Primary build environment',
                ralph: 'Ralph Loop — PRD-driven autonomous engine',
                sage: `Sage/Ollama — ${ollama.status === 'up' ? 'Online' : 'Offline'}`,
                claudeCode: 'Claude Code — Agent within Antigravity',
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Pipeline check failed', message: String(error) },
            { status: 500 }
        );
    }
}
