#!/usr/bin/env node
/* eslint-disable no-console */
const { createSupabaseFromEnv } = require('./_supabase_client.cjs');

function parseArgs(argv) {
    const staleSecArg = argv.find((a) => a.startsWith('--stale-sec='));
    const staleSec = staleSecArg ? Number(staleSecArg.split('=')[1]) : 120;
    const json = argv.includes('--json');
    return {
        staleSec: Number.isFinite(staleSec) && staleSec >= 30 ? staleSec : 120,
        json
    };
}

function ageSeconds(dateString) {
    if (!dateString) return null;
    const ms = Date.parse(dateString);
    if (Number.isNaN(ms)) return null;
    return Math.round((Date.now() - ms) / 1000);
}

async function latestBySource(supabase, source) {
    try {
        const { data, error } = await supabase
            .from('system_heartbeats')
            .select('id,source,created_at,payload')
            .eq('source', source)
            .order('created_at', { ascending: false })
            .limit(1);
        if (error) throw error;
        return Array.isArray(data) && data.length ? data[0] : null;
    } catch {
        const { data, error } = await supabase
            .from('ghost_bridge')
            .select('id,source,created_at,output')
            .eq('command', 'sys:heartbeat')
            .eq('source', source)
            .order('created_at', { ascending: false })
            .limit(1);
        if (error) throw error;
        return Array.isArray(data) && data.length ? data[0] : null;
    }
}

async function emitAlert(supabase, severity, title, message, metadata) {
    const payload = { severity, title, message, ...metadata };
    await Promise.allSettled([
        supabase.from('system_alerts').insert({
            source: 'slo_guard',
            severity,
            title,
            message,
            metadata: payload
        }),
        supabase.from('ghost_bridge').insert({
            command: 'sys:alert',
            source: 'slo_guard',
            status: 'broadcast',
            output: JSON.stringify(payload)
        })
    ]);
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const supabase = createSupabaseFromEnv();

    const [sentinel, runner] = await Promise.all([
        latestBySource(supabase, 'nexus_sentinel'),
        latestBySource(supabase, 'ghost_runner')
    ]);

    const sentinelAge = ageSeconds(sentinel?.created_at);
    const runnerAge = ageSeconds(runner?.created_at);
    const sentinelStale = sentinelAge == null || sentinelAge > args.staleSec;
    const runnerStale = runnerAge == null || runnerAge > args.staleSec;
    const ok = !sentinelStale && !runnerStale;

    if (!ok) {
        const message = `Heartbeat breach: sentinel_age=${sentinelAge ?? 'none'}s runner_age=${runnerAge ?? 'none'}s threshold=${args.staleSec}s`;
        await emitAlert(supabase, 'critical', 'Heartbeat SLO Breach', message, {
            sentinelAge,
            runnerAge,
            thresholdSec: args.staleSec
        });
    }

    const report = {
        ok,
        thresholdSec: args.staleSec,
        sentinelAge,
        runnerAge,
        timestamp: new Date().toISOString()
    };

    if (args.json) process.stdout.write(`${JSON.stringify(report)}\n`);
    else console.log(`[slo_guard] ok=${ok} sentinel_age=${sentinelAge ?? 'none'}s runner_age=${runnerAge ?? 'none'}s threshold=${args.staleSec}s`);
    process.exit(ok ? 0 : 2);
}

main().catch((err) => {
    console.error(`[slo_guard] ${err?.message || String(err)}`);
    process.exit(1);
});
