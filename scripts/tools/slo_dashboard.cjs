#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { createSupabaseFromEnv } = require('./_supabase_client.cjs');

const ROOT = path.resolve(__dirname, '..', '..');
const DIAG_DIR = path.join(ROOT, 'docs', 'diagnostics');

function pct(num, den) {
    if (!den) return 0;
    return Math.round((num / den) * 1000) / 10;
}

async function main() {
    fs.mkdirSync(DIAG_DIR, { recursive: true });
    const supabase = createSupabaseFromEnv();
    const now = Date.now();
    const fifteenMinAgoIso = new Date(now - 15 * 60 * 1000).toISOString();

    const { data: hbRows, error: hbErr } = await supabase
        .from('ghost_bridge')
        .select('created_at,source')
        .eq('command', 'sys:heartbeat')
        .gte('created_at', fifteenMinAgoIso)
        .order('created_at', { ascending: false })
        .limit(500);
    if (hbErr) throw hbErr;

    const { data: cmdRows, error: cmdErr } = await supabase
        .from('ghost_bridge')
        .select('status,created_at,command')
        .in('status', ['executed', 'completed', 'failed'])
        .gte('created_at', fifteenMinAgoIso)
        .order('created_at', { ascending: false })
        .limit(1000);
    if (cmdErr) throw cmdErr;

    const heartbeatAges = (hbRows || []).map((r) => Math.max(0, Math.round((now - new Date(r.created_at).getTime()) / 1000)));
    heartbeatAges.sort((a, b) => a - b);
    const p95Idx = heartbeatAges.length ? Math.floor(0.95 * (heartbeatAges.length - 1)) : 0;

    const totalCmd = (cmdRows || []).length;
    const failedCmd = (cmdRows || []).filter((r) => r.status === 'failed').length;
    const successCmd = totalCmd - failedCmd;

    const report = {
        generatedAt: new Date().toISOString(),
        windowMinutes: 15,
        slos: {
            heartbeat_freshness_p95_sec: heartbeatAges.length ? heartbeatAges[p95Idx] : null,
            command_success_rate_pct: pct(successCmd, totalCmd),
            command_failure_rate_pct: pct(failedCmd, totalCmd),
            sample_sizes: {
                heartbeat: heartbeatAges.length,
                commands: totalCmd
            }
        }
    };

    const outJson = path.join(DIAG_DIR, 'slo_latest.json');
    fs.writeFileSync(outJson, JSON.stringify(report, null, 2));

    const outMd = path.join(DIAG_DIR, 'slo_latest.md');
    const md = [
        '# Matrix SLO Dashboard',
        '',
        `- Generated: ${report.generatedAt}`,
        `- Window: ${report.windowMinutes} minutes`,
        '',
        `- Heartbeat freshness p95: ${report.slos.heartbeat_freshness_p95_sec ?? 'n/a'} sec`,
        `- Command success rate: ${report.slos.command_success_rate_pct}%`,
        `- Command failure rate: ${report.slos.command_failure_rate_pct}%`,
        `- Samples: heartbeat=${report.slos.sample_sizes.heartbeat}, commands=${report.slos.sample_sizes.commands}`
    ].join('\n');
    fs.writeFileSync(outMd, `${md}\n`);

    if (process.argv.includes('--json')) {
        process.stdout.write(`${JSON.stringify(report)}\n`);
    } else {
        console.log(`[slo_dashboard] wrote ${path.relative(ROOT, outJson)} and ${path.relative(ROOT, outMd)}`);
    }
}

main().catch((err) => {
    console.error(`[slo_dashboard] ${err?.message || String(err)}`);
    process.exit(1);
});
