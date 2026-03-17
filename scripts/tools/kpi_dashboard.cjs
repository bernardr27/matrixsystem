#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { createSupabaseFromEnv } = require('./_supabase_client.cjs');

const ROOT = path.resolve(__dirname, '..', '..');
const DIAG_DIR = path.join(ROOT, 'docs', 'diagnostics');

function average(values) {
    if (!values.length) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

async function queryKpis() {
    const supabase = createSupabaseFromEnv();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: commandRows, error: cmdErr } = await supabase
        .from('ghost_bridge')
        .select('command,status,source,created_at,output')
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(2000);
    if (cmdErr) throw cmdErr;
    const rows = Array.isArray(commandRows) ? commandRows : [];

    const ignites = rows.filter((r) => r.command === 'sys:ignite');
    const heartbeats = rows.filter((r) => r.command === 'sys:heartbeat');
    const failures = rows.filter((r) => r.status === 'failed');
    const successes = rows.filter((r) => r.status === 'completed' || r.status === 'executed');

    const tto = [];
    for (const ignite of ignites) {
        const heartbeat = heartbeats.find((h) =>
            String(h.source || '') === String(ignite.source || '') &&
            new Date(h.created_at).getTime() >= new Date(ignite.created_at).getTime()
        );
        if (!heartbeat) continue;
        const sec = Math.max(0, Math.round((new Date(heartbeat.created_at).getTime() - new Date(ignite.created_at).getTime()) / 1000));
        tto.push(sec);
    }

    const offlineFlags = heartbeats.map((h) => {
        let parsed = null;
        try { parsed = JSON.parse(h.output || '{}'); } catch {}
        const services = parsed && parsed.services && typeof parsed.services === 'object' ? Object.values(parsed.services) : [];
        if (!services.length) return 0;
        const offline = services.filter((svc) => {
            const status = String(svc?.status || '').toLowerCase();
            return status && status !== 'online' && status !== 'healthy';
        });
        return offline.length > 0 ? 1 : 0;
    });

    return {
        generatedAt: new Date().toISOString(),
        windowHours: 24,
        kpis: {
            ignite_runs: ignites.length,
            heartbeat_samples: heartbeats.length,
            command_success_rate_pct: rows.length ? Math.round((successes.length / rows.length) * 1000) / 10 : null,
            command_failure_rate_pct: rows.length ? Math.round((failures.length / rows.length) * 1000) / 10 : null,
            heartbeat_offline_rate_pct: offlineFlags.length ? Math.round((offlineFlags.reduce((a, b) => a + b, 0) / offlineFlags.length) * 1000) / 10 : null,
            time_to_online_avg_sec: average(tto),
            time_to_online_samples: tto.length
        }
    };
}

function writeMarkdown(report) {
    const k = report.kpis;
    const lines = [
        '# Matrix KPI Dashboard',
        '',
        `- Generated: ${report.generatedAt}`,
        `- Window: ${report.windowHours} hours`,
        '',
        `- Ignite runs: ${k.ignite_runs}`,
        `- Heartbeat samples: ${k.heartbeat_samples}`,
        `- Command success rate: ${k.command_success_rate_pct ?? 'n/a'}%`,
        `- Command failure rate: ${k.command_failure_rate_pct ?? 'n/a'}%`,
        `- Heartbeat offline rate: ${k.heartbeat_offline_rate_pct ?? 'n/a'}%`,
        `- Time to online avg: ${k.time_to_online_avg_sec ?? 'n/a'} sec`,
        `- Time to online samples: ${k.time_to_online_samples}`
    ];
    return `${lines.join('\n')}\n`;
}

async function main() {
    fs.mkdirSync(DIAG_DIR, { recursive: true });
    const report = await queryKpis();
    const jsonPath = path.join(DIAG_DIR, 'kpi_dashboard_latest.json');
    const mdPath = path.join(DIAG_DIR, 'kpi_dashboard_latest.md');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    fs.writeFileSync(mdPath, writeMarkdown(report));
    if (process.argv.includes('--json')) {
        process.stdout.write(`${JSON.stringify(report)}\n`);
    } else {
        console.log(`[kpi_dashboard] wrote ${path.relative(ROOT, jsonPath)} and ${path.relative(ROOT, mdPath)}`);
    }
}

main().catch((err) => {
    console.error(`[kpi_dashboard] ${err?.message || String(err)}`);
    process.exit(1);
});

