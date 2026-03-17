#!/usr/bin/env node
/* eslint-disable no-console */
const path = require('node:path');
const fs = require('node:fs');
const { spawn, execSync } = require('node:child_process');
const { createSupabaseFromEnv } = require('./_supabase_client.cjs');

const ROOT = path.resolve(__dirname, '..', '..');
const SENTINEL_PATH = path.join(ROOT, 'apps', 'ghost-command', 'core', 'sentinel.cjs');
const RUNNER_PATH = path.join(ROOT, 'apps', 'ghost-command', 'core', 'ghost-runner.cjs');
const SENTINEL_LOCK = path.join(ROOT, 'apps', 'ghost-command', 'core', 'nexus-sentinel.lock');
const RUNNER_LOCK = path.join(ROOT, 'apps', 'ghost-command', 'core', 'ghost-runner.lock');

function parseArgs(argv) {
    const intervalSecArg = argv.find((a) => a.startsWith('--interval-sec='));
    const staleSecArg = argv.find((a) => a.startsWith('--stale-sec='));
    const once = argv.includes('--once');
    const intervalSec = intervalSecArg ? Number(intervalSecArg.split('=')[1]) : 30;
    const staleSec = staleSecArg ? Number(staleSecArg.split('=')[1]) : 120;
    return {
        once,
        intervalSec: Number.isFinite(intervalSec) && intervalSec >= 10 ? intervalSec : 30,
        staleSec: Number.isFinite(staleSec) && staleSec >= 30 ? staleSec : 120
    };
}

function ageSeconds(dateString) {
    if (!dateString) return null;
    const t = Date.parse(dateString);
    if (Number.isNaN(t)) return null;
    return Math.round((Date.now() - t) / 1000);
}

function loadDotEnv() {
    const envPath = path.join(ROOT, '.env');
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf8');
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

function isPidAlive(pid) {
    if (!Number.isFinite(pid) || pid <= 0) return false;
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

function clearStaleLock(lockPath) {
    if (!fs.existsSync(lockPath)) return false;
    try {
        const raw = fs.readFileSync(lockPath, 'utf8').trim();
        const pid = Number(raw);
        if (!isPidAlive(pid)) {
            fs.unlinkSync(lockPath);
            return true;
        }
    } catch {
        try {
            fs.unlinkSync(lockPath);
            return true;
        } catch {
            return false;
        }
    }
    return false;
}

function isProcessRunning(keyword) {
    try {
        if (process.platform === 'win32') {
            const psCmd = [
                '$procs = Get-CimInstance Win32_Process',
                `| Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*${keyword}*' }`,
                '| Select-Object -First 1 -ExpandProperty ProcessId'
            ].join(' ');
            const out = execSync(`powershell -NoProfile -Command "${psCmd}"`, {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
                windowsHide: true
            }).trim();
            return Number.isFinite(Number(out)) && Number(out) > 0;
        }

        const out = execSync(`pgrep -af "${keyword}"`, {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            windowsHide: true
        }).trim();
        return out.length > 0;
    } catch {
        return false;
    }
}

function spawnSentinel() {
    if (!fs.existsSync(SENTINEL_PATH)) {
        throw new Error(`missing sentinel script: ${SENTINEL_PATH}`);
    }
    const child = spawn(process.execPath, [SENTINEL_PATH, '--headless', '--boot'], {
        cwd: path.dirname(SENTINEL_PATH),
        detached: true,
        stdio: 'ignore',
        env: process.env,
        windowsHide: true
    });
    child.unref();
}

function spawnRunner() {
    if (!fs.existsSync(RUNNER_PATH)) {
        throw new Error(`missing runner script: ${RUNNER_PATH}`);
    }
    const child = spawn(process.execPath, [RUNNER_PATH], {
        cwd: path.dirname(RUNNER_PATH),
        detached: true,
        stdio: 'ignore',
        env: process.env,
        windowsHide: true
    });
    child.unref();
}

function ensureLocalBootstrap() {
    const cloudOnly = String(process.env.MATRIX_CLOUD_MODE || '').toLowerCase() === 'true';
    if (cloudOnly) {
        return {
            sentinelStarted: false,
            runnerStarted: false,
            lockCleared: false,
            cloudOnly: true
        };
    }

    const lockCleared = [
        clearStaleLock(SENTINEL_LOCK),
        clearStaleLock(RUNNER_LOCK)
    ].some(Boolean);
    const sentinelRunning = isProcessRunning('sentinel.cjs');
    if (!sentinelRunning) {
        spawnSentinel();
    }

    const runnerRunning = isProcessRunning('ghost-runner.cjs');
    if (!runnerRunning) {
        spawnRunner();
    }

    return {
        sentinelStarted: !sentinelRunning,
        runnerStarted: !runnerRunning,
        lockCleared,
        cloudOnly: false
    };
}

async function queueBootstrap(supabase, source) {
    const cloudOnly = String(process.env.MATRIX_CLOUD_MODE || '').toLowerCase() === 'true';
    const commands = cloudOnly ? ['sys:cloud_ignite'] : ['sys:start_runner', 'sys:ignite'];
    for (const command of commands) {
        // Dedupe pending command to avoid queue floods.
        const { data: existing, error: selErr } = await supabase
            .from('ghost_bridge')
            .select('id,created_at')
            .eq('source', source)
            .eq('status', 'pending')
            .eq('command', command)
            .order('created_at', { ascending: false })
            .limit(1);
        if (selErr) throw selErr;
        if (Array.isArray(existing) && existing.length > 0) continue;

        const { error: insErr } = await supabase.from('ghost_bridge').insert({
            command,
            status: 'pending',
            source
        });
        if (insErr) throw insErr;
    }
}

async function cycle(config) {
    loadDotEnv();
    const source = 'cloud_self_heal_daemon';
    const supabase = createSupabaseFromEnv();
    const start = Date.now();

    const { data: hbRows, error: hbErr } = await supabase
        .from('ghost_bridge')
        .select('id,created_at,source')
        .eq('command', 'sys:heartbeat')
        .order('created_at', { ascending: false })
        .limit(50);
    if (hbErr) throw hbErr;

    const rows = Array.isArray(hbRows) ? hbRows : [];
    const latestBySource = new Map();
    for (const row of rows) {
        const src = row?.source || 'unknown';
        if (!latestBySource.has(src)) latestBySource.set(src, row);
    }

    const sentinelAge = ageSeconds(latestBySource.get('nexus_sentinel')?.created_at);
    const runnerAge = ageSeconds(latestBySource.get('ghost_runner')?.created_at);
    const sentinelStale = sentinelAge == null || sentinelAge > config.staleSec;
    const runnerStale = runnerAge == null || runnerAge > config.staleSec;
    const stale = sentinelStale || runnerStale;
    let bootstrap = { sentinelStarted: false, runnerStarted: false, lockCleared: false, cloudOnly: false };

    if (stale) {
        bootstrap = ensureLocalBootstrap();
        await queueBootstrap(supabase, source);
    }

    const ms = Date.now() - start;
    const status = stale ? 'recover_queued' : 'healthy';
    console.log(
        `[cloud_self_heal] ${new Date().toISOString()} status=${status} ` +
        `sentinel_age=${sentinelAge ?? 'none'}s runner_age=${runnerAge ?? 'none'}s ` +
        `sentinel_started=${bootstrap.sentinelStarted ? 'yes' : 'no'} ` +
        `runner_started=${bootstrap.runnerStarted ? 'yes' : 'no'} ` +
        `lock_cleared=${bootstrap.lockCleared ? 'yes' : 'no'} ` +
        `cloud_only=${bootstrap.cloudOnly ? 'yes' : 'no'} cycle_ms=${ms}`
    );
}

async function main() {
    const config = parseArgs(process.argv.slice(2));
    console.log(`[cloud_self_heal] started interval=${config.intervalSec}s stale=${config.staleSec}s once=${config.once ? 'true' : 'false'}`);

    if (config.once) {
        try {
            await cycle(config);
            process.exit(0);
        } catch (err) {
            console.error(`[cloud_self_heal] cycle_failed ${err?.message || String(err)}`);
            process.exit(1);
        }
    }

    let running = false;
    const runSafe = async () => {
        if (running) return;
        running = true;
        try {
            await cycle(config);
        } catch (err) {
            console.error(`[cloud_self_heal] cycle_failed ${err?.message || String(err)}`);
        } finally {
            running = false;
        }
    };

    await runSafe();
    setInterval(runSafe, config.intervalSec * 1000);
}

main().catch((err) => {
    console.error(`[cloud_self_heal] fatal ${err?.message || String(err)}`);
    process.exit(1);
});
