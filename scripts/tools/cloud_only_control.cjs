#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { Octokit } = require('@octokit/rest');

const ROOT = path.resolve(__dirname, '..', '..');
const ENV_PATH = path.join(ROOT, '.env');

function parseArgs(argv) {
    const command = (argv[0] || 'status').toLowerCase();
    const workflowIdx = argv.indexOf('--workflow');
    const refIdx = argv.indexOf('--ref');
    const dryRun = argv.includes('--dry-run');
    return {
        command,
        workflow: workflowIdx >= 0 && argv[workflowIdx + 1] ? String(argv[workflowIdx + 1]) : 'matrix-shadow.yml',
        ref: refIdx >= 0 && argv[refIdx + 1] ? String(argv[refIdx + 1]) : 'main',
        dryRun
    };
}

function loadDotEnv() {
    if (!fs.existsSync(ENV_PATH)) return;
    const raw = fs.readFileSync(ENV_PATH, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx <= 0) continue;
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        if (key && process.env[key] == null) process.env[key] = value;
    }
}

function parseRepo(input) {
    if (!input) return null;
    const cleaned = String(input)
        .replace(/^https?:\/\/github.com\//i, '')
        .replace(/\.git$/i, '');
    const parts = cleaned.split('/');
    if (parts.length >= 2) return { owner: parts[0], repo: parts[1] };
    return null;
}

function repoFromPackage() {
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
        return parseRepo(pkg?.repository?.url);
    } catch {
        return null;
    }
}

async function isPortListening(port) {
    return await new Promise((resolve) => {
        const socket = net.connect({ host: '127.0.0.1', port });
        socket.setTimeout(600);
        socket.once('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.once('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.once('error', () => {
            socket.destroy();
            resolve(false);
        });
    });
}

async function showStatus() {
    const ports = [3000, 3001, 3005, 3333, 4000, 5173];
    const checks = await Promise.all(ports.map((p) => isPortListening(p)));
    const active = ports.filter((_, i) => checks[i]);
    console.log(`cloud_mode=${String(process.env.MATRIX_CLOUD_MODE || '')}`);
    console.log(`github_token=${process.env.GITHUB_TOKEN ? 'set' : 'missing'}`);
    console.log(`repo=${process.env.GITHUB_REPO || 'from-package'}`);
    console.log(`local_listeners=${active.length ? active.join(',') : 'none'}`);
}

function upsertEnv(updates) {
    const existing = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/) : [];
    const map = new Map();
    existing.forEach((line, i) => {
        const idx = line.indexOf('=');
        if (idx > 0) map.set(line.slice(0, idx).trim(), i);
    });

    const next = [...existing];
    for (const [key, value] of Object.entries(updates)) {
        const line = `${key}=${value}`;
        if (map.has(key)) next[map.get(key)] = line;
        else next.push(line);
    }
    fs.writeFileSync(ENV_PATH, `${next.join('\n').replace(/\n+$/, '')}\n`, 'utf8');
}

async function dispatch(action, workflow, ref, dryRun) {
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (!token) throw new Error('Missing GITHUB_TOKEN/GH_TOKEN');
    const repo = parseRepo(process.env.GITHUB_REPO) || repoFromPackage() || { owner: 'bernardr27', repo: 'matrixsystem' };
    const octokit = new Octokit({ auth: token, userAgent: 'matrix-cloud-control/1.0' });

    // Avoid dispatch spam: if a run is already queued/in-progress, don't enqueue another.
    const runs = await octokit.actions.listWorkflowRuns({
        owner: repo.owner,
        repo: repo.repo,
        workflow_id: workflow,
        per_page: 10
    });
    const activeRun = (runs.data.workflow_runs || []).find((r) => r.status === 'queued' || r.status === 'in_progress');
    if (activeRun) {
        console.log(
            `skip_dispatch active_run=${activeRun.id} status=${activeRun.status} created_at=${activeRun.created_at} ` +
            `url=${activeRun.html_url}`
        );
        return;
    }

    if (dryRun) {
        console.log(`[dry-run] dispatch ${workflow}@${ref} action=${action} repo=${repo.owner}/${repo.repo}`);
        return;
    }
    await octokit.actions.createWorkflowDispatch({
        owner: repo.owner,
        repo: repo.repo,
        workflow_id: workflow,
        ref,
        inputs: { action }
    });
    console.log(`dispatched ${workflow}@${ref} action=${action} repo=${repo.owner}/${repo.repo}`);
}

async function main() {
    loadDotEnv();
    const args = parseArgs(process.argv.slice(2));
    if (args.command === 'status') return showStatus();
    if (args.command === 'enforce') {
        upsertEnv({
            MATRIX_CLOUD_MODE: 'true',
            MATRIX_ALLOW_LOCAL_SENTINEL: '0',
            MATRIX_ALLOW_LOCAL_RUNNER: '0'
        });
        console.log('enforced cloud-only env flags');
        return;
    }
    if (args.command === 'ignite') return dispatch('deploy', args.workflow, args.ref, args.dryRun);
    if (args.command === 'heartbeat') return dispatch('heartbeat', args.workflow, args.ref, args.dryRun);
    if (args.command === 'build') return dispatch('build', args.workflow, args.ref, args.dryRun);
    if (args.command === 'troubleshoot') return dispatch('troubleshoot', args.workflow, args.ref, args.dryRun);
    throw new Error(`Unknown command: ${args.command}`);
}

main().catch((err) => {
    console.error(err.message || String(err));
    process.exit(1);
});
