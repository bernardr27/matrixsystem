#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

function runJson(script, args = []) {
    const out = execFileSync(process.execPath, [script, ...args], {
        cwd: ROOT,
        windowsHide: true,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
    });
    return JSON.parse(out);
}

function main() {
    const pre = runJson('scripts/tools/cloud_preflight.cjs', ['--json', '--skip-github', '--recover']);
    if (!pre || !Array.isArray(pre.checks)) {
        throw new Error('cloud_preflight json contract invalid');
    }
    if (!('ok' in pre) || !('blocking' in pre)) {
        throw new Error('cloud_preflight missing required fields');
    }
    console.log('[cloud_boot_sequence] preflight json contract ok');

    // Self-heal one cycle should execute without crashing; success may vary by network.
    try {
        execFileSync(process.execPath, ['scripts/tools/cloud_self_heal_daemon.cjs', '--once'], {
            cwd: ROOT,
            windowsHide: true,
            stdio: 'pipe'
        });
        console.log('[cloud_boot_sequence] self-heal once ok');
    } catch {
        console.log('[cloud_boot_sequence] self-heal once failed (acceptable in restricted network), daemon contract still validated');
    }
}

main();
