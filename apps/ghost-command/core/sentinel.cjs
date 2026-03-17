process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[CRITICAL] Uncaught Exception:', err);
});

const { createClient } = require('@supabase/supabase-js');
const childProcess = require('child_process');
const PROCESS_EVENT_LOG = require('path').join(__dirname, '..', '..', '..', 'logs', 'process_launch_events.jsonl');
const appendProcessLaunchEvent = (event) => {
    const payload = {
        timestamp: new Date().toISOString(),
        service: 'nexus_sentinel',
        ...event
    };
    try {
        const fsSafe = require('fs');
        const pathSafe = require('path');
        const dir = pathSafe.dirname(PROCESS_EVENT_LOG);
        if (!fsSafe.existsSync(dir)) fsSafe.mkdirSync(dir, { recursive: true });
        fsSafe.appendFileSync(PROCESS_EVENT_LOG, `${JSON.stringify(payload)}\n`);
    } catch { }
    try {
        const client = global.__matrixSupabase;
        if (client) {
            client.from('process_launch_events').insert({
                service: payload.service,
                kind: payload.kind || 'unknown',
                command: payload.command || null,
                args: payload.args || [],
                metadata: payload
            }).then(() => { }).catch(() => { });
        }
    } catch { }
};
const exec = (command, options, callback) => {
    appendProcessLaunchEvent({ kind: 'exec', command: String(command || '').slice(0, 240) });
    if (typeof options === 'function') return childProcess.exec(command, { windowsHide: true }, options);
    return childProcess.exec(command, { windowsHide: true, ...(options || {}) }, callback);
};
const execFile = (file, args, options, callback) => {
    appendProcessLaunchEvent({
        kind: 'execFile',
        file: String(file || '').slice(0, 120),
        args: Array.isArray(args) ? args.map((a) => String(a).slice(0, 120)) : []
    });
    if (typeof options === 'function') return childProcess.execFile(file, args, { windowsHide: true }, options);
    return childProcess.execFile(file, args, { windowsHide: true, ...(options || {}) }, callback);
};
const spawn = (command, args, options) => {
    appendProcessLaunchEvent({
        kind: 'spawn',
        command: String(command || '').slice(0, 120),
        args: Array.isArray(args) ? args.map((a) => String(a).slice(0, 120)) : []
    });
    return childProcess.spawn(command, args, { windowsHide: true, ...(options || {}) });
};
const execSync = (command, options) => childProcess.execSync(command, { windowsHide: true, ...(options || {}) });
const crypto = require('crypto');
const http = require('http');
const net = require('net');
const path = require('path');
const fs = require('fs');
const os = require('os');
const qrcode = require('qrcode-terminal');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

// Planetary Mesh Infrastructure (Phase 47)
const RegistryClient = require('./registry-client.cjs');
const HiveMessenger = require('./hive-messenger.cjs');
const { normalizeCommand, validateBridgeEnvelope } = require('./runtime/command-contract.cjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;


// --- GLOBALS ---
const currentPid = process.pid;
const LAUNCH_TIMESTAMP = Date.now();
const MISSED_RUNNER_PULSES = { count: 0 };
const CHILD_PROCESSES = {};
const LOCK_FILE = path.join(__dirname, 'nexus-sentinel.lock');
let WATCHDOG_ACTIVE = true;
const configPath = path.join(__dirname, '..', '..', '..', 'triage.config.json');

// Multi-Gate Infrastructure
const GATES = {
    NEXUS: { process: null, url: null, port: 3001 },
    REFLECT: { process: null, url: null, port: 3000 },
    GHOST: { process: null, url: null, port: 5173 },
    ROCKET: { process: null, url: null, port: 4000 },
    CITADEL: { process: null, url: null, port: 3005 }
};

if (!supabaseUrl || !supabaseKey) {
    console.error('[CRITICAL] Missing Supabase credentials in .env');
    process.exit(1);
}

console.log('--- MATRIX HUB SENTINEL v3.0 (INFRASTRUCTURE HARDENING) ---');
const HEADLESS_MODE = process.argv.includes('--headless');
if (HEADLESS_MODE) {
    console.log('\x1b[35m[MODE] HEADLESS SERVER ACTIVE\x1b[0m');
}

const MATRIX_MODE = process.env.MATRIX_MODE || 'production';
const IS_PROD = MATRIX_MODE === 'production';
const MATRIX_ENVIRONMENT = String(process.env.MATRIX_ENVIRONMENT || '').toLowerCase();
const LOCAL_CLOUD_ONLY_BLOCK =
    String(process.env.MATRIX_CLOUD_MODE || '').toLowerCase() === 'true' &&
    MATRIX_ENVIRONMENT !== 'cloud' &&
    process.env.MATRIX_ALLOW_LOCAL_SENTINEL !== '1';

if (LOCAL_CLOUD_ONLY_BLOCK) {
    console.log('[CLOUD_ONLY] MATRIX_CLOUD_MODE=true and MATRIX_ENVIRONMENT!=cloud; local sentinel launch blocked.');
    process.exit(0);
}

console.log(`[CONFIG] Matrix Mode: ${MATRIX_MODE.toUpperCase()}`);

// Absolute path to the root Next.js binary (hoisted by npm workspaces)
const MATRIX_ROOT = path.join(__dirname, '..', '..', '..');
const NEXT_BIN = path.join(MATRIX_ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');

const SERVICES = {
    REFLECT: {
        port: 3000,
        command: 'node',
        args: [NEXT_BIN, IS_PROD ? 'start' : 'dev', '-p', '3000', '-H', '0.0.0.0'],
        cwd: path.join(__dirname, '../../reflect'),
        healthPath: '/api/health'
    },
    NEXUS: {
        port: 3001,
        command: 'node',
        args: [NEXT_BIN, IS_PROD ? 'start' : 'dev', '-p', '3001', '-H', '0.0.0.0'],
        cwd: path.join(__dirname, '../../nexus'),
        healthPath: '/api/health'
    },
    GHOST: {
        port: 5173,
        command: 'node',
        args: [NEXT_BIN, IS_PROD ? 'start' : 'dev', '-p', '5173', '-H', '0.0.0.0'],
        cwd: path.join(__dirname, '../../ghost-command'),
        healthPath: '/api/health'
    },
    ROCKET: {
        port: 4000,
        command: 'node',
        args: [NEXT_BIN, IS_PROD ? 'start' : 'dev', '-p', '4000', '-H', '0.0.0.0'],
        cwd: path.join(__dirname, '../../rocket-command'),
        healthPath: '/api/health'
    },
    CITADEL: {
        port: 3005,
        command: 'node',
        args: ['guardian.cjs'],
        cwd: path.join(__dirname, '../../citadel'),
        healthPath: '/api/health'
    },
    RUNNER: {
        port: null,
        command: 'node',
        args: ['ghost-runner.cjs'],
        cwd: __dirname,
        healthPath: null
    }
};

const supabase = createClient(supabaseUrl, supabaseKey);
global.__matrixSupabase = supabase;

const IntegrationHub = require('./integration-hub.cjs');
const integrationHub = new IntegrationHub(supabase);
const EventLogger = require('./event-logger.cjs');

// Initialize Integrations
(async () => {
    const GitHubPlugin = require('./integrations/github-plugin.cjs');
    const TelegramPlugin = require('./integrations/telegram-plugin.cjs');
    const DiscordPlugin = require('./integrations/discord-plugin.cjs');
    const NotebookLMPlugin = require('./integrations/notebooklm-plugin.cjs');

    integrationHub.register('github', new GitHubPlugin());
    integrationHub.register('telegram', new TelegramPlugin());
    integrationHub.register('discord', new DiscordPlugin());
    integrationHub.register('notebooklm', new NotebookLMPlugin());

    // Link EventLogger to Hub for external alerts
    EventLogger.setHub(integrationHub);
    EventLogger.boot('nexus_sentinel');

    // Initialize Voice WebSocket Server (Phase 29)
    try {
        const VoiceSocketServer = require('./voice-socket.cjs');
        global.voiceSocket = new VoiceSocketServer(3006);
    } catch (e) {
        console.error('[SENTINEL] Failed to link Voice Socket:', e.message);
    }

    // Initialize Ghost Vision (Phase 29)
    try {
        global.ghostVision = require('./vision.cjs');
        console.log('[SENTINEL] Ghost Vision service registered.');
    } catch (e) {
        console.error('[SENTINEL] Failed to link Ghost Vision:', e.message);
    }
})();

const PROCESSED_IDS = new Set();

// Planetary Mesh Initialization (Phase 47)
const ENV_MAP = { 'development': 'dev', 'production': 'production', 'staging': 'staging', 'test': 'test' };
const sanitizedEnv = ENV_MAP[(process.env.MATRIX_MODE || 'development').toLowerCase()] || 'dev';

const registry = new RegistryClient(supabase, {
    instanceName: process.env.MATRIX_INSTANCE_NAME || `citadel-${os.hostname()}`,
    environment: sanitizedEnv,
    version: '6.0.0-planetary'
});

const messenger = new HiveMessenger(supabase, registry);

// Start Mesh Synchronization
(async () => {
    console.log('[MESH] 🌍 Activating Planetary Mesh Synthesis...');
    await registry.register();
    await messenger.start();

    // Global Mesh Heartbeat (30s)
    setInterval(() => registry.heartbeat(), 30000);
})();

// --- HTTP SEND POLYFILL (Phase 16) ---
// Fallback for when Realtime WebSockets are unstable on Node.js
if (supabase) {
    try {
        const tempChannel = supabase.channel('polyfill-temp');
        const proto = Object.getPrototypeOf(tempChannel);
        if (proto) {
            console.log('[PROTOTYPE] Injecting/Updating httpSend polyfill...');
            proto.httpSend = async function (payload) {
                // If the library calls it with an envelope { type, event, payload }, extract the inner payload
                const actualPayload = (payload && payload.payload) ? payload.payload : payload;

                if (!actualPayload) {
                    console.warn(`[REALTIME_FALLBACK] httpSend called without payload on topic: ${this.topic}`);
                    return { success: true };
                }
                try {
                    await supabase.rpc('log_system_event', {
                        p_source: 'realtime_fallback',
                        p_event_type: 'http_broadcast',
                        p_message: `Broadcast topic: ${this.topic}`,
                        p_metadata: actualPayload
                    });
                    return { success: true };
                } catch (err) {
                    console.warn(`[REALTIME_FALLBACK] httpSend failed: ${err.message}`);
                    return { success: false, error: err.message };
                }
            };
        }
        supabase.removeChannel(tempChannel);
    } catch (e) {
        console.warn('[POLYFILL] Failed to inject httpSend:', e.message);
    }
}

// Broadcast Channel for Real-time Infrastructure Telemetry
const healthBroadcast = supabase.channel('system_health');
healthBroadcast.subscribe();

// --- SERVICE MANAGER CLASS ---
class ServiceManager {
    constructor() {
        this.services = SERVICES;
        this.startTimes = {
            REFLECT: 0,
            NEXUS: 0,
            GHOST: 0,
            ROCKET: 0,
            RUNNER: 0
        };
        this.retryCounts = {
            REFLECT: 0,
            NEXUS: 0,
            GHOST: 0,
            ROCKET: 0,
            RUNNER: 0
        };
    }

    async waitForPort(port, timeout = 30000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            try {
                await new Promise((resolve, reject) => {
                    const socket = new net.Socket();
                    socket.setTimeout(500);
                    socket.once('connect', () => { socket.destroy(); resolve(); });
                    socket.once('timeout', () => { socket.destroy(); reject(); });
                    socket.once('error', () => { socket.destroy(); reject(); });
                    socket.connect(port, '127.0.0.1');
                });
                return true;
            } catch (e) {
                await new Promise(r => setTimeout(r, 200));
            }
        }
        return false;
    }

    async logDiagnostic(app, action, severity, category) {
        try {
            await supabase.from('matrix_diagnostics').insert({
                app: app,
                action: action,
                severity: severity,
                category: category,
                metadata: {
                    pid: CHILD_PROCESSES[app]?.pid,
                    timestamp: Date.now()
                }
            });
        } catch (e) {
            // fail silently on logging errors
        }
    }

    async killProcessTree(pid) {
        if (!pid) return;
        return new Promise((resolve) => {
            execFile('taskkill', ['/F', '/T', '/PID', String(pid)], { windowsHide: true }, () => resolve());
        });
    }

    async killPort(port) {
        if (!port) return;
        return new Promise((resolve) => {
            const psCmd = `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }`;
            const child = execFile('powershell.exe', ['-WindowStyle', 'Hidden', '-NoProfile', '-Command', psCmd], { timeout: 10000, windowsHide: true }, () => resolve());
            // Ensure we don't hang on terminal issues
            setTimeout(() => { try { child.kill(); } catch (e) { } resolve(); }, 12000);
        });
    }

    async killService(name) {
        console.log(`[STOP] Stopping ${name}...`);
        const svc = this.services[name];
        if (CHILD_PROCESSES[name]) {
            await this.killProcessTree(CHILD_PROCESSES[name].pid);
            delete CHILD_PROCESSES[name];
        }
        if (svc.port) {
            await this.killPort(svc.port);
        } else {
            const findCmd = `powershell -WindowStyle Hidden -Command \"Get-WmiObject Win32_Process -Filter \\\"Name = 'node.exe'\\\" | Where-Object { $_.CommandLine -like '*${svc.args[0]}*' } | Select-Object -ExpandProperty ProcessId\"`;
            try {
                const pids = execSync(findCmd, { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
                pids.forEach(pid => {
                    try { process.kill(parseInt(pid), 'SIGKILL'); } catch (e) { }
                });
            } catch (e) { }
        }
    }

    async startService(name) {
        const svc = this.services[name];
        console.log(`[START] Igniting ${name}...`);
        this.startTimes[name] = Date.now();
        await this.logDiagnostic(name, 'START_INIT', 'info', 'lifecycle');
        // REMOVED: Redundant killService call here. 
        // killService is now managed explicitly by restartService or manual stop.
        return new Promise((resolve, reject) => {
            const child = spawn(svc.command, svc.args, {
                cwd: svc.cwd,
                windowsHide: true,
                stdio: 'pipe',
                env: { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --max-old-space-size=4096`.trim() }
            });
            CHILD_PROCESSES[name] = child;
            child.stdout.on('data', d => process.stdout.write(`[${name}] ${d}`));
            child.stderr.on('data', d => process.stderr.write(`[${name}_ERR] ${d}`));
            child.on('close', (code) => {
                console.log(`[${name}] Exited with code ${code}`);
                if (CHILD_PROCESSES[name] === child) {
                    delete CHILD_PROCESSES[name];
                    const runtime = Date.now() - this.startTimes[name];

                    if (code !== 0 && runtime > 30000 && WATCHDOG_ACTIVE) {
                        this.retryCounts[name] = (this.retryCounts[name] || 0) + 1;
                        const delay = Math.min(Math.pow(2, this.retryCounts[name]) * 5000, 60000); // Max 60s
                        console.log(`[SELF-HEAL] ${name} crashed after ${Math.round(runtime / 1000)}s - auto-restarting in ${delay / 1000}s (Attempt ${this.retryCounts[name]})...`);
                        this.logDiagnostic(name, `CRASH_EXIT_CODE_${code}`, 'error', 'crash');
                        setTimeout(() => {
                            if (WATCHDOG_ACTIVE) {
                                this.startService(name);
                            }
                        }, delay);
                    } else if (code === 0 || runtime > 120000) {
                        // Reset retry count if it was a clean exit or ran for a long time
                        this.retryCounts[name] = 0;
                        if (code !== 0) this.logDiagnostic(name, `UNEXPECTED_EXIT_CODE_${code}`, 'warning', 'stability');
                    }
                }
            });
            resolve(child);
        });
    }

    async restartService(name) {
        await this.killService(name);
        console.log(`[RESTART] Cooling down ${name} (3.5s)...`);
        await new Promise(r => setTimeout(r, 3500)); // Increased for Windows port release
        await this.startService(name);
    }

    async broadcast(message) {
        console.log(`[BROADCAST] ${message}`);
        try {
            await supabase.from('ghost_bridge').insert({
                command: 'sys:broadcast',
                source: 'nexus_sentinel',
                status: 'silent',
                output: message
            });
        } catch (e) {
            console.error(`[BROADCAST_ERR] ${e.message}`);
        }
    }
}

// --- PURGE ZOMBIES (Autonomous Self-Healing) ---
async function purgeZombies(skipPid = process.pid) {
    const logSource = 'nexus_sentinel';
    console.log('\x1b[36m[HEAL] Initiating Shadow Purge Protocol...\x1b[0m');
    EventLogger.critical(logSource, 'shadow_purge', 'Initiating Shadow Purge Protocol (Global Blackout or Manual Heal)');

    const targetPorts = [3000, 3001, 3005, 4000, 5173, 3334];
    const targetLockFiles = [
        path.join(__dirname, 'ghost-runner.lock'),
        path.join(__dirname, 'nexus-sentinel.lock')
    ];

    try {
        let terminalCount = 0;
        // 1. Kill processes on target ports
        for (const port of targetPorts) {
            const psPortCmd = `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`;
            const pids = await new Promise(r => execFile('powershell.exe', ['-WindowStyle', 'Hidden', '-NoProfile', '-Command', psPortCmd], { windowsHide: true }, (err, stdout) => r((stdout || '').trim().split('\n').filter(p => p))));

            for (const tpid of pids) {
                const pidNum = parseInt(tpid.trim());
                if (pidNum && pidNum !== skipPid) {
                    console.log(`[HEAL] Terminating Port ${port} Zombie: PID ${pidNum}`);
                    try {
                        process.kill(pidNum, 'SIGKILL');
                        terminalCount++;
                    } catch (e) { }
                }
            }
        }

        // 2. Kill orphaned Node instances
        const psZombieCmd = `Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and ($_.CommandLine -like '*sentinel.cjs*' -or $_.CommandLine -like '*ghost-runner.cjs*' -or $_.CommandLine -like '*guardian.cjs*' -or $_.CommandLine -like '*bot.js*' -or $_.CommandLine -like '*next-server*') } | Select-Object -ExpandProperty ProcessId`;
        const zombiePids = await new Promise(r => execFile('powershell.exe', ['-WindowStyle', 'Hidden', '-NoProfile', '-Command', psZombieCmd], { windowsHide: true }, (err, stdout) => r((stdout || '').trim().split('\n').filter(p => p))));

        for (const zpid of zombiePids) {
            const pidNum = parseInt(zpid.trim());
            if (pidNum && pidNum !== skipPid) {
                console.log(`[HEAL] Purging Zombie Process: PID ${pidNum}`);
                try {
                    process.kill(pidNum, 'SIGKILL');
                    terminalCount++;
                } catch (e) { }
            }
        }

        // 3. Clear Stale Lockfiles
        let locksCleared = 0;
        for (const lockFile of targetLockFiles) {
            if (fs.existsSync(lockFile)) {
                try {
                    const lockPid = fs.readFileSync(lockFile, 'utf8').trim();
                    if (parseInt(lockPid) === skipPid) {
                        console.log(`[HEAL] Preserving Active Lock: ${path.basename(lockFile)}`);
                        continue;
                    }
                } catch (e) { }
                console.log(`[HEAL] Removing Stale Lock: ${path.basename(lockFile)}`);
                try {
                    fs.unlinkSync(lockFile);
                    locksCleared++;
                } catch (e) { }
            }
        }

        const summary = `Shadow Purge Complete. Terminated: ${terminalCount}, Locks Cleared: ${locksCleared}. Environment Pristine.`;
        console.log(`\x1b[32m[HEAL] ${summary}\x1b[0m`);
        EventLogger.info(logSource, 'shadow_purge_complete', summary, { terminalCount, locksCleared });
        return true;
    } catch (err) {
        console.error('[HEAL] Purge failed:', err.message);
        EventLogger.error(logSource, 'shadow_purge_failed', err.message);
        return false;
    }
}

const manager = new ServiceManager();
const SERVICE_START_TIMES = { REFLECT: 0, NEXUS: 0, GHOST: 0, ROCKET: 0, RUNNER: 0 };
const originalStartService = manager.startService.bind(manager);
manager.startService = async (name) => {
    SERVICE_START_TIMES[name] = Date.now();
    return originalStartService(name);
};

const HANDLED_COMMANDS = [
    'sys:ignite', 'sys:boot', 'sys:restart_all', 'sys:deep_ignite',
    'sys:kill_all', 'sys:purge', 'sys:hazard_purge', 'sys:sync', 'sys:heal',
    'sys:autopilot', 'sys:autopilot_full',
    'sys:maintenance_window', 'sys:maintenance_exit', 'sys:emergency_recover',
    'sys:start_runner', 'sys:stop_runner',
    'sys:start_ghost', 'sys:stop_ghost', 'sys:restart_ghost',
    'sys:start_reflect', 'sys:stop_reflect', 'sys:restart_reflect',
    'sys:start_nexus', 'sys:stop_nexus', 'sys:restart_nexus',
    'sys:start_rocket', 'sys:stop_rocket', 'sys:restart_rocket',
    'sys:open_gate', 'sys:close_gate', 'sys:open_all_gates', 'sys:close_all_gates',
    'sys:open_gate_nexus', 'sys:open_gate_reflect', 'sys:open_gate_ghost', 'sys:open_gate_rocket',
    'sys:close_gate_nexus', 'sys:close_gate_reflect', 'sys:close_gate_ghost', 'sys:close_gate_rocket',
    'sys:github_sync', 'sys:snapshot', 'sys:smoke_test',
    // Triage System Commands
    'triage:evolve', 'triage:purge', 'triage:oracle', 'triage:full', 'triage:revert', 'triage:health'
];
const STRICT_COMMAND_SCHEMA = process.env.MATRIX_STRICT_COMMAND_SCHEMA === '1';
const COMMAND_SCHEMA_METRICS = {
    rejected: 0,
    warned: 0,
    reasons: {}
};

function trackSchemaMetric(kind, reason) {
    if (!COMMAND_SCHEMA_METRICS.reasons[reason]) COMMAND_SCHEMA_METRICS.reasons[reason] = 0;
    COMMAND_SCHEMA_METRICS.reasons[reason] += 1;
    if (kind === 'rejected') COMMAND_SCHEMA_METRICS.rejected += 1;
    if (kind === 'warned') COMMAND_SCHEMA_METRICS.warned += 1;
}

const AUTO_HEAL_ENABLED = process.env.MATRIX_AUTO_HEAL !== '0';
let AUTO_HEAL_RUNNING = false;
let LAST_AUTO_HEAL_TS = 0;
let MAINTENANCE_MODE = false;

function runOpsAutopilot(mode = 'quick') {
    const scriptPath = path.join(__dirname, '..', '..', '..', 'scripts', 'tools', 'ops_autopilot.cjs');
    const args = [scriptPath, '--heal', '--json'];
    if (mode === 'quick') args.push('--quick');

    return new Promise((resolve) => {
        execFile(process.execPath, args, {
            cwd: path.join(__dirname, '..', '..', '..'),
            windowsHide: true,
            timeout: mode === 'full' ? 20 * 60 * 1000 : 5 * 60 * 1000,
            maxBuffer: 8 * 1024 * 1024
        }, (error, stdout, stderr) => {
            if (error) {
                resolve({
                    ok: false,
                    summary: null,
                    reason: stderr || stdout || error.message
                });
                return;
            }

            try {
                const payload = JSON.parse(String(stdout || '{}'));
                resolve({
                    ok: Boolean(payload.ok),
                    summary: payload.summary || null,
                    reason: payload.ok ? 'autopilot_completed' : 'autopilot_degraded'
                });
            } catch {
                resolve({
                    ok: true,
                    summary: null,
                    reason: 'autopilot_completed_no_json'
                });
            }
        });
    });
}

async function shouldTriggerAutoHeal() {
    try {
        const ports = await checkPorts(true);
        const onlineCount = Object.values(ports).filter(Boolean).length;

        const { error: dbErr } = await supabase.from('ghost_bridge').select('id').limit(1);
        const dbHealthy = !dbErr;

        // Trigger only when system meaningfully degrades.
        return onlineCount < 3 || !dbHealthy;
    } catch (e) {
        return true;
    }
}

function runProdReadinessCheck() {
    return new Promise((resolve) => {
        const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        execFile(npmCmd, ['run', 'prod:readiness'], {
            cwd: path.join(__dirname, '..', '..', '..'),
            windowsHide: true,
            timeout: 4 * 60 * 1000,
            maxBuffer: 8 * 1024 * 1024
        }, (error, stdout, stderr) => {
            resolve({
                ok: !error,
                output: (stdout || stderr || '').toString().slice(0, 4000)
            });
        });
    });
}

async function runMaintenanceWindow(manager) {
    MAINTENANCE_MODE = true;
    await manager.broadcast('Maintenance window started. Pausing noncritical services.');

    const paused = [];
    for (const service of ['ROCKET', 'CITADEL']) {
        try {
            await manager.killService(service);
            paused.push(service.toLowerCase());
        } catch (e) { }
    }

    const autopilot = await runOpsAutopilot('full');
    const readiness = await runProdReadinessCheck();

    await manager.broadcast('Maintenance remediation complete. Restarting paused services.');
    for (const service of ['ROCKET', 'CITADEL']) {
        try {
            await manager.startService(service);
        } catch (e) { }
    }

    MAINTENANCE_MODE = false;
    return {
        ok: Boolean(autopilot.ok && readiness.ok),
        paused,
        autopilot,
        readiness
    };
}

async function runEmergencyRecover(manager) {
    const maintenance = await runMaintenanceWindow(manager);
    const postHeal = await runOpsAutopilot('quick');
    return {
        ok: Boolean(maintenance.ok && postHeal.ok),
        maintenance,
        postHeal
    };
}

async function executeCommand(cmd) {
    if (!cmd.id || PROCESSED_IDS.has(cmd.id)) return;
    let action = normalizeCommand((cmd.command || '').trim());
    const envelope = validateBridgeEnvelope({ ...cmd, command: action }, HANDLED_COMMANDS);
    if (!envelope.ok) {
        const detail = `[SCHEMA] Rejecting command ${cmd.id}: ${envelope.reason}`;
        if (STRICT_COMMAND_SCHEMA || envelope.reason !== 'non_canonical_command') {
            trackSchemaMetric('rejected', envelope.reason);
            console.warn(detail);
            try {
                await supabase
                    .from('ghost_bridge')
                    .update({ status: 'failed', output: `ERROR: ${detail}` })
                    .eq('id', cmd.id);
            } catch (e) { }
            return;
        }
        trackSchemaMetric('warned', envelope.reason);
        console.warn(`${detail} (compat mode: allowed)`);
    }
    const isQuiet = action.startsWith('sys:heartbeat') || action.startsWith('sys:broadcast');

    if (!action.startsWith('sys:') && !action.startsWith('triage:') && !action.startsWith('fs:') && !action.startsWith('transfer:')) return;
    if (new Date(cmd.created_at).getTime() < (LAUNCH_TIMESTAMP - 300000)) return; // 5m window

    PROCESSED_IDS.add(cmd.id);
    // Enforce memory limit on PROCESSED_IDS to prevent unbounded growth leak
    if (PROCESSED_IDS.size > 1000) {
        const first = PROCESSED_IDS.values().next().value;
        PROCESSED_IDS.delete(first);
    }
    if (!isQuiet) console.log(`[EXECUTING] ${action} (ID: ${cmd.id})`);

    try {
        await supabase.from('ghost_bridge').update({ status: 'executing', output: `ACK: ${action}` }).eq('id', cmd.id);

        // REMOVED: Generic Sage Simulation (Handled by Ghost Runner)

        if (action === 'sys:ignite' || action === 'sys:boot' || action === 'sys:restart_all' || action === 'sys:deep_ignite' || action === 'sys:start') {
            WATCHDOG_ACTIVE = true;
            console.log('\x1b[36m[IGNITION] Sequencing Full System Start...\x1b[0m');
            await manager.broadcast('Initiating full system ignition sequence...');

            // HYGIENE: Purge stale pending commands to prevent startup spam
            console.log('[HYGIENE] Purging stale neural fragments...');
            await supabase.from('ghost_bridge').delete().eq('status', 'pending');

            const IS_CLOUD = process.env.MATRIX_CLOUD_MODE === 'true';
            if (IS_CLOUD) {
                console.log('\x1b[35m[CLOUD] Cloud Bridge Active. Redirecting ignition to remote cloud.\x1b[0m');
                await manager.broadcast('Cloud Bridge active. Triggering remote ignition...');

                const result = await integrationHub.execute('github', 'trigger_workflow', {
                    workflow_id: 'matrix-shadow.yml',
                    inputs: { action: 'deploy' }
                });

                if (result.success) {
                    console.log('\x1b[32m[CLOUD] Remote Ignition Command Dispatched.\x1b[0m');
                    await manager.broadcast('Remote ignition sequence started.');
                    global.lastHeartbeatPersist = 0;
                    await pulse();
                } else {
                    console.error('[CLOUD] Failed to trigger remote ignition:', result.error);
                    await manager.broadcast('CRITICAL: Remote ignition failure. Check GitHub settings.');
                }
                return;
            }

            await manager.startService('RUNNER');
            // Runner doesn't have a port, so we give it a tiny grace period
            await new Promise(r => setTimeout(r, 500));

            const sequence = ['REFLECT', 'NEXUS', 'GHOST', 'ROCKET', 'CITADEL'];
            for (const name of sequence) {
                await manager.startService(name);
                const svc = SERVICES[name];
                if (svc.port) {
                    console.log(`[BOOT] Waiting for ${name} on port ${svc.port}...`);
                    const ready = await manager.waitForPort(svc.port);
                    if (ready) console.log(`[BOOT] ${name} is responsive.`);
                    else console.log(`[BOOT] ${name} wait timed out, continuing...`);
                }
            }

            console.log('\x1b[32m[SYSTEM] MATRIX ONLINE.\x1b[0m');
            await manager.broadcast('All systems online. Matrix established.');
            global.lastHeartbeatPersist = 0;
            await pulse();

        } else if (action === 'sys:kill_all' || action === 'sys:purge' || action === 'sys:hazard_purge' || action === 'sys:stop') {
            WATCHDOG_ACTIVE = false;
            console.log('[HAZARD] KILL ALL INITIATED');
            await manager.killService('RUNNER');
            await manager.killService('REFLECT');
            await manager.killService('NEXUS');
            await manager.killService('GHOST');
            await manager.killService('ROCKET');
            await manager.killService('CITADEL');
            if (action === 'sys:purge' || action === 'sys:hazard_purge') {
                try { execSync(`powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File scripts\\zombie_purge.ps1 -SkipPid ${currentPid}`, { stdio: 'ignore' }); } catch (e) { }
            }
            await supabase.from('ghost_bridge').insert({
                command: 'sys:heartbeat', source: 'nexus_sentinel', status: 'silent',
                output: JSON.stringify({ services: { ghost: 'offline', reflect: 'offline', nexus: 'offline', rocket: 'offline', runner: 'offline', citadel: 'offline' }, timestamp: Date.now() })
            });

        } else if (action === 'sys:sync') {
            console.log('[SYNC] Manual Heartbeat & Hygiene Triggered');
            await pulse();

            // --- SOVEREIGN STATUS PERSISTENCE ---
            const healthSummary = {};
            Object.keys(SERVICES).forEach(name => {
                healthSummary[name.toLowerCase()] = CHILD_PROCESSES[name] ? 'online' : 'offline';
            });
            EventLogger.info('nexus_sentinel', 'sovereign_status', 'System-wide health sync completed.', {
                services: healthSummary,
                uptime: Math.round((Date.now() - LAUNCH_TIMESTAMP) / 1000)
            });

            try {
                const sixtyMinsAgo = new Date(Date.now() - 3600000).toISOString();
                await supabase.from('ghost_bridge').delete().eq('command', 'sys:heartbeat').lt('created_at', sixtyMinsAgo).catch(() => { });
                await supabase.rpc('delete_old_heartbeats').catch(() => { });
            } catch (e) { }

        } else if (action === 'sys:open_all_gates') {
            console.log('[GATE] Initiating Global Hyper-Loop...');
            for (const key of Object.keys(GATES)) {
                executeCommand({ id: `auto-gate-${key}-${Date.now()}`, command: `sys:open_gate_${key.toLowerCase()}`, created_at: new Date().toISOString() });
                await new Promise(r => setTimeout(r, 800)); // Stagger gate starts
            }
            // Give tunnels time to establish, then force a pulse
            setTimeout(async () => {
                console.log('[GATE] Forcing status broadcast after tunnel establishment window...');
                await pulse();
            }, 5000);

        } else if (action === 'sys:close_all_gates') {
            console.log('[GATE] Terminating Global Hyper-Loop...');
            for (const [name, gate] of Object.entries(GATES)) {
                if (gate.process) {
                    console.log(`[GATE] Closing ${name}...`);
                    try {
                        await manager.killProcessTree(gate.process.pid);
                    } catch (e) {
                        console.log(`[GATE] Force kill ${name}...`);
                        gate.process.kill('SIGKILL');
                    }
                }
                gate.process = null;
                gate.url = null;
            }
            console.log('[GATE] All gates terminated.');
            await pulse(); // Immediately broadcast the offline status

        } else if (action.startsWith('sys:open_gate')) {
            const target = action.split('_').pop().toUpperCase();
            const gateToOpen = GATES[target] || GATES.NEXUS;
            if (gateToOpen.process) {
                console.log(`[GATE] ${target} already open at:`, gateToOpen.url);
            } else {
                console.log(`[GATE] Opening Cloudflare tunnel for ${target} (Port ${gateToOpen.port})...`);
                const cfPath = process.platform === 'win32' ? 'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe' : 'cloudflared';
                const proc = spawn(cfPath, ['tunnel', '--url', `http://localhost:${gateToOpen.port}`], { windowsHide: true });
                gateToOpen.process = proc;
                proc.stderr.on('data', async (data) => {
                    const out = data.toString();
                    const match = out.match(/(https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com)/);
                    if (match && !gateToOpen.url) {
                        gateToOpen.url = match[1];
                        console.log(`[GATE] ${target} established:`, gateToOpen.url);
                        await pulse();
                    }
                });
                proc.stdout.on('data', (data) => {
                    const out = data.toString();
                    const match = out.match(/(https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com)/);
                    if (match && !gateToOpen.url) {
                        gateToOpen.url = match[1];
                        console.log(`[GATE] ${target} established:`, gateToOpen.url);
                        pulse();
                    }
                });
                proc.on('exit', () => {
                    console.log(`[GATE] ${target} Cloudflare tunnel exited.`);
                    gateToOpen.process = null;
                    gateToOpen.url = null;
                    pulse();
                });
            }

        } else if (action === 'sys:close_gate' || action.startsWith('sys:close_gate_')) {
            const target = action.split('_').pop().toUpperCase();
            const gate = GATES[target] || GATES.NEXUS;
            if (gate?.process) {
                console.log(`[GATE] Closing secure bridge for ${target}...`);
                await manager.killProcessTree(gate.process.pid);
            }

        } else if (action === 'sys:github_sync') {
            console.log('[GITHUB] Syncing repository status...');
            const result = await integrationHub.execute('github', 'status', {});
            if (result.success) {
                await manager.broadcast(`GitHub Status: ${result.data.name} (⭐ ${result.data.stars}) - ${result.data.issues} Issues`);
                await supabase.from('ghost_bridge').insert({
                    command: 'sys:broadcast',
                    source: 'github_architect',
                    status: 'executed',
                    output: JSON.stringify(result.data)
                });
            } else {
                console.error('[GITHUB] Sync failed:', result.error);
            }

        } else if (action === 'sys:snapshot') {
            console.log('[SNAPSHOT] Manual trigger initiated...');
            try {
                const out = execSync(`powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File scripts\\snapshot.ps1`, { encoding: 'utf8' });
                await manager.broadcast(`System Snapshot Complete: ${out.split('\n').filter(l => l.includes('snapshot_')).pop() || 'Verified'}`);
            } catch (e) {
                console.error('[SNAPSHOT] Failed:', e.message);
                throw e;
            }

        } else if (action === 'sys:smoke_test') {
            console.log('[SMOKE_TEST] Initiating verification...');
            try {
                const out = execSync(`node scripts\\smoke_test.js`, { encoding: 'utf8' });
                await manager.broadcast(`All systems nominal. Smoke test passed.`);
            } catch (e) {
                console.error('[SMOKE_TEST] Failed:', e.message);
                await manager.broadcast(`CRITICAL: Smoke test failed. Check logs.`);
                throw e;
            }

            /*
            } else if (action.startsWith('triage:')) {
               // DEPRECATED: Handled by Ghost Runner (TriageHandler.js)
               // Sentinel should not interfere with Triage operations.
               console.log('[SENTINEL] Ignoring triage command (delegated to Ghost Runner)');
            */

        } else if (action.startsWith('fs:') || action.startsWith('transfer:')) {
            // ═══════════════════════════════════════════════════════════════
            // FILE SYSTEM & TRANSFER OPS
            // ═══════════════════════════════════════════════════════════════
            const fsCmd = action.split(':')[1].split(' ')[0];
            // FIX: Strip quotes and trim whitespace for Windows path compatibility
            const arg = action.split(' ').slice(1).join(' ').trim().replace(/^"|"$/g, '');
            const ROOT_DIR = path.join(__dirname, '..'); // g:\matrix

            if (action.startsWith('fs:')) {
                if (fsCmd === 'list') {
                    const targetPath = arg ? path.resolve(ROOT_DIR, arg) : ROOT_DIR;
                    console.log(`[FS] Listing: ${targetPath}`);

                    try {
                        const items = fs.readdirSync(targetPath, { withFileTypes: true });
                        const result = items.map(item => ({
                            name: item.name,
                            isFile: item.isFile(),
                            size: item.isFile() ? fs.statSync(path.join(targetPath, item.name)).size : null,
                            path: path.relative(ROOT_DIR, path.join(targetPath, item.name)).replace(/\\/g, '/')
                        }));
                        await supabase.from('ghost_bridge').update({ status: 'executed', output: `DIR_LIST: ${JSON.stringify(result)}` }).eq('id', cmd.id);
                        return; // return early as we handled the update
                    } catch (err) {
                        throw new Error(`DIR_NOT_FOUND: ${err.message}`);
                    }
                } else if (fsCmd === 'read') {
                    const targetPath = path.resolve(ROOT_DIR, arg);
                    console.log(`[FS] Reading: ${targetPath}`);
                    const content = fs.readFileSync(targetPath, 'utf8');
                    await supabase.from('ghost_bridge').update({ status: 'executed', output: `FILE_CONTENT: ${content}` }).eq('id', cmd.id);
                    return;
                } else if (fsCmd === 'delete') {
                    const targetPath = path.resolve(ROOT_DIR, arg);
                    console.log(`[FS] Deleting: ${targetPath}`);
                    fs.unlinkSync(targetPath);
                    await manager.broadcast(`Deleted: ${arg}`);
                }
            }
            else if (action.startsWith('transfer:download')) {
                // Command: transfer:download transfers/filename.ext
                const storagePath = arg.trim();
                console.log(`[TRANSFER] Downloading artifact: ${storagePath}...`);

                const { data, error } = await supabase.storage.from('ghost-storage').download(storagePath);
                if (error) throw error;

                const buffer = Buffer.from(await data.arrayBuffer());
                // FIX: Verify path separators for Windows compatibility
                const fileName = storagePath.split('/').pop().split('\\').pop();
                const downloadDir = path.join(ROOT_DIR, 'downloads');

                if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);
                const localPath = path.join(downloadDir, fileName);

                fs.writeFileSync(localPath, buffer);
                console.log(`[TRANSFER] Saved to ${localPath}`);
                await manager.broadcast(`Artifact downloaded: ${fileName}`);
            }

        } else if (action === 'sys:start_stream') {
            if (CHILD_PROCESSES['DESKTOP_STREAM']) {
                console.log('[STREAM] Already active.');
            } else {
                console.log('[STREAM] Initializing Desktop Portal...');
                const streamProc = spawn('node', ['scripts/stream_desktop.js'], {
                    cwd: path.join(__dirname, '../../..'), // g:\matrix
                    stdio: 'ignore',
                    windowsHide: true
                });
                CHILD_PROCESSES['DESKTOP_STREAM'] = streamProc;
                streamProc.on('close', () => {
                    delete CHILD_PROCESSES['DESKTOP_STREAM'];
                    console.log('[STREAM] Portal closed.');
                });
                await manager.broadcast('Desktop Portal Online (Port 3334)');
            }

        } else if (action === 'sys:stop_stream') {
            if (CHILD_PROCESSES['DESKTOP_STREAM']) {
                console.log('[STREAM] Closing Portal...');
                if (CHILD_PROCESSES['DESKTOP_STREAM'].pid) {
                    try { process.kill(CHILD_PROCESSES['DESKTOP_STREAM'].pid); } catch (e) { }
                }
                delete CHILD_PROCESSES['DESKTOP_STREAM'];
                await manager.broadcast('Desktop Portal Offline');
            }
        } else if (action.startsWith('sys:start_') || action.startsWith('sys:stop_') || action.startsWith('sys:restart_') ||
            action.startsWith('sys:local_start_') || action.startsWith('sys:local_stop_') || action.startsWith('sys:local_restart_') ||
            action.startsWith('sys:cloud_start_') || action.startsWith('sys:cloud_stop_') || action.startsWith('sys:cloud_restart_')) {

            // Normalize action string
            let cleanAction = action;
            let mode = 'legacy';
            if (action.startsWith('sys:local_')) {
                mode = 'local';
                cleanAction = action.replace('sys:local_', 'sys:');
            }
            if (action.startsWith('sys:cloud_')) {
                mode = 'cloud';
                cleanAction = action.replace('sys:cloud_', 'sys:');
            }

            const parts = cleanAction.split('_');
            const verb = parts[0].replace('sys:', ''); // start, stop, restart
            const target = parts[1].toUpperCase();

            const CLOUD_ONLY = process.env.MATRIX_CLOUD_MODE === 'true';
            // In cloud-only mode, only explicit sys:local_* commands may touch local services.
            if (mode === 'cloud' || (CLOUD_ONLY && mode !== 'local')) {
                console.log(`[CLOUD_SIM] Intercepted ${verb} execution for ${target} (mode=${mode}, cloud_only=${CLOUD_ONLY}).`);
                await manager.broadcast(`[CLOUD_SIM] ${verb} command accepted for ${target}; local launch skipped.`);
            } else if (SERVICES[target]) {
                const svc = SERVICES[target];
                if (verb === 'start') {
                    await manager.startService(target);
                    if (svc.port) {
                        const ready = await manager.waitForPort(svc.port, 30000);
                        if (!ready) throw new Error(`${target} failed to become ready on port ${svc.port}`);
                    }
                } else if (verb === 'stop') {
                    await manager.killService(target);
                    // Broadcast offline status for this specific service immediately
                    const servicesPayload = { [target.toLowerCase()]: 'offline' };
                    await supabase.from('ghost_bridge').insert({
                        command: 'sys:heartbeat', source: 'nexus_sentinel', status: 'silent',
                        output: JSON.stringify({ services: servicesPayload, timestamp: Date.now() })
                    });
                } else if (verb === 'restart') {
                    await manager.restartService(target);
                    if (svc.port) {
                        const ready = await manager.waitForPort(svc.port, 30000);
                        if (!ready) throw new Error(`${target} failed to become ready on port ${svc.port}`);
                    }
                }
            }
        } else if (action === 'sys:update' || action === 'sys:rebuild') {
            console.log('[UPDATE] Cloud app update triggered (Rebuilding).');
            await manager.broadcast('Cloud apps updating/rebuilding...');
            try { execSync(`powershell -WindowStyle Hidden -ExecutionPolicy Bypass -Command "npm run build"`, { stdio: 'ignore', cwd: path.join(__dirname, '../../..') }); } catch (e) { }
        } else if (action === 'sys:heal') {
            await purgeZombies();
        } else if (action === 'sys:autopilot' || action === 'sys:autopilot_full') {
            const mode = action === 'sys:autopilot_full' ? 'full' : 'quick';
            const result = await runOpsAutopilot(mode);
            const output = {
                command: action,
                ok: result.ok,
                reason: result.reason,
                summary: result.summary
            };
            await supabase
                .from('ghost_bridge')
                .update({ status: result.ok ? 'executed' : 'failed', output: JSON.stringify(output) })
                .eq('id', cmd.id);
            return;
        } else if (action === 'sys:maintenance_window') {
            const result = await runMaintenanceWindow(manager);
            await supabase
                .from('ghost_bridge')
                .update({
                    status: result.ok ? 'executed' : 'failed',
                    output: JSON.stringify({
                        command: action,
                        ok: result.ok,
                        paused: result.paused,
                        autopilot: result.autopilot,
                        readiness: { ok: result.readiness.ok }
                    })
                })
                .eq('id', cmd.id);
            return;
        } else if (action === 'sys:emergency_recover') {
            const result = await runEmergencyRecover(manager);
            await supabase
                .from('ghost_bridge')
                .update({
                    status: result.ok ? 'executed' : 'failed',
                    output: JSON.stringify({
                        command: action,
                        ok: result.ok,
                        maintenance: result.maintenance,
                        postHeal: result.postHeal
                    })
                })
                .eq('id', cmd.id);
            return;
        } else if (action === 'sys:maintenance_exit') {
            MAINTENANCE_MODE = false;
            await manager.broadcast('Maintenance mode disabled by operator.');
            await supabase
                .from('ghost_bridge')
                .update({ status: 'executed', output: 'MAINTENANCE_MODE_DISABLED' })
                .eq('id', cmd.id);
            return;
        } else if (action === 'sys:cloud_ignite') {
            console.log('[CLOUD] Manual Cloud Ignite Requested...');
            const result = await integrationHub.execute('github', 'trigger_workflow', {
                workflow_id: 'matrix-shadow.yml',
                inputs: { action: 'deploy' }
            });
            if (result.success) {
                await manager.broadcast('Manual Cloud Ignition sequence dispatched.');
            } else {
                throw new Error(`Cloud Ignite Failed: ${result.error}`);
            }
        } else if (action === 'sys:cloud_kill') {
            console.log('[CLOUD] Manual Cloud Kill Requested...');
            // In a real scenario, this might cancel the workflow or send a command to the remote sentinel
            // For now, we'll log it as a request to the remote instance via the bridge
            await supabase.from('ghost_bridge').insert({
                command: 'sys:kill_all',
                source: 'nexus_sentinel_local',
                status: 'pending',
                payload: JSON.stringify({ remote: true })
            });
            await manager.broadcast('Cloud remote shutdown command queued.');
        }

        await supabase.from('ghost_bridge').update({ status: 'executed', output: `COMPLETED: ${action}` }).eq('id', cmd.id);

    } catch (err) {
        console.error(`[EXEC_FAIL] ${err.message}`);
        await supabase.from('ghost_bridge').update({ status: 'failed', output: `ERROR: ${err.message}` }).eq('id', cmd.id);
    }
}

let cachedPorts = { 3000: false, 3001: false, 5173: false, 4000: false, 3005: false };
let lastPortCheck = 0;

function checkPorts(force = false) {
    const now = Date.now();
    if (!force && (now - lastPortCheck < 30000)) return Promise.resolve(cachedPorts);

    return new Promise(async (resolve) => {
        lastPortCheck = now;
        const portsToCheck = [3000, 3001, 5173, 4000, 3005];
        const results = { 3000: false, 3001: false, 5173: false, 4000: false, 3005: false };

        await Promise.all(portsToCheck.map(port => {
            return new Promise((res) => {
                const socket = new net.Socket();
                socket.setTimeout(800);
                socket.once('connect', () => {
                    results[port] = true;
                    socket.destroy();
                    res();
                });
                socket.once('timeout', () => { socket.destroy(); res(); });
                socket.once('error', () => { socket.destroy(); res(); });
                socket.connect(port, '127.0.0.1');
            });
        }));

        cachedPorts = results;
        resolve(cachedPorts);
    });
}

function checkHealth(port, pathStr) {
    return new Promise(resolve => {
        const req = http.get({ hostname: 'localhost', port, path: pathStr, timeout: 2000 }, (res) => {
            resolve(res.statusCode >= 200 && res.statusCode < 400 ? 'online' : 'degraded');
        });
        req.on('error', () => resolve('offline'));
        req.setTimeout(2000, () => { req.destroy(); resolve('offline'); });
    });
}

function getLocalIp() {
    const interfaces = require('os').networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) return iface.address;
        }
    }
    return '127.0.0.1';
}

// --- CPU MONITORING CONSTANTS ---
let lastCpuUsage = process.cpuUsage();
let lastCpuTime = Date.now();
let lastSysCpu = null;

function getSystemCpu() {
    const cpus = require('os').cpus();
    let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;

    for (const cpu of cpus) {
        user += cpu.times.user;
        nice += cpu.times.nice;
        sys += cpu.times.sys;
        idle += cpu.times.idle;
        irq += cpu.times.irq;
    }
    return { user, nice, sys, idle, irq, total: user + nice + sys + idle + irq };
}

let startCpu = getSystemCpu();

function calculateCpuPercent() {
    const endCpu = getSystemCpu();
    const headers = ['user', 'nice', 'sys', 'idle', 'irq'];
    let totalDiff = endCpu.total - startCpu.total;
    let idleDiff = endCpu.idle - startCpu.idle;

    startCpu = endCpu;

    if (totalDiff === 0) return '0%';
    const percentage = 100 - Math.round((idleDiff / totalDiff) * 100);
    return `${percentage}%`;
}

// CACHE FOR HEALTH CHECKS
let cachedHealth = { reflect: 'online', nexus: 'online', ghost: 'online', rocket: 'online', citadel: 'online' };
let lastHealthCheck = 0;

const pulse = async () => {
    if (!WATCHDOG_ACTIVE) return;
    const pulseStart = Date.now();
    try {
        // Update Health Checks only every 5 seconds
        if (Date.now() - lastHealthCheck > 5000) {
            const [reflectH, nexusH, ghostH, rocketH, citadelH] = await Promise.all([
                checkHealth(3000, '/api/health'),
                checkHealth(3001, '/api/health'),
                checkHealth(5173, '/'),
                checkHealth(4000, '/api/health'),
                checkHealth(3005, '/api/health')
            ]);
            cachedHealth = { reflect: reflectH, nexus: nexusH, ghost: ghostH, rocket: rocketH, citadel: citadelH };
            lastHealthCheck = Date.now();

            // AUTO-HEAL: If all core services are offline, trigger ghost purge
            // WARN: Disabled to prevention startup race condition
            /* if (reflectH === 'offline' && nexusH === 'offline' && ghostH === 'offline') {
                console.warn('\x1b[33m[SELF-HEAL] Global blackout detected. Triggering environment purge...\x1b[0m');
                await purgeZombies();
            } */
        }

        const ports = await checkPorts();
        const localIp = getLocalIp();

        // ... (existing determine and runner logic)
        const determine = (port, health) => {
            if (health === 'online') return 'online';
            if (ports[port]) return 'online';
            return 'offline';
        };

        let runnerStatus = 'offline';
        if (CHILD_PROCESSES['RUNNER']) {
            runnerStatus = 'online';
        } else {
            // CACHE: Externally started runner check (PowerShell is expensive)
            const RUNNER_CHECK_INTERVAL = 5000;
            const nowTime = Date.now();

            if (!global.lastRunnerCheck || (nowTime - global.lastRunnerCheck > RUNNER_CHECK_INTERVAL)) {
                global.lastRunnerCheck = nowTime;
                try {
                    const findCmd = `powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*ghost-runner.cjs*' } | Select-Object -ExpandProperty Id"`;
                    const foundPids = await new Promise(r => exec(findCmd, (err, stdout) => r(stdout.trim())));
                    global.lastRunnerStatusCache = foundPids ? 'online' : 'offline';
                } catch (e) {
                    global.lastRunnerStatusCache = 'offline';
                }
            }
            runnerStatus = global.lastRunnerStatusCache || 'offline';
        }

        const services = {
            reflect: determine(3000, cachedHealth.reflect),
            nexus: determine(3001, cachedHealth.nexus),
            ghost: determine(5173, cachedHealth.ghost),
            rocket: determine(4000, cachedHealth.rocket),
            citadel: determine(3005, cachedHealth.citadel),
            runner: runnerStatus,
            sentinel: 'online',
            gate: Object.values(GATES).some(g => g.url) ? 'online' : 'offline'
        };

        if (services.runner === 'offline') {
            MISSED_RUNNER_PULSES.count += 1;
        } else {
            MISSED_RUNNER_PULSES.count = 0;
        }

        if (MISSED_RUNNER_PULSES.count === 3) {
            const alertMeta = {
                title: 'Runner Heartbeat SLO Breach',
                message: 'ghost_runner offline for 3 consecutive pulse windows',
                type: 'critical',
                timestamp: Date.now(),
                services
            };
            await Promise.allSettled([
                supabase.from('system_alerts').insert({
                    source: 'nexus_sentinel',
                    severity: 'critical',
                    title: alertMeta.title,
                    message: alertMeta.message,
                    metadata: alertMeta
                }),
                supabase.from('ghost_bridge').insert({
                    command: 'sys:alert',
                    source: 'nexus_sentinel',
                    status: 'broadcast',
                    output: JSON.stringify(alertMeta)
                })
            ]);
        }

        const os = require('os');
        const usedMem = os.totalmem() - os.freemem();
        const ramUsage = Math.round((usedMem / os.totalmem()) * 100);

        const duration = Date.now() - pulseStart;

        // Calculate CPU properly
        const cpuPercent = calculateCpuPercent();

        const payload = {
            uptime: process.uptime(),
            launchTime: LAUNCH_TIMESTAMP,
            pid: currentPid,
            ram: ramUsage.toString(),
            cpu: cpuPercent,
            pulse_duration: duration,
            services: services,
            serviceStartTimes: SERVICE_START_TIMES,
            gateUrls: { nexus: GATES.NEXUS.url, reflect: GATES.REFLECT.url, ghost: GATES.GHOST.url, rocket: GATES.ROCKET.url },
            localIp: localIp
        };

        if (duration > 2000) console.log(`[PERF] High latency pulse: ${duration}ms`); // Throttled from 1000ms

        // 0. BUFFER (Local Access)
        latestStatusPayload = payload;

        // 1. BROADCAST (Real-time, 1s heartbeat)
        healthBroadcast.httpSend({ type: 'broadcast', event: 'heartbeat', payload });

        // 2. PERSIST (Throttled to 30s to prevent DB spam)
        const HEARTBEAT_PERSIST_INTERVAL = 5000;
        const now = Date.now();
        if (!global.lastHeartbeatPersist || (now - global.lastHeartbeatPersist > HEARTBEAT_PERSIST_INTERVAL)) {
            global.lastHeartbeatPersist = now;
            await supabase.from('ghost_bridge').insert({
                command: 'sys:heartbeat',
                source: 'nexus_sentinel',
                status: 'silent',
                output: JSON.stringify(payload)
            });
            // Dual-write heartbeat stream to dedicated observability table (best-effort).
            try {
                await supabase.from('system_heartbeats').insert({
                    source: 'nexus_sentinel',
                    status: 'online',
                    payload
                });
            } catch { }
        }
    } catch (e) { }
};

// --- PURGE LOGIC (Top Level Priority) ---
const IS_PURGE = process.argv.includes('--purge');
try {
    if (fs.existsSync(LOCK_FILE)) {
        try {
            const oldPid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8'));
            process.kill(oldPid, 0); // Check if process exists

            if (IS_PURGE) {
                console.log(`[SENTINEL] Purge requested. Terminating old instance (PID ${oldPid})...`);
                try { process.kill(oldPid, 'SIGKILL'); } catch (e) { }
                try { fs.unlinkSync(LOCK_FILE); } catch (e) { }
                process.exit(0);
            } else {
                console.log(`[SENTINEL] Instance already running (PID ${oldPid}).`);
                console.log('[SENTINEL] Exiting to avoid conflict. Use "launchers\\matrix.bat restart" to reboot.');
                process.exit(0);
            }
        } catch (e) {
            console.log('[SENTINEL] Stale lockfile detected. Taking over.');
            fs.unlinkSync(LOCK_FILE);
        }
    } else if (IS_PURGE) {
        // No lockfile, but purge requested. Just exit cleanly.
        console.log('[SENTINEL] No active instance found to purge.');
        process.exit(0);
    }

    // Normal startup - write lockfile
    fs.writeFileSync(LOCK_FILE, currentPid.toString());
} catch (e) { }

const channel = supabase.channel('sentinel_v3')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ghost_bridge' }, (payload) => { executeCommand(payload.new); })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ghost_bridge' }, (payload) => {
        const { status, output } = payload.new;
        if (status === 'executed' && output?.startsWith('SYNTHESIS_SUCCESS:')) {
            const componentName = output.replace('SYNTHESIS_SUCCESS:', '').trim().split(' ')[0];
            manager.broadcast(`🏗️ ARCH_CHANGE: Synthetic module '${componentName}' deployed to dashboard.`);
        }
    })
    .subscribe();

// Fallback command poller: keeps bridge commands flowing even if realtime subscription degrades.
async function pollPendingBridgeCommands() {
    try {
        const freshCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from('ghost_bridge')
            .select('*')
            .eq('status', 'pending')
            .gte('created_at', freshCutoff)
            .order('created_at', { ascending: true })
            .limit(30);
        if (error) return;
        if (!Array.isArray(data) || data.length === 0) return;
        for (const cmd of data) {
            await executeCommand(cmd);
        }
    } catch (e) {
        // Keep silent: this should never impact core runtime.
    }
}

setTimeout(() => { pollPendingBridgeCommands().catch(() => { }); }, 1500);
setInterval(() => { pollPendingBridgeCommands().catch(() => { }); }, 5000);

// --- LOCAL STATUS SERVER (HYBRID CONNECTIVITY) ---
let latestStatusPayload = null;
const LOCAL_PORT = 3333;

const statusServer = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(latestStatusPayload || { status: 'initializing' }));
    } else {
        res.writeHead(404);
        res.end();
    }
});

statusServer.listen(LOCAL_PORT, () => {
    console.log(`[NET] Local Status Hub active on port ${LOCAL_PORT}`);
});

setInterval(async () => {
    try {
        const { data: pending, error } = await supabase.from('ghost_bridge').select('*').eq('status', 'pending').order('command', { ascending: false }).limit(20);
        if (error || !pending || pending.length === 0) return;

        // Prioritize heartbeats by sorting sys:heartbeat to the front
        const sorted = pending.sort((a, b) => {
            const aIsHb = (a.command || '').startsWith('sys:heartbeat');
            const bIsHb = (b.command || '').startsWith('sys:heartbeat');
            if (aIsHb && !bIsHb) return -1;
            if (!aIsHb && bIsHb) return 1;
            return 0;
        });

        // --- RALPH INTEGRATION ---
        const { RalphCore } = require('../../core/sage/ralph-core.mjs');
        const ralphMap = new Map(); // Store agents by session/id if needed, or stateless for now?
        // For now, we'll instantiate fresh for simplicity, or keep a single instance per request? 
        // Actually, for a single "task", we might want a persistent loop. 
        // But the UI sends a single command. Let's treat "ralph:" as a single prompt for now, 
        // OR simpler: The user wants "tasks". 
        // We'll perform ONE step of thinking/execution per command, or run a short loop?
        // Let's run a short loop (max 5 steps) to prevent timeouts, then ask for more?

        async function processRalphCommand(cmd, bridgeId) {
            const goal = cmd.content.replace('ralph:', '').trim();
            const ralph = new RalphCore(process.cwd()); // Root context

            await updateBridge(bridgeId, 'executing', `RALPH: Analyzing "${goal}"...`);

            try {
                // Run a loop up to 5 steps
                for (let i = 0; i < 5; i++) {
                    const plan = await ralph.think(goal);

                    if (plan.tool === 'COMPLETE') {
                        await updateBridge(bridgeId, 'executed', `RALPH: ${plan.args[0]}`);
                        return;
                    }

                    await updateBridge(bridgeId, 'executing', `RALPH: ${plan.thought || 'Working...'}`);

                    const { done, result } = await ralph.execute(plan.tool, plan.args, async (msg) => {
                        // Optional: Stream intermediate logs?
                        // For now, just log to console
                        console.log(msg);
                    });

                    if (done) {
                        await updateBridge(bridgeId, 'executed', `RALPH: ${result}`);
                        return;
                    }
                }
                await updateBridge(bridgeId, 'executed', `RALPH: Paused after 5 steps. Last output: ${ralph.history[ralph.history.length - 1].content.substring(0, 100)}...`);
            } catch (e) {
                await updateBridge(bridgeId, 'failed', `RALPH ERROR: ${e.message}`);
            }
        }

        async function updateBridge(id, status, output) {
            await supabase.from('ghost_bridge').update({ status, output }).eq('id', id);
        }

        // ... (Existing Loop)

        for (const cmd of sorted) {
            const commandText = cmd.command || '';
            const isSys = commandText.startsWith('sys:');
            const isRalph = commandText.startsWith('ralph:');

            if (isSys) {
                const { error: upErr, data: updated } = await supabase
                    .from('ghost_bridge')
                    .update({ status: 'executing', output: `ACK: ${commandText}` })
                    .eq('id', cmd.id)
                    .eq('status', 'pending')
                    .select();

                if (!upErr && updated && updated.length > 0) {
                    await executeCommand(cmd);
                }
            } else if (isRalph) {
                // Initialize execution state
                await supabase
                    .from('ghost_bridge')
                    .update({ status: 'executing', output: `RALPH: Waking up...` })
                    .eq('id', cmd.id);

                // Process async (fire and forget from loop perspective to not block heartbeats)
                processRalphCommand({ content: commandText, id: cmd.id }, cmd.id);
            }
        }
    } catch (e) { }
}, 3000);

setInterval(pulse, 3000); // Throttled from 1s to 3s to reduce CPU overhead in production
setInterval(() => registry.heartbeat(), 30000);

// --- AUTO-TRIAGE ON BOOT ---
setTimeout(async () => {
    console.log('[TRIAGE] Running auto-triage on boot...');
    try {
        const { TRIAGE, ORACLE } = require('./triage.cjs');
        const apps = TRIAGE.listApps();

        for (const app of apps) {
            try {
                const result = await ORACLE.scan(app, { dryRun: true });
                const score = result.healthScore;
                const status = score >= 80 ? '✅' : score >= 60 ? '⚠️' : '🔴';
                console.log(`[TRIAGE] ${status} ${app}: ${score}/100`);

                // Post health to ghost_bridge
                await supabase.from('ghost_bridge').insert({
                    command: 'triage:boot_health',
                    payload: JSON.stringify({ app, healthScore: score, timestamp: new Date().toISOString() }),
                    status: 'complete',
                    source: 'nexus_sentinel'
                });
            } catch (appErr) {
                console.log(`[TRIAGE] ⏭️ ${app}: skipped (${appErr.message})`);
            }
        }

        console.log('[TRIAGE] Boot scan complete.');
    } catch (e) {
        console.log('[TRIAGE] Auto-triage skipped:', e.message);
    }
}, 60000); // Run 60s after boot to let services initialize

// --- SCHEDULED TRIAGE RUNS ---
// Check every minute if scheduled triage should run (based on triage.config.json)
setInterval(async () => {
    try {
        let config = {};
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } catch (e) {
            console.warn('[SENTINEL] Failed to parse triage.config.json, skipping scheduled run');
            return;
        }
        if (!config.schedule?.enabled || !config.schedule?.cron) return;

        // Simple cron parser: "0 6 * * *" = 6:00 AM daily
        const [minute, hour] = config.schedule.cron.split(' ').map(Number);
        const now = new Date();

        // Check if current time matches schedule (within 1-minute window)
        if (now.getHours() === hour && now.getMinutes() === minute) {
            console.log('[TRIAGE] Scheduled run triggered...');

            const { TRIAGE, ORACLE } = require('./triage.cjs');
            const apps = config.schedule.apps || TRIAGE.listApps();

            for (const app of apps) {
                try {
                    const result = await ORACLE.scan(app, { dryRun: true });
                    console.log(`[TRIAGE] Scheduled: ${app} = ${result.healthScore}/100`);

                    await supabase.from('ghost_bridge').insert({
                        command: 'triage:scheduled',
                        payload: JSON.stringify({ app, healthScore: result.healthScore }),
                        status: 'complete',
                        source: 'nexus_sentinel'
                    });
                } catch (e) {
                    console.log(`[TRIAGE] Scheduled ${app} failed: ${e.message}`);
                }
            }
        }
    } catch (e) { /* ignore */ }
}, 60000); // Check every minute

// --- SELF-CLEANING MAINTENANCE ROUTINES ---

// Database Hygiene: Clean old ghost_bridge records every 15 minutes
setInterval(async () => {
    try {
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600000).toISOString();

        // Delete old heartbeats (keep last hour only)
        await supabase.from('ghost_bridge')
            .delete()
            .eq('command', 'sys:heartbeat')
            .lt('created_at', oneHourAgo);

        // Delete old executed/failed commands (keep last 3 days)
        await supabase.from('ghost_bridge')
            .delete()
            .in('status', ['executed', 'failed'])
            .lt('created_at', threeDaysAgo);

        // Expire stuck pending/executing commands older than 2 hours.
        const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
        await supabase.from('ghost_bridge')
            .update({ status: 'expired', output: 'Expired by hygiene loop (stale pending/executing > 2h)' })
            .in('status', ['pending', 'executing'])
            .lt('created_at', twoHoursAgo);

        // Trim observability tables to avoid unbounded growth.
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
        await supabase.from('system_heartbeats')
            .delete()
            .lt('created_at', sevenDaysAgo);
        await supabase.from('process_launch_events')
            .delete()
            .lt('created_at', sevenDaysAgo);

        console.log('[HYGIENE] Database cleaned.');
    } catch (e) { }
}, 15 * 60 * 1000); // Every 15 minutes

// Memory/Process Health: Log memory usage every 5 minutes
setInterval(() => {
    const used = process.memoryUsage();
    const mb = (bytes) => Math.round(bytes / 1024 / 1024);
    console.log(`[HEALTH] Memory: ${mb(used.heapUsed)}/${mb(used.heapTotal)}MB heap, ${mb(used.rss)}MB RSS`);

    // If heap usage > 500MB, trigger garbage collection hint
    if (used.heapUsed > 500 * 1024 * 1024) {
        console.log('[HEALTH] High memory detected. Recommending restart.');
        manager.logDiagnostic('SENTINEL', 'HIGH_MEMORY_WARNING', 'warning', 'performance');
    }
}, 5 * 60 * 1000); // Every 5 minutes

// Zombie Process Detection: Check for orphan processes every 10 minutes
setInterval(async () => {
    try {
        const checkCmd = `powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' } | Measure-Object | Select-Object -ExpandProperty Count"`;
        const nodeCount = parseInt(execSync(checkCmd, { encoding: 'utf8' }).trim()) || 0;
        if (nodeCount > 10) {
            console.log(`[HYGIENE] WARNING: ${nodeCount} Node processes detected. Consider running zombie_purge.ps1`);
        }
    } catch (e) { }
}, 10 * 60 * 1000); // Every 10 minutes

// Directory Cleaning: Run matrix_cleaner.ps1 every 6 hours
setInterval(() => {
    try {
        const cleanerPath = path.join(__dirname, '../scripts/matrix_cleaner.ps1');
        console.log('[HYGIENE] Running scheduled directory cleanup...');
        exec(`powershell -ExecutionPolicy Bypass -File "${cleanerPath}"`, (err, stdout, stderr) => {
            if (err) {
                console.log('[HYGIENE] Cleanup encountered errors:', stderr);
            } else {
                console.log('[HYGIENE] Directory cleanup complete.');
            }
        });
    } catch (e) { }
}, 6 * 60 * 60 * 1000); // Every 6 hours

// --- PERFORMANCE OPTIMIZATION ROUTINES ---

// Set child process priorities to below-normal to keep desktop responsive
function setProcessPriority(pid, priority = 'BelowNormal') {
    if (!pid) return;
    // Async priority setting to avoid blocking heartbeat loop
    exec(`powershell -Command "(Get-Process -Id ${pid} -ErrorAction SilentlyContinue).PriorityClass = '${priority}'"`, () => { });
}

// --- TELEGRAM INTEGRATION ---

const updateTelegramWebhook = async (newUrl) => {
    if (!process.env.TELEGRAM_BOT_TOKEN || !newUrl) return;
    try {
        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook?url=${newUrl}/api/telegram`;
        await fetch(url);
        console.log(`[TELEGRAM] Webhook updated via Neural Link: ${newUrl}`);
    } catch (e) {
        console.log(`[TELEGRAM] Failed to update webhook: ${e.message}`);
    }
};

let lastGateUrl = null;
setInterval(() => {
    // The Telegram Route lives in Reflect (apps/reflect), so we must use the Reflect Gate URL
    if (GATES.REFLECT.url && GATES.REFLECT.url !== lastGateUrl) {
        lastGateUrl = GATES.REFLECT.url;
        updateTelegramWebhook(lastGateUrl);
    }
}, 5000);

// --- ENHANCED SELF-HEALING SYSTEMS ---

// Apply below-normal priority to all dev server processes every 2 minutes
setInterval(() => {
    try {
        for (const [name, child] of Object.entries(CHILD_PROCESSES)) {
            if (child && child.pid) {
                if (setProcessPriority(child.pid, 'BelowNormal')) {
                    // Also get child processes (Next.js spawns many node instances)
                    try {
                        const childPids = execSync(
                            `powershell -Command "(Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq ${child.pid} }).ProcessId"`,
                            { encoding: 'utf8' }
                        ).trim().split('\n').filter(p => p);
                        childPids.forEach(pid => setProcessPriority(parseInt(pid), 'BelowNormal'));
                    } catch (e) { }
                }
            }
        }
    } catch (e) { }
}, 2 * 60 * 1000); // Every 2 minutes

// Memory leak detection: Track per-service memory and restart if exceeding 1GB
const serviceMemoryHistory = {};
setInterval(async () => {
    try {
        for (const [name, child] of Object.entries(CHILD_PROCESSES)) {
            if (child && child.pid) {
                try {
                    const memoryCmd = `powershell -Command "(Get-Process -Id ${child.pid}).WorkingSet64"`;
                    const memoryBytes = parseInt(execSync(memoryCmd, { encoding: 'utf8' }).trim()) || 0;
                    const memoryMB = Math.round(memoryBytes / 1024 / 1024);

                    // Track history
                    if (!serviceMemoryHistory[name]) serviceMemoryHistory[name] = [];
                    serviceMemoryHistory[name].push(memoryMB);
                    if (serviceMemoryHistory[name].length > 5) serviceMemoryHistory[name].shift();

                    // If consistently over 768MB, restart the service (Evolution v4 Hard Limit)
                    if (memoryMB > 768 && serviceMemoryHistory[name].every(m => m > 700)) {
                        console.log(`[PERF] ${name} memory at ${memoryMB}MB - exceeding 768MB limit - auto-restarting...`);
                        await manager.logDiagnostic(name, 'MEMORY_LEAK_RESTART', 'warning', 'performance');
                        await manager.restartService(name);
                        serviceMemoryHistory[name] = [];
                    }
                } catch (e) { }
            }
        }
    } catch (e) { }
}, 3 * 60 * 1000); // Every 3 minutes

// Clear Windows standby memory every 30 minutes (requires admin, may fail silently)
setInterval(() => {
    try {
        // This uses a PowerShell command that works without external tools
        exec(`powershell -Command "[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers()"`, () => { });
        console.log('[PERF] Triggered garbage collection.');
    } catch (e) { }
}, 30 * 60 * 1000); // Every 30 minutes

// --- ENHANCED SELF-HEALING SYSTEMS ---

// Automatic Backup: Create backup of critical files every 12 hours
setInterval(() => {
    try {
        const backupDir = path.join(__dirname, '../backups');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupPath = path.join(backupDir, `auto_${timestamp}`);

        // Create backup directory
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        if (!fs.existsSync(backupPath)) fs.mkdirSync(backupPath, { recursive: true });

        // Backup critical files
        const criticalFiles = [
            { src: path.join(__dirname, 'sentinel.cjs'), dest: path.join(backupPath, 'sentinel.cjs') },
            { src: path.join(__dirname, 'ghost-runner.cjs'), dest: path.join(backupPath, 'ghost-runner.cjs') },
            { src: path.join(__dirname, '../.env'), dest: path.join(backupPath, '.env') }
        ];

        criticalFiles.forEach(({ src, dest }) => {
            if (fs.existsSync(src)) {
                fs.copyFileSync(src, dest);
            }
        });

        console.log(`[BACKUP] Auto-backup created: ${backupPath}`);

        // Cleanup old backups (keep last 5 auto backups)
        const backups = fs.readdirSync(backupDir)
            .filter(d => d.startsWith('auto_'))
            .sort()
            .reverse();

        if (backups.length > 5) {
            backups.slice(5).forEach(old => {
                const oldPath = path.join(backupDir, old);
                try {
                    fs.rmSync(oldPath, { recursive: true, force: true });
                    console.log(`[BACKUP] Pruned old backup: ${old}`);
                } catch (e) { }
            });
        }
    } catch (e) {
        console.log(`[BACKUP] Error: ${e.message}`);
    }
}, 12 * 60 * 60 * 1000); // Every 12 hours

// Run initial backup on startup (after 5 minutes)
setTimeout(() => {
    try {
        const backupDir = path.join(__dirname, '../backups');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupPath = path.join(backupDir, `startup_${timestamp}`);
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        if (!fs.existsSync(backupPath)) fs.mkdirSync(backupPath, { recursive: true });

        const criticalFiles = [
            { src: path.join(__dirname, 'sentinel.cjs'), dest: path.join(backupPath, 'sentinel.cjs') },
            { src: path.join(__dirname, 'ghost-runner.cjs'), dest: path.join(backupPath, 'ghost-runner.cjs') }
        ];
        criticalFiles.forEach(({ src, dest }) => {
            if (fs.existsSync(src)) fs.copyFileSync(src, dest);
        });
        console.log(`[BACKUP] Startup backup created: ${backupPath}`);
    } catch (e) { }
}, 5 * 60 * 1000);

// Command schema telemetry snapshot
setInterval(async () => {
    try {
        const summary = {
            mode: STRICT_COMMAND_SCHEMA ? 'strict' : 'compat',
            rejected: COMMAND_SCHEMA_METRICS.rejected,
            warned: COMMAND_SCHEMA_METRICS.warned,
            reasons: COMMAND_SCHEMA_METRICS.reasons,
            timestamp: new Date().toISOString()
        };
        await supabase.from('ghost_bridge').insert({
            command: 'sys:schema_metrics',
            source: 'nexus_sentinel',
            status: 'silent',
            output: JSON.stringify(summary)
        });
    } catch (e) { }
}, 5 * 60 * 1000);

// Health Check with Auto-Recovery: Verify services are responding every 5 minutes
setInterval(async () => {
    if (!WATCHDOG_ACTIVE) return;

    for (const [name, config] of Object.entries(SERVICES)) {
        if (!config.port || !CHILD_PROCESSES[name]) continue;

        try {
            const healthCheck = () => new Promise((resolve) => {
                const req = http.get(`http://localhost:${config.port}${config.healthPath || '/'}`, { timeout: 5000 }, (res) => {
                    resolve(res.statusCode < 500);
                });
                req.on('error', () => resolve(false));
                req.on('timeout', () => { req.destroy(); resolve(false); });
            });

            const isHealthy = await healthCheck();
            if (!isHealthy) {
                console.log(`[HEALTH] ${name} not responding - auto-restarting...`);
                await manager.restartService(name);
            }
        } catch (e) { }
    }
}, 5 * 60 * 1000); // Every 5 minutes

// Ops Autopilot: autonomous remediation loop (default on, set MATRIX_AUTO_HEAL=0 to disable)
setInterval(async () => {
    if (!WATCHDOG_ACTIVE || !AUTO_HEAL_ENABLED || AUTO_HEAL_RUNNING) return;
    if (MAINTENANCE_MODE) return;
    if (Date.now() - LAST_AUTO_HEAL_TS < 10 * 60 * 1000) return; // cooldown

    const degraded = await shouldTriggerAutoHeal();
    if (!degraded) return;

    AUTO_HEAL_RUNNING = true;
    LAST_AUTO_HEAL_TS = Date.now();
    console.log('[AUTOHEAL] Degradation detected. Running ops autopilot quick pass...');

    try {
        const result = await runOpsAutopilot('quick');
        await manager.logDiagnostic(
            'SENTINEL',
            result.ok ? 'AUTOHEAL_OK' : 'AUTOHEAL_DEGRADED',
            result.ok ? 'info' : 'warning',
            'autopilot'
        );
        await manager.broadcast(
            result.ok
                ? 'Auto-heal completed successfully.'
                : 'Auto-heal executed but system remains degraded. Check diagnostics panel.'
        );
    } catch (e) {
        await manager.logDiagnostic('SENTINEL', 'AUTOHEAL_FAILED', 'error', 'autopilot');
    } finally {
        AUTO_HEAL_RUNNING = false;
    }
}, 5 * 60 * 1000);

// Database Connection Retry: Verify Supabase connection
let dbRetryCount = 0;
setInterval(async () => {
    try {
        const { data, error } = await supabase.from('ghost_bridge').select('id').limit(1);
        if (error) throw error;
        dbRetryCount = 0; // Reset on success
    } catch (e) {
        dbRetryCount++;
        console.log(`[DB] Connection issue (attempt ${dbRetryCount}): ${e.message}`);
        if (dbRetryCount >= 3) {
            console.log('[DB] Multiple failures - check Supabase connection');
            // Could add alerting here
        }
    }
}, 2 * 60 * 1000); // Every 2 minutes


(async () => {
    await registry.register();
    console.log('[HIVE] Sentinel Node Registered.');
    const shutdown = async () => {
        console.log('[SHUTDOWN] Deregistering from Hive...');
        try { await registry.shutdown(); } catch (e) { }
        if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    if (process.argv.includes('--purge')) {
        console.log('[SYS] Deep Purge Requested via CLI...');
        await executeCommand({ id: 'cli-purge-' + Date.now(), command: 'sys:purge', created_at: new Date().toISOString() });
        console.log('[SYS] Purge Complete. Exiting.');
        process.exit(0);
    }
    if (process.argv.includes('--boot') || HEADLESS_MODE) {
        console.log('[BOOT] Auto-Ignition Initiated...');
        setTimeout(() => executeCommand({ id: 'boot-' + Date.now(), command: 'sys:ignite', created_at: new Date().toISOString() }), 1000);
    }
})();
// --- TELEGRAM HELPER FUNCTIONS ---
// --- TELEGRAM HELPER FUNCTIONS ---
const sendTelegramReply = async (chatId, text) => {
    if (!process.env.TELEGRAM_BOT_TOKEN) return;
    try {
        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: text })
        });
    } catch (e) { console.error('Telegram Reply Failed:', e.message); }
};

const sendTelegramFile = async (chatId, filePath, caption) => {
    if (!process.env.TELEGRAM_BOT_TOKEN || !fs.existsSync(filePath)) return;
    try {
        const stats = fs.statSync(filePath);
        // Determine endpoint based on extension
        const ext = path.extname(filePath).toLowerCase();
        const isPhoto = ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
        const endpoint = isPhoto ? 'sendPhoto' : 'sendDocument';

        const fileBlob = await require('node:fs').openAsBlob(filePath);
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append(isPhoto ? 'photo' : 'document', fileBlob, path.basename(filePath));
        if (caption) formData.append('caption', caption);

        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${endpoint}`;
        const res = await fetch(url, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            // Check Gate Health and Auto-Recover (Evolution v4.1)
            for (const [name, gate] of Object.entries(GATES)) {
                if (gate.url && !gate.process) {
                    console.log(`[GATE] ${name} supposed to be online but process missing. Recovering...`);
                    executeCommand({ id: `auto-recover-${name}-${Date.now()}`, command: `sys:open_gate_${name.toLowerCase()}`, created_at: new Date().toISOString() });
                }
            }

            const stats = await checkPorts();
            const err = await res.text();
            throw new Error(err);
        }
        console.log(`[TELEGRAM] Sent file: ${filePath}`);
    } catch (e) {
        console.error('Telegram File Upload Failed:', e.message);
        await sendTelegramReply(chatId, `⚠️ Failed to send file: ${e.message}`);
    }
};

const downloadTelegramFile = async (fileId, type) => {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const pathRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
        const pathData = await pathRes.json();
        if (!pathData.ok) throw new Error('File path fetch failed');

        const filePath = pathData.result.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

        const ext = path.extname(filePath) || '.dat';
        const localDir = path.join(__dirname, '../uploads', type === 'photo' ? 'images' : type === 'voice' ? 'audio' : 'documents');
        const localFilename = `${Date.now()}_${path.basename(filePath)}`;
        const localPath = path.join(localDir, localFilename);

        const res = await fetch(fileUrl);
        const arrayBuffer = await res.arrayBuffer();
        fs.writeFileSync(localPath, Buffer.from(arrayBuffer));

        return localPath;
    } catch (e) {
        console.error('Download Failed:', e);
        return null;
    }
};

// Monitor Bridge for Sage Inputs (Text & Media)
setInterval(async () => {
    if (!supabase) return;
    try {
        // Expand query to include sage:send_file
        const { data: messages } = await supabase
            .from('ghost_bridge')
            .select('*')
            .or('command.eq.sage:chat,command.eq.sage:process_input,command.eq.sage:send_file')
            .eq('status', 'pending');

        if (messages && messages.length > 0) {
            for (const msg of messages) {
                await supabase.from('ghost_bridge').update({ status: 'processing' }).eq('id', msg.id);

                let payload = {};
                try {
                    payload = msg.payload ? (typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload) : {};
                } catch (e) {
                    console.warn('[SENTINEL] Failed to parse message payload');
                    await supabase.from('ghost_bridge').update({ status: 'failed', output: 'INVALID_PAYLOAD' }).eq('id', msg.id);
                    continue;
                }

                // HANDLE FILE SEND REQUEST
                if (msg.command === 'sage:send_file') {
                    const { chatId, filePath, caption } = payload;
                    await sendTelegramFile(chatId, filePath, caption);
                    await supabase.from('ghost_bridge').update({ status: 'completed' }).eq('id', msg.id);
                    continue; // Skip standard processing
                }

                // HANDLE INPUT PROCESSING
                const { type, chatId, fileId, text, command: innerCommand } = payload;
                let response = '';

                // --- SYSTEM COMMANDS (sys:*) ---
                if (msg.command === 'sys:heal') {
                    console.log('[SENTINEL] External Heal Request Received');
                    const success = await purgeZombies();
                    response = success ? '[Sentinel] Shadow Purge Complete. Environment Pristine.' : '[Sentinel] Heal operation failed. Check logs.';
                } else if (type === 'text') {
                    response = `[Sage] Received: "${text}"`;
                } else if (fileId) {
                    const localPath = await downloadTelegramFile(fileId, type);
                    if (localPath) {
                        response = `[Sage] Saved ${type} to Matrix: ${path.basename(localPath)}`;
                    } else {
                        response = `[Sage] Failed to download ${type}.`;
                    }
                }

                if (response) await sendTelegramReply(chatId, response);
                await supabase.from('ghost_bridge').update({ status: 'completed', response: { text: response } }).eq('id', msg.id);
            }
        }
    } catch (e) { }
}, 2000);
