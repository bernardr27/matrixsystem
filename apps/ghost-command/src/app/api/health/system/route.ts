import { NextResponse } from 'next/server';
import os from 'os';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function normalizeServiceUrl(url: string | undefined, fallback: string): string {
    const value = (url || '').trim();
    if (!value) return fallback;
    if (value.includes('localhost:3002')) return 'http://localhost:3333';
    return value;
}

function ageSeconds(dateString?: string | null): number | null {
    if (!dateString) return null;
    const ms = Date.parse(dateString);
    if (Number.isNaN(ms)) return null;
    return Math.round((Date.now() - ms) / 1000);
}

function firstEnv(...keys: string[]): string {
    for (const key of keys) {
        const value = (process.env[key] || '').trim();
        if (value) return value;
    }
    return '';
}

export async function GET() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = (usedMem / totalMem) * 100;

    const cpuUsage = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    const reflectUrl = normalizeServiceUrl(process.env.REFLECT_URL, 'http://localhost:3000');
    const nexusUrl = normalizeServiceUrl(process.env.NEXUS_URL, 'http://localhost:3001');
    const runnerUrl = normalizeServiceUrl(process.env.RUNNER_URL, 'http://localhost:3333');
    const rocketUrl = normalizeServiceUrl(process.env.ROCKET_URL, 'http://localhost:4000');
    const citadelUrl = normalizeServiceUrl(process.env.CITADEL_URL, 'http://localhost:3005');

    const serviceChecks = await Promise.allSettled([
        fetch(`${reflectUrl}/api/health`, { signal: AbortSignal.timeout(2000) }).then((r) => r.ok),
        fetch(`${nexusUrl}/api/health`, { signal: AbortSignal.timeout(2000) }).then((r) => r.ok),
        fetch(`${runnerUrl}/status`, { signal: AbortSignal.timeout(2000) }).then((r) => r.ok),
        fetch(`${rocketUrl}/api/health`, { signal: AbortSignal.timeout(2000) }).then((r) => r.ok),
        fetch(`${citadelUrl}/api/health`, { signal: AbortSignal.timeout(2000) }).then((r) => r.ok)
    ]);

    const services = {
        reflect: serviceChecks[0].status === 'fulfilled' && serviceChecks[0].value ? 'online' : 'offline',
        nexus: serviceChecks[1].status === 'fulfilled' && serviceChecks[1].value ? 'online' : 'offline',
        runner: serviceChecks[2].status === 'fulfilled' && serviceChecks[2].value ? 'online' : 'offline',
        rocketCommand: serviceChecks[3].status === 'fulfilled' && serviceChecks[3].value ? 'online' : 'offline',
        citadel: serviceChecks[4].status === 'fulfilled' && serviceChecks[4].value ? 'online' : 'offline',
        ghostCommand: 'online'
    };

    let heartbeat = {
        sentinelAgeSec: null as number | null,
        runnerAgeSec: null as number | null,
        fresh: false
    };

    const supabaseUrl = firstEnv('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = firstEnv(
        'SUPABASE_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_SECRET_KEY',
        'SUPABASE_ANON_KEY',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );

    if (supabaseUrl && supabaseKey) {
        try {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data } = await supabase
                .from('system_heartbeats')
                .select('source,created_at')
                .in('source', ['nexus_sentinel', 'ghost_runner'])
                .order('created_at', { ascending: false })
                .limit(20);

            const rows = Array.isArray(data) ? data : [];
            const sentinel = rows.find((r) => r.source === 'nexus_sentinel');
            const runner = rows.find((r) => r.source === 'ghost_runner');
            const sentinelAge = ageSeconds(sentinel?.created_at);
            const runnerAge = ageSeconds(runner?.created_at);

            heartbeat = {
                sentinelAgeSec: sentinelAge,
                runnerAgeSec: runnerAge,
                fresh: sentinelAge != null && runnerAge != null && sentinelAge <= 120 && runnerAge <= 120
            };
        } catch {
            // Keep API healthy even if DB check fails.
        }
    }

    return NextResponse.json({
        status: heartbeat.fresh ? 'healthy' : 'degraded',
        service: 'ghost-command',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        system: {
            cpu: Math.round(cpuUsage * 10) / 10,
            ram: Math.round(memPercent * 10) / 10,
            totalMemGB: Math.round((totalMem / 1073741824) * 10) / 10,
            freeMemGB: Math.round((freeMem / 1073741824) * 10) / 10,
            platform: os.platform(),
            hostname: os.hostname(),
            cores: cpus.length,
            loadAvg: os.loadavg()
        },
        services,
        heartbeat
    });
}
