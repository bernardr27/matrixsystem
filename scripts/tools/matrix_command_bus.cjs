#!/usr/bin/env node
/* eslint-disable no-console */
const { execFile } = require('node:child_process');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.resolve(__dirname, '..', '..');

const COMMANDS = {
    'matrix.workflow.list': { type: 'node', file: 'scripts/tools/workflow_recipes.cjs', args: ['list', '--json'] },
    'matrix.workflow.run': { type: 'node', file: 'scripts/tools/workflow_recipes.cjs', argsFromPayload: (p) => ['run', String(p.recipeId || ''), '--json'] },
    'matrix.cloud.ignite': { type: 'npm', script: 'cloud:control:ignite' },
    'matrix.cloud.heartbeat': { type: 'npm', script: 'cloud:control:heartbeat' },
    'matrix.cloud.preflight': { type: 'npm', script: 'cloud:preflight' },
    'matrix.release.certify': { type: 'npm', script: 'certify:release' },
    'matrix.diag.connectors': { type: 'npm', script: 'diag:connectors' },
    'matrix.diag.kpi': { type: 'npm', script: 'diag:kpi' }
};

function npmCmd() {
    return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function parseArgs(argv) {
    const cmd = argv.find((a) => a.startsWith('--command='))?.split('=')[1] || '';
    const source = argv.find((a) => a.startsWith('--source='))?.split('=')[1] || 'matrix-launcher';
    const payloadJson = argv.find((a) => a.startsWith('--payload='))?.split('=').slice(1).join('=') || '{}';
    const json = argv.includes('--json');
    const dryRun = argv.includes('--dry-run');
    return { cmd, source, payloadJson, json, dryRun };
}

function normalizeEnvelope(args) {
    let payload = {};
    try {
        payload = JSON.parse(args.payloadJson);
    } catch {
        throw new Error('Invalid --payload JSON');
    }
    const idempotencyKey = payload.idempotencyKey || crypto.randomUUID();
    const envelope = {
        command: args.cmd,
        source: args.source,
        timestamp: new Date().toISOString(),
        idempotencyKey,
        payload
    };
    const missing = [];
    if (!envelope.command) missing.push('command');
    if (!envelope.source) missing.push('source');
    if (!envelope.timestamp) missing.push('timestamp');
    if (!envelope.idempotencyKey) missing.push('idempotencyKey');
    if (missing.length) throw new Error(`Invalid envelope: missing ${missing.join(',')}`);
    return envelope;
}

function runProcess(cmd, args) {
    return new Promise((resolve) => {
        const startedAt = Date.now();
        execFile(cmd, args, {
            cwd: ROOT,
            windowsHide: true,
            timeout: 15 * 60 * 1000,
            maxBuffer: 8 * 1024 * 1024
        }, (error, stdout, stderr) => {
            resolve({
                ok: !error,
                code: error && typeof error.code === 'number' ? error.code : 0,
                stdout: String(stdout || '').trim(),
                stderr: String(stderr || '').trim(),
                latency_ms: Date.now() - startedAt
            });
        });
    });
}

async function execute(envelope) {
    const action = COMMANDS[envelope.command];
    if (!action) {
        return {
            ok: false,
            action: envelope.command,
            resource: 'matrix-command-bus',
            latency_ms: 0,
            error: `Unknown command: ${envelope.command}`
        };
    }

    if (envelope.command === 'matrix.workflow.list') {
        const recipesPath = path.join(ROOT, 'config', 'runtime', 'workflow_recipes.json');
        const raw = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));
        return {
            ok: true,
            action: envelope.command,
            resource: 'config/runtime/workflow_recipes.json',
            latency_ms: 0,
            error: null,
            data: raw
        };
    }

    if (envelope.dryRun) {
        return {
            ok: true,
            action: envelope.command,
            resource: action.type === 'npm' ? action.script : action.file,
            latency_ms: 0,
            error: null,
            data: { dryRun: true, payload: envelope.payload || {} }
        };
    }

    let result;
    if (action.type === 'npm') {
        result = await runProcess(npmCmd(), ['run', action.script]);
    } else if (action.type === 'node') {
        const args = typeof action.argsFromPayload === 'function' ? action.argsFromPayload(envelope.payload || {}) : (action.args || []);
        if (args.some((a) => String(a).trim() === '')) {
            return {
                ok: false,
                action: envelope.command,
                resource: action.file,
                latency_ms: 0,
                error: 'Missing required payload fields for command'
            };
        }
        result = await runProcess(process.execPath, [action.file, ...args]);
    } else {
        return {
            ok: false,
            action: envelope.command,
            resource: 'matrix-command-bus',
            latency_ms: 0,
            error: `Unsupported action type: ${action.type}`
        };
    }

    let parsed = null;
    try {
        parsed = result.stdout ? JSON.parse(result.stdout) : null;
    } catch {
        parsed = null;
    }

    return {
        ok: result.ok,
        action: envelope.command,
        resource: action.type === 'npm' ? action.script : action.file,
        latency_ms: result.latency_ms,
        error: result.ok ? null : (result.stderr || result.stdout || result.error || `exit ${result.code}`),
        data: parsed
    };
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const envelope = normalizeEnvelope(args);
    envelope.dryRun = args.dryRun;
    const response = await execute(envelope);

    if (args.json) {
        process.stdout.write(`${JSON.stringify(response)}\n`);
    } else {
        console.log(JSON.stringify(response, null, 2));
    }
    process.exit(response.ok ? 0 : 1);
}

main().catch((err) => {
    const output = {
        ok: false,
        action: 'matrix-command-bus',
        resource: 'matrix-command-bus',
        latency_ms: 0,
        error: err?.message || String(err)
    };
    process.stdout.write(`${JSON.stringify(output)}\n`);
    process.exit(1);
});
