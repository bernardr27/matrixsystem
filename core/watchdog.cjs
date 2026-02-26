/**
 * MATRIX WATCHDOG v1.0
 * ═══════════════════
 * Starts all Matrix dev servers, monitors their health,
 * and auto-restarts any that crash or become unresponsive.
 * 
 * Usage:
 *   node core/watchdog.cjs              # Start all servers
 *   node core/watchdog.cjs --no-watch   # Start only, no monitoring
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ── CONFIG ──────────────────────────────────────────────
const ROOT = path.join(__dirname, '..');
const APPS = [
    { name: 'Reflect', dir: path.join(ROOT, 'apps', 'reflect'), port: 3000, color: '\x1b[36m' },
    { name: 'Nexus', dir: path.join(ROOT, 'apps', 'nexus'), port: 3001, color: '\x1b[35m' },
    { name: 'Ghost Command', dir: path.join(ROOT, 'apps', 'ghost-command'), port: 5173, color: '\x1b[32m' },
    { name: 'RocketCommand Pro', dir: path.join(ROOT, 'apps', 'rocket-command'), port: 4000, color: '\x1b[31m' },
    {
        name: 'Runner',
        dir: path.join(ROOT, 'apps', 'ghost-command', 'core'),
        command: 'node',
        args: ['ghost-runner.cjs'],
        color: '\x1b[33m',
        noPort: true
    }
];

const HEALTH_CHECK_INTERVAL = 15000;  // 15 seconds
const STARTUP_GRACE_PERIOD = 60000;  // 60 seconds before first health check
const MAX_RESTART_ATTEMPTS = 3;
const RESTART_BACKOFF_MS = 5000;
const NO_WATCH = process.argv.includes('--no-watch');

const LOG_FILE = path.join(ROOT, 'logs', 'watchdog.log');

// ── HELPERS ─────────────────────────────────────────────
const timestamp = () => new Date().toISOString().slice(11, 19);
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';

function log(msg, color = '') {
    const line = `${DIM}[${timestamp()}]${RESET} ${color}${msg}${RESET}`;
    console.log(line);
    try {
        fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
        fs.appendFileSync(LOG_FILE, `[${timestamp()}] ${msg}\n`);
    } catch (e) { /* ignore log write failures */ }
}

function banner() {
    console.log(`
${CYAN}${BOLD}  ╔══════════════════════════════════════════╗
  ║      MATRIX WATCHDOG  v1.0               ║
  ║      Autonomous Server Guardian          ║
  ╚══════════════════════════════════════════╝${RESET}
`);
}

// ── PHASE 1: CLEAN STALE LOCKS ──────────────────────────
function clearStaleLocks() {
    log('Phase 1: Clearing stale lock files...', YELLOW);
    let cleaned = 0;

    for (const app of APPS) {
        const lockFile = path.join(app.dir, '.next', 'dev', 'lock');
        if (fs.existsSync(lockFile)) {
            try {
                fs.unlinkSync(lockFile);
                log(`  Removed stale lock: ${app.name}`, GREEN);
                cleaned++;
            } catch (e) {
                log(`  Could not remove lock for ${app.name}: ${e.message}`, RED);
            }
        }
    }

    if (cleaned === 0) {
        log('  No stale locks found.', DIM);
    }
}

// ── PHASE 2: START SERVERS ──────────────────────────────
const processes = new Map();
const restartCounts = new Map();

function startServer(app) {
    return new Promise((resolve) => {
        log(`Starting ${app.name} on port ${app.port}...`, app.color);

        const cmd = app.command || 'npm';
        const args = app.args || ['run', 'dev', '--', '-p', String(app.port)];

        const child = spawn(cmd, args, {
            cwd: app.dir,
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env, FORCE_COLOR: '1' },
        });

        let started = false;

        const onData = (data) => {
            const line = data.toString().trim();
            if (!line) return;

            // Detect successful startup
            if (line.includes('Ready in') || line.includes('✓ Ready')) {
                if (!started) {
                    started = true;
                    log(`  ${app.name} ONLINE ✓ (port ${app.port})`, GREEN);
                    restartCounts.set(app.name, 0); // Reset restart counter on success
                    resolve(true);
                }
            }
        };

        child.stdout.on('data', onData);
        child.stderr.on('data', onData);

        child.on('exit', (code, signal) => {
            log(`${app.name} exited (code: ${code}, signal: ${signal})`, RED);
            processes.delete(app.name);

            if (!NO_WATCH && !shuttingDown) {
                scheduleRestart(app);
            }

            if (!started) resolve(false);
        });

        child.on('error', (err) => {
            log(`${app.name} spawn error: ${err.message}`, RED);
            if (!started) resolve(false);
        });

        processes.set(app.name, { child, app, startedAt: Date.now() });

        // Timeout: resolve anyway after grace period
        setTimeout(() => {
            if (!started) {
                if (app.noPort) {
                    // For non-port services (like Runner), assume it's running if process exists
                    log(`  ${app.name} assumed ONLINE (background process)`, GREEN);
                    started = true;
                    resolve(true);
                } else {
                    log(`  ${app.name} startup timeout — may still be compiling...`, YELLOW);
                    resolve(true); // Don't block other servers
                }
            }
        }, STARTUP_GRACE_PERIOD);
    });
}

// ── PHASE 3: HEALTH CHECK ───────────────────────────────
function healthCheck(app) {
    return new Promise((resolve) => {
        if (app.noPort) {
            // Check if process is still running in our map
            const proc = processes.get(app.name);
            const isRunning = proc && proc.child && proc.child.exitCode === null;
            resolve({ app: app.name, status: isRunning ? 200 : 0, ok: isRunning });
            return;
        }

        const req = http.get(`http://localhost:${app.port}`, { timeout: 5000 }, (res) => {
            resolve({ app: app.name, status: res.statusCode, ok: res.statusCode < 500 });
        });
        req.on('error', () => resolve({ app: app.name, status: 0, ok: false }));
        req.on('timeout', () => { req.destroy(); resolve({ app: app.name, status: 0, ok: false }); });
    });
}

async function runHealthChecks() {
    const results = await Promise.all(APPS.map(healthCheck));
    const allOk = results.every(r => r.ok);

    if (allOk) {
        // Silent when all healthy — only log every 5 minutes
        return;
    }

    for (const result of results) {
        if (!result.ok) {
            log(`HEALTH FAIL: ${result.app} (status: ${result.status})`, RED);

            const app = APPS.find(a => a.name === result.app);
            const proc = processes.get(result.app);

            if (app && !proc) {
                // Process is dead, restart it
                scheduleRestart(app);
            }
        }
    }
}

// ── AUTO-RESTART ────────────────────────────────────────
let shuttingDown = false;

function scheduleRestart(app) {
    const count = (restartCounts.get(app.name) || 0) + 1;
    restartCounts.set(app.name, count);

    if (count > MAX_RESTART_ATTEMPTS) {
        log(`${app.name} exceeded max restarts (${MAX_RESTART_ATTEMPTS}). Manual intervention required.`, RED);
        return;
    }

    const delay = RESTART_BACKOFF_MS * count;
    log(`Scheduling restart for ${app.name} in ${delay / 1000}s (attempt ${count}/${MAX_RESTART_ATTEMPTS})...`, YELLOW);

    setTimeout(async () => {
        if (shuttingDown) return;

        // Clear lock before restart
        const lockFile = path.join(app.dir, '.next', 'dev', 'lock');
        try { fs.unlinkSync(lockFile); } catch (e) { /* no lock to clear */ }

        await startServer(app);
    }, delay);
}

// ── GRACEFUL SHUTDOWN ───────────────────────────────────
function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;

    log('Shutting down all servers...', YELLOW);

    for (const [name, { child }] of processes) {
        log(`  Stopping ${name}...`, DIM);
        try {
            // On Windows, use taskkill for the process tree
            spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { shell: true, stdio: 'ignore' });
        } catch (e) {
            child.kill('SIGTERM');
        }
    }

    setTimeout(() => {
        log('All servers stopped. Watchdog exiting.', GREEN);
        process.exit(0);
    }, 2000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);

// ── MAIN ────────────────────────────────────────────────
async function main() {
    banner();

    clearStaleLocks();

    log('Phase 2: Starting all servers...', CYAN);

    // Start all servers in parallel
    const results = await Promise.all(APPS.map(startServer));

    const online = results.filter(Boolean).length;
    console.log('');
    log(`═══════════════════════════════════════`, CYAN);
    log(`  ${online}/${APPS.length} servers started`, online === APPS.length ? GREEN : YELLOW);
    log(``, '');
    log(`  Reflect          http://localhost:3000`, CYAN);
    log(`  Nexus            http://localhost:3001`, CYAN);
    log(`  Ghost Command    http://localhost:5173`, CYAN);
    log(`  RocketCommand    http://localhost:4000`, CYAN);
    log(`═══════════════════════════════════════`, CYAN);
    console.log('');

    if (NO_WATCH) {
        log('Watchdog monitoring disabled (--no-watch). Servers running unmonitored.', YELLOW);
        return;
    }

    // Phase 3: Start health monitoring
    log('Phase 3: Watchdog monitoring active. Press Ctrl+C to stop all.', GREEN);

    // Initial grace period before first check
    setTimeout(() => {
        // Run health checks on interval
        setInterval(runHealthChecks, HEALTH_CHECK_INTERVAL);
    }, STARTUP_GRACE_PERIOD);
}

main().catch((err) => {
    log(`Fatal error: ${err.message}`, RED);
    process.exit(1);
});
