#!/usr/bin/env node
/* eslint-disable no-console */
const { createSupabaseFromEnv } = require('./_supabase_client.cjs');

function parseArgs(argv) {
    const mode = argv[0] || 'heartbeat';
    const json = argv.includes('--json');
    const limitArg = argv.find((a) => a.startsWith('--limit='));
    const limit = limitArg ? Number(limitArg.split('=')[1]) : (mode === 'heartbeat' ? 5 : 50);
    return {
        mode,
        json,
        limit: Number.isFinite(limit) && limit > 0 ? limit : 5
    };
}

function safeJsonParse(input) {
    try {
        return JSON.parse(input);
    } catch {
        return null;
    }
}

async function runHeartbeatAudit(supabase, limit) {
    let rows = [];
    try {
        const { data, error } = await supabase
            .from('system_heartbeats')
            .select('id,source,status,created_at,payload')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        rows = (Array.isArray(data) ? data : []).map((r) => ({
            id: r.id,
            source: r.source,
            status: r.status || 'silent',
            created_at: r.created_at,
            output: JSON.stringify(r.payload || {})
        }));
        if (rows.length === 0) throw new Error('EMPTY_SYSTEM_HEARTBEATS');
    } catch {
        const { data, error } = await supabase
            .from('ghost_bridge')
            .select('id,source,status,created_at,output')
            .eq('command', 'sys:heartbeat')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        rows = Array.isArray(data) ? data : [];
    }

    const bySource = {};
    for (const row of rows) {
        const source = row.source || 'unknown';
        if (!bySource[source]) bySource[source] = { count: 0, latestAt: row.created_at };
        bySource[source].count += 1;
        if (new Date(row.created_at).getTime() > new Date(bySource[source].latestAt).getTime()) {
            bySource[source].latestAt = row.created_at;
        }
    }
    return { rows, bySource };
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const supabase = createSupabaseFromEnv();

    if (args.mode === 'heartbeat' || args.mode === 'heartbeats') {
        const report = await runHeartbeatAudit(supabase, args.limit);
        if (args.json) {
            process.stdout.write(`${JSON.stringify(report)}\n`);
            return;
        }

        console.log('--- HEARTBEAT AUDIT ---');
        console.log(`rows=${report.rows.length}`);
        for (const [source, stats] of Object.entries(report.bySource)) {
            const age = Math.round((Date.now() - new Date(stats.latestAt).getTime()) / 1000);
            console.log(`source=${source} count=${stats.count} latest_age=${age}s`);
        }
        console.log('');
        for (const row of report.rows) {
            const meta = safeJsonParse(row.output || '{}');
            const svc = meta?.services ? Object.keys(meta.services).length : 0;
            console.log(`[${row.created_at}] source=${row.source} status=${row.status} services=${svc}`);
        }
        return;
    }

    if (args.mode === 'bridge-audit') {
        const { data, error } = await supabase
            .from('ghost_bridge')
            .select('id,command,source,status,created_at')
            .order('created_at', { ascending: false })
            .limit(args.limit);
        if (error) throw error;
        const report = { rows: data || [] };
        if (args.json) {
            process.stdout.write(`${JSON.stringify(report)}\n`);
            return;
        }
        console.log('--- BRIDGE AUDIT ---');
        for (const row of report.rows) {
            console.log(`[${row.created_at}] ${row.command} source=${row.source} status=${row.status}`);
        }
        return;
    }

    if (args.mode === 'schema-audit') {
        const { data: failedRows, error: failErr } = await supabase
            .from('ghost_bridge')
            .select('id,command,source,status,created_at,output')
            .eq('status', 'failed')
            .ilike('output', '%[SCHEMA] Rejecting command%')
            .order('created_at', { ascending: false })
            .limit(args.limit);
        if (failErr) throw failErr;

        const { data: metricRows, error: metricErr } = await supabase
            .from('ghost_bridge')
            .select('id,created_at,output')
            .eq('command', 'sys:schema_metrics')
            .order('created_at', { ascending: false })
            .limit(5);
        if (metricErr) throw metricErr;

        const latestMetric = Array.isArray(metricRows) && metricRows.length
            ? safeJsonParse(metricRows[0].output || '{}')
            : null;

        const report = {
            failedRows: failedRows || [],
            latestMetric,
            metricSamples: (metricRows || []).map((r) => ({
                id: r.id,
                created_at: r.created_at,
                output: safeJsonParse(r.output || '{}')
            }))
        };

        if (args.json) {
            process.stdout.write(`${JSON.stringify(report)}\n`);
            return;
        }

        console.log('--- SCHEMA AUDIT ---');
        if (latestMetric) {
            console.log(`mode=${latestMetric.mode} rejected=${latestMetric.rejected} warned=${latestMetric.warned}`);
            if (latestMetric.reasons && typeof latestMetric.reasons === 'object') {
                for (const [reason, count] of Object.entries(latestMetric.reasons)) {
                    console.log(`reason=${reason} count=${count}`);
                }
            }
        } else {
            console.log('no schema metrics found');
        }
        console.log('');
        console.log(`recent_failed_schema_rows=${report.failedRows.length}`);
        for (const row of report.failedRows) {
            console.log(`[${row.created_at}] id=${row.id} source=${row.source} output=${String(row.output || '').slice(0, 160)}`);
        }
        return;
    }

    throw new Error(`Unsupported mode: ${args.mode}`);
}

main().catch((err) => {
    console.error(`[diagnostics_core] ${err?.message || String(err)}`);
    process.exit(1);
});
