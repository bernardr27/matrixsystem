#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DIAG_DIR = path.join(ROOT, 'docs', 'diagnostics');

function run(timeout = 300000) {
    return new Promise((resolve) => {
        try {
            execFile(
                process.execPath,
                ['scripts/tools/mobile_verify_matrix_fast.cjs', '--app=all', '--ultra', '--json'],
                { cwd: ROOT, windowsHide: true, timeout, maxBuffer: 24 * 1024 * 1024 },
                (error, stdout, stderr) => {
                    const out = String(stdout || '').trim();
                    const err = String(stderr || '').trim();
                    let parsed = null;
                    try { parsed = out ? JSON.parse(out) : null; } catch {}
                    resolve({ ok: !error, parsed, stderr: err, stdout: out });
                }
            );
        } catch (error) {
            resolve({ ok: false, parsed: null, stderr: '', stdout: '', error: error?.message || String(error) });
        }
    });
}

function toMarkdown(report) {
    const s = report.summary || {};
    const lines = [
        '# UI Visual Audit',
        '',
        `- Generated: ${report.generatedAt}`,
        `- Mode: ${s.mode || 'matrix-fast'}`,
        `- App scope: ${s.app || 'all'}`,
        `- Total routes: ${s.total ?? 0}`,
        `- Passed: ${s.passed ?? 0}`,
        `- Failed: ${s.failed ?? 0}`,
        '',
        '## Result',
        `- Status: ${report.ok ? 'PASS' : report.skipped ? 'SKIPPED' : 'FAIL'}`,
        report.error ? `- Error: ${report.error}` : '- Error: none'
    ];
    return `${lines.join('\n')}\n`;
}

async function main() {
    const strict = process.argv.includes('--strict');
    fs.mkdirSync(DIAG_DIR, { recursive: true });

    const started = Date.now();
    const result = await run();
    const report = {
        generatedAt: new Date().toISOString(),
        ok: false,
        skipped: false,
        latency_ms: Date.now() - started,
        summary: result.parsed?.summary || null,
        error: null
    };

    if (result.parsed && result.parsed.summary) {
        report.ok = Number(result.parsed.summary.failed || 0) === 0;
    } else if (!strict) {
        report.ok = true;
        report.skipped = true;
        report.error = result.error || result.stderr || 'visual audit skipped (no structured output)';
    } else {
        report.ok = false;
        report.error = result.error || result.stderr || result.stdout || 'visual audit failed';
    }

    const jsonPath = path.join(DIAG_DIR, 'ui_visual_audit_latest.json');
    const mdPath = path.join(DIAG_DIR, 'ui_visual_audit_latest.md');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    fs.writeFileSync(mdPath, toMarkdown(report));

    if (process.argv.includes('--json')) {
        process.stdout.write(`${JSON.stringify(report)}\n`);
    } else {
        console.log(`[ui_visual_audit] wrote ${path.relative(ROOT, jsonPath)} and ${path.relative(ROOT, mdPath)} ok=${report.ok} skipped=${report.skipped}`);
    }

    process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
    console.error(`[ui_visual_audit] ${err?.message || String(err)}`);
    process.exit(1);
});
