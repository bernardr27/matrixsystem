#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DIAG_DIR = path.join(ROOT, 'docs', 'diagnostics');
const ENV_PATH = path.join(ROOT, '.env');

function readEnvFile() {
    if (!fs.existsSync(ENV_PATH)) return {};
    const raw = fs.readFileSync(ENV_PATH, 'utf8');
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx <= 0) continue;
        env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
    return env;
}

function runNode(script, args = [], timeout = 120000) {
    return new Promise((resolve) => {
        try {
            execFile(process.execPath, [script, ...args], {
                cwd: ROOT,
                windowsHide: true,
                timeout,
                maxBuffer: 8 * 1024 * 1024
            }, (error, stdout, stderr) => {
                const out = String(stdout || '').trim();
                const err = String(stderr || '').trim();
                let parsed = null;
                try { parsed = out ? JSON.parse(out) : null; } catch {}
                resolve({
                    ok: !error,
                    stdout: out,
                    stderr: err,
                    parsed
                });
            });
        } catch (error) {
            resolve({
                ok: false,
                stdout: '',
                stderr: '',
                parsed: null,
                error: error?.message || String(error)
            });
        }
    });
}

function connectorSummary(env) {
    const checks = [
        { id: 'supabase', keys: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
        { id: 'github', keys: ['GITHUB_TOKEN', 'GITHUB_REPO'] },
        { id: 'aws', keys: ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'] },
        { id: 'redis', keys: ['REDIS_URL'] },
        { id: 'vercel', keys: ['VERCEL_TOKEN'] }
    ];
    return checks.map((c) => {
        const present = c.keys.filter((k) => Boolean(env[k] || process.env[k]));
        return {
            connector: c.id,
            required_keys: c.keys,
            present_keys: present,
            ok: present.length === c.keys.length
        };
    });
}

function writeMarkdown(report) {
    const lines = [
        '# Connector Health Dashboard',
        '',
        `- Generated: ${report.generatedAt}`,
        '',
        '## Credentials',
        ...report.credentials.map((row) => `- ${row.connector}: ${row.ok ? 'OK' : 'MISSING'} (${row.present_keys.length}/${row.required_keys.length})`),
        '',
        '## Live Checks',
        `- credential_doctor: ${report.live.credential_doctor.ok ? 'OK' : 'FAIL'}`,
        `- cloud_preflight: ${report.live.cloud_preflight.ok ? 'OK' : 'FAIL'}`,
        `- heartbeat_diag: ${report.live.heartbeat_diag.ok ? 'OK' : 'FAIL'}`
    ];
    return `${lines.join('\n')}\n`;
}

async function main() {
    fs.mkdirSync(DIAG_DIR, { recursive: true });
    const env = readEnvFile();
    const credentials = connectorSummary(env);

    const credentialDoctor = await runNode('scripts/tools/credential_doctor.cjs', ['--json'], 90000);
    const cloudPreflight = await runNode('scripts/tools/cloud_preflight.cjs', ['--json', '--skip-github'], 120000);
    const heartbeatDiag = await runNode('scripts/tools/diagnostics_core.cjs', ['heartbeat', '--json', '--limit=8'], 90000);

    const report = {
        generatedAt: new Date().toISOString(),
        credentials,
        live: {
            credential_doctor: { ok: credentialDoctor.ok, data: credentialDoctor.parsed, error: credentialDoctor.ok ? null : (credentialDoctor.error || credentialDoctor.stderr || credentialDoctor.stdout) },
            cloud_preflight: { ok: cloudPreflight.ok, data: cloudPreflight.parsed, error: cloudPreflight.ok ? null : (cloudPreflight.error || cloudPreflight.stderr || cloudPreflight.stdout) },
            heartbeat_diag: { ok: heartbeatDiag.ok, data: heartbeatDiag.parsed, error: heartbeatDiag.ok ? null : (heartbeatDiag.error || heartbeatDiag.stderr || heartbeatDiag.stdout) }
        }
    };

    const jsonPath = path.join(DIAG_DIR, 'connector_health_latest.json');
    const mdPath = path.join(DIAG_DIR, 'connector_health_latest.md');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    fs.writeFileSync(mdPath, writeMarkdown(report));

    if (process.argv.includes('--json')) {
        process.stdout.write(`${JSON.stringify(report)}\n`);
    } else {
        console.log(`[connector_health] wrote ${path.relative(ROOT, jsonPath)} and ${path.relative(ROOT, mdPath)}`);
    }
}

main().catch((err) => {
    console.error(`[connector_health] ${err?.message || String(err)}`);
    process.exit(1);
});
