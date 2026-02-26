/**
 * CITADEL GUARDIAN v3.0
 * ═════════════════════
 * Immortal watchdog that keeps Citadel + Tailscale Funnel
 * alive 24/7. Auto-restarts on crash, writes tunnel URL,
 * and ensures Citadel is always reachable from anywhere.
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ── CONFIG ──────────────────────────────────────────────
const ROOT = path.join(__dirname, '..', '..');
const CITADEL_DIR = __dirname;
const NEXT_BIN = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
const PORT = 3005;
const TAILSCALE_PATH = 'C:\\Program Files\\Tailscale\\tailscale.exe';
const TUNNEL_URL_FILE = path.join(CITADEL_DIR, '.tunnel-url');
const LOG_FILE = path.join(ROOT, 'logs', 'guardian.log');
const HEALTH_CHECK_INTERVAL = 15000;     // 15 seconds
const STARTUP_GRACE = 60000;             // 60s before first health check
const MAX_RESTART_ATTEMPTS = 15;
const RESTART_COOLDOWN = 5000;           // 5s between restarts
const TUNNEL_RESTART_DELAY = 5000;       // Wait before restarting tunnel
const NO_TUNNEL = process.argv.includes('--no-tunnel');

// ── NTFY PUSH NOTIFICATIONS ─────────────────────────────
const NTFY_TOPIC = process.env.NTFY_TOPIC || 'matrix-citadel-d327b3ca';
const NTFY_ENABLED = !process.argv.includes('--no-ntfy');

function sendNotification(title, message, url) {
    if (!NTFY_ENABLED) return;
    const data = JSON.stringify({
        topic: NTFY_TOPIC,
        title: title,
        message: message,
        priority: 4,
        tags: ['shield', 'link'],
        click: url || undefined,
        actions: url ? [{ action: 'view', label: 'Open Citadel', url }] : undefined,
    });
    const req = https.request({
        hostname: 'ntfy.sh',
        path: '/',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
        res.resume();
        if (res.statusCode === 200) {
            log('  Push notification sent ✓', GREEN);
        } else {
            log(`  Push notification failed (${res.statusCode})`, YELLOW);
        }
    });
    req.on('error', (err) => {
        // Silently ignore DNS resolution errors (e.g. when blocked by T-Mobile or missing Pi-hole config)
        if (err.code !== 'ENOTFOUND') {
            log('  Push notification error: ' + err.message, DIM);
        }
    });
    req.write(data);
    req.end();
}

// ── STATE ───────────────────────────────────────────────
let citadelProcess = null;
let tunnelProcess = null;
let citadelRestarts = 0;
let tunnelRestarts = 0;
let tunnelUrl = null;
let shuttingDown = false;

// ── HELPERS ─────────────────────────────────────────────
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GOLD = '\x1b[33m';
const MAGENTA = '\x1b[35m';

const ts = () => new Date().toISOString().slice(11, 19);
const tsLong = () => new Date().toISOString();

function log(msg, color = '') {
    const line = `${DIM}[${ts()}]${RESET} ${color}${msg}${RESET}`;
    console.log(line);
    try {
        fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
        fs.appendFileSync(LOG_FILE, `[${tsLong()}] ${msg}\n`);
    } catch { }
}

function banner() {
    console.log(`
${GOLD}${BOLD}  ╔══════════════════════════════════════════════════╗
  ║   ⛊  CITADEL GUARDIAN  v3.0                      ║
  ║   Tailscale Funnel · Stable URL · Always Reachable ║
  ╚══════════════════════════════════════════════════╝${RESET}
`);
}

// ── KILL STALE PROCESSES ON PORT ────────────────────────
function killPort(port) {
    try {
        execSync(
            `powershell -NoProfile -WindowStyle Hidden -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
            { timeout: 8000, stdio: 'ignore', windowsHide: true }
        );
    } catch { }
}

// ── PORT CHECK ──────────────────────────────────────────
function checkPort(port) {
    return new Promise((resolve) => {
        const req = http.get(`http://127.0.0.1:${port}/`, { timeout: 5000 }, (res) => {
            resolve(true);
            res.resume();
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
    });
}

// ── START CITADEL SERVER ────────────────────────────────
function startCitadel() {
    if (shuttingDown) return;

    log('Starting Citadel server on port ' + PORT + '...', CYAN);

    // Kill anything on our port first
    killPort(PORT);

    const IS_PROD = process.env.MATRIX_MODE === 'production';
    const nextCommand = IS_PROD ? 'start' : 'dev';

    citadelProcess = spawn('node', [NEXT_BIN, nextCommand, '-p', String(PORT), '-H', '0.0.0.0'], {
        cwd: CITADEL_DIR,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
        env: { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --max-old-space-size=4096`.trim() }
    });

    citadelProcess.stdout.on('data', (data) => {
        const line = data.toString().trim();
        if (line) log(`  [citadel] ${line}`, DIM);
    });

    citadelProcess.stderr.on('data', (data) => {
        const line = data.toString().trim();
        if (line && !line.includes('ExperimentalWarning')) {
            log(`  [citadel:err] ${line}`, RED);
        }
    });

    citadelProcess.on('exit', (code, signal) => {
        if (shuttingDown) return;
        citadelRestarts++;
        log(`Citadel exited (code=${code}, signal=${signal}). Restarts: ${citadelRestarts}/${MAX_RESTART_ATTEMPTS}`, RED);

        if (citadelRestarts <= MAX_RESTART_ATTEMPTS) {
            setTimeout(() => startCitadel(), RESTART_COOLDOWN);
        } else {
            log('MAX RESTARTS REACHED — Citadel guardian giving up', RED + BOLD);
        }
    });

    citadelProcess.on('error', (err) => {
        log(`Citadel spawn error: ${err.message}`, RED);
    });

    log('Citadel process spawned (PID: ' + citadelProcess.pid + ')', GREEN);
}

// ── GET TAILSCALE DNS NAME ───────────────────────────────
function getTailscaleDnsName() {
    try {
        const output = execSync(`"${TAILSCALE_PATH}" status --json`, { timeout: 10000 }).toString();
        const status = JSON.parse(output);
        const dnsName = status.Self?.DNSName;
        if (dnsName) {
            return 'https://' + dnsName.replace(/\.$/, '');
        }
    } catch (err) {
        log('Failed to get Tailscale DNS name: ' + err.message, RED);
    }
    return null;
}

// ── START TAILSCALE FUNNEL ──────────────────────────────
const KNOWN_TS_DNS = 'desktop-7g2nqou.tail9ce266.ts.net'; // stable machine name

function startTunnel() {
    if (shuttingDown || NO_TUNNEL) return;
    if (!fs.existsSync(TAILSCALE_PATH)) {
        log('Tailscale not found at: ' + TAILSCALE_PATH, RED);
        return;
    }

    // Use live DNS name, fall back to known constant so URL is always recorded
    const resolved = getTailscaleDnsName();
    tunnelUrl = resolved || `https://${KNOWN_TS_DNS}`;
    log(`Starting Tailscale Funnel → localhost:${PORT}...`, MAGENTA);
    log(`Stable URL: ${tunnelUrl}`, MAGENTA + BOLD);

    // `funnel` = public internet exposure; `serve` = tailnet-only fallback
    let ok = false;
    try {
        execSync(`"${TAILSCALE_PATH}" funnel --bg ${PORT}`, { timeout: 12000, stdio: 'ignore', windowsHide: true });
        log(`Funnel (public internet) configured successfully.`, GREEN);
        ok = true;
    } catch (err) {
        log(`Funnel note: ${err.message.slice(0, 100)}`, YELLOW);
    }
    if (!ok) {
        try {
            execSync(`"${TAILSCALE_PATH}" serve --bg ${PORT}`, { timeout: 12000, stdio: 'ignore', windowsHide: true });
            log(`Serve (tailnet-only) configured.`, GREEN);
        } catch (err2) {
            log(`Serve note: ${err2.message.slice(0, 100)}`, YELLOW);
        }
    }

    try {
        fs.writeFileSync(TUNNEL_URL_FILE, JSON.stringify({
            url: tunnelUrl,
            startedAt: new Date().toISOString(),
            port: PORT,
            provider: 'tailscale',
        }, null, 2));
        log('  Funnel URL written to .tunnel-url', GREEN);
    } catch (err) { }

    sendNotification(
        '⛊ Citadel Online',
        `Your Citadel is live at:\n${tunnelUrl}`,
        tunnelUrl
    );

    log('Funnel configured and URL updated', GREEN);
}

// ── HEALTH MONITOR ──────────────────────────────────────
const GRACE_PERIOD = 60000;
let startupTime = Date.now();

async function healthCheck() {
    if (shuttingDown) return;
    if (Date.now() - startupTime < GRACE_PERIOD) return;

    const alive = await checkPort(PORT);
    if (!alive && citadelProcess && !citadelProcess.killed) {
        log('Health check FAILED — Citadel not responding. Restarting...', RED);
        try { citadelProcess.kill('SIGTERM'); } catch { }
        startupTime = Date.now();
    }
}

// ── GRACEFUL SHUTDOWN ───────────────────────────────────
function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    log(`\nGuardian shutting down (${signal})...`, YELLOW);
    try { fs.unlinkSync(TUNNEL_URL_FILE); } catch { }
    try {
        execSync(`"${TAILSCALE_PATH}" funnel --bg=false reset 2>nul`, { timeout: 5000, stdio: 'ignore', windowsHide: true });
    } catch { }
    if (citadelProcess && !citadelProcess.killed) {
        try { citadelProcess.kill('SIGTERM'); } catch { }
    }
    setTimeout(() => {
        log('Guardian terminated.', DIM);
        process.exit(0);
    }, 2000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGHUP', () => shutdown('SIGHUP'));
process.on('uncaughtException', (err) => log('Uncaught exception: ' + err.message, RED));
process.on('unhandledRejection', (err) => log('Unhandled rejection: ' + err, RED));

// ── MAIN ────────────────────────────────────────────────
(async function main() {
    banner();
    log('Guardian PID: ' + process.pid, DIM);
    log('───────────────────────────────────────', DIM);
    startCitadel();
    log('Waiting for Citadel to be ready...', CYAN);
    let ready = false;
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 1000));
        if (await checkPort(PORT)) {
            ready = true;
            break;
        }
    }
    if (ready) {
        log('Citadel is ONLINE ✓', GREEN + BOLD);
        citadelRestarts = 0;
        if (!NO_TUNNEL) startTunnel();
    } else {
        log('Citadel failed to start within 30s', RED);
    }
    setInterval(healthCheck, HEALTH_CHECK_INTERVAL);
})();
