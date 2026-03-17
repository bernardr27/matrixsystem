#!/usr/bin/env node
/* eslint-disable no-console */
const { execFile } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

function run(cmd, args, timeout = 120000) {
    return new Promise((resolve) => {
        execFile(cmd, args, { cwd: ROOT, windowsHide: true, timeout, maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => {
            resolve({
                ok: !error,
                stdout: String(stdout || '').trim(),
                stderr: String(stderr || '').trim(),
                code: error && typeof error.code === 'number' ? error.code : 0
            });
        });
    });
}

async function main() {
    const node = process.execPath;
    const checks = [];

    checks.push(['credential_doctor', await run(node, ['scripts/tools/credential_doctor.cjs', '--json'], 45000)]);
    checks.push(['env_check', await run(node, ['scripts/tools/env_manager.cjs', 'check'], 45000)]);
    checks.push(['cloud_preflight', await run(node, ['scripts/tools/cloud_preflight.cjs', '--json', '--skip-github'], 90000)]);
    checks.push(['diag_schema', await run(node, ['scripts/tools/diagnostics_core.cjs', 'schema-audit', '--json', '--limit=25'], 90000)]);
    checks.push(['slo_dashboard', await run(node, ['scripts/tools/slo_dashboard.cjs', '--json'], 90000)]);
    checks.push(['ui_visual_audit', await run(node, ['scripts/tools/ui_visual_audit.cjs', '--json'], 300000)]);

    let score = 100;
    const details = [];
    for (const [name, r] of checks) {
        const ok = r.ok;
        if (!ok) score -= 20;
        details.push({ name, ok, code: r.code, detail: ok ? 'ok' : (r.stderr || r.stdout || 'failed') });
    }
    if (score < 0) score = 0;

    const report = { ok: details.every((d) => d.ok), score, checks: details, generatedAt: new Date().toISOString() };
    if (process.argv.includes('--json')) {
        process.stdout.write(`${JSON.stringify(report)}\n`);
    } else {
        console.log(`[release_certify] ok=${report.ok} score=${report.score}`);
        for (const d of report.checks) {
            console.log(` - ${d.name}: ${d.ok ? 'OK' : 'FAIL'}`);
        }
    }
    process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
    console.error(`[release_certify] ${err?.message || String(err)}`);
    process.exit(1);
});
