const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

// ANSI Colors
const C = {
    r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', b: '\x1b[34m', m: '\x1b[35m', c: '\x1b[36m', w: '\x1b[37m',
    acc: '\x1b[35m', // Accent (Magenta/Purple for Reflect)
    rst: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m'
};

const LOG_FILE = path.join(__dirname, '..', 'reflect_triage.log');

function log(msg, type = 'INFO') {
    const ts = new Date().toISOString().substring(11, 19);
    const line = `[${ts}] [${type}] ${msg}`;
    console.log(processColors(line));
    fs.appendFileSync(LOG_FILE, line.replace(/\x1b\[\d+m/g, '') + '\n');
}

function processColors(str) {
    return str
        .replace(/\[INFO\]/g, `${C.b}[INFO]${C.rst}`)
        .replace(/\[WARN\]/g, `${C.y}[WARN]${C.rst}`)
        .replace(/\[ERROR\]/g, `${C.r}[ERROR]${C.rst}`)
        .replace(/\[SUCCESS\]/g, `${C.g}[SUCCESS]${C.rst}`);
}

function header() {
    console.clear();
    console.log(`${C.acc}${C.bold}
    Testing Neural Link...
    REFLECT OS — SYSTEM TRIAGE
    ${C.dim}----------------------------------------${C.rst}
    `);
}

function checkNode() {
    try {
        const v = execSync('node -v').toString().trim();
        log(`Node runtime: ${v}`, 'INFO');
        return true;
    } catch (e) {
        log('Node.js not found in PATH.', 'ERROR');
        return false;
    }
}

function checkEnv() {
    const basePath = path.join(__dirname, '..', 'apps', 'reflect');
    const files = ['.env.local', '.env', '.env.development.local'];
    let found = false;

    for (const f of files) {
        const p = path.join(basePath, f);
        if (fs.existsSync(p)) {
            log(`Config found: ${f}`, 'SUCCESS');
            const content = fs.readFileSync(p, 'utf8');
            if (content.includes('NEXT_PUBLIC_SUPABASE_URL') && content.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
                log(`Auth keys detected in ${f}`, 'SUCCESS');
            }
            found = true;
        }
    }

    if (!found) {
        log('No environment variables found!', 'ERROR');
    }
}

function checkDatabase() {
    log('Pinging Supabase...', 'INFO');
    // Simple HTTPS get to the project URL if we can find it, otherwise skip
    // Real DB check requires pg driver, keeping this script lightweight (node only)
    try {
        const envPath = path.join(__dirname, '..', 'apps', 'reflect', '.env.local');
        if (!fs.existsSync(envPath)) return;

        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
        if (match && match[1]) {
            const url = match[1].trim();
            https.get(url, (res) => {
                log(`Supabase reachable (Status: ${res.statusCode})`, 'SUCCESS');
            }).on('error', (e) => {
                log(`Supabase unreachable: ${e.message}`, 'ERROR');
            });
        }
    } catch (e) {
        log('Skipping DB connectivity check.', 'WARN');
    }
}

function checkProcesses() {
    try {
        const cmd = process.platform === 'win32'
            ? 'tasklist /FI "IMAGENAME eq node.exe"'
            : 'ps aux | grep node';

        const output = execSync(cmd).toString();
        const count = (output.match(/node/g) || []).length;

        if (count > 0) {
            log(`${count} Node process(es) active.`, 'INFO');
            if (count > 5) {
                log('High number of Node processes detected. Consider "kill_zombies".', 'WARN');
            }
        } else {
            log('No active Node processes found.', 'INFO');
        }
    } catch (e) {
        log('Could not list processes.', 'WARN');
    }
}

function cleanCache() {
    log('Cleaning Next.js cache...', 'INFO');
    const cachePath = path.join(__dirname, '..', 'apps', 'reflect', '.next');
    if (fs.existsSync(cachePath)) {
        try {
            fs.rmSync(cachePath, { recursive: true, force: true });
            log('Cache cleared (.next directory removed).', 'SUCCESS');
        } catch (e) {
            log(`Failed to clear cache: ${e.message}`, 'ERROR');
        }
    } else {
        log('No cache found to clear.', 'INFO');
    }
}

// Check arguments
const args = process.argv.slice(2);
header();

if (args.includes('--clean')) {
    cleanCache();
}

checkNode();
checkEnv();
checkProcesses();
checkDatabase();

console.log(`\n${C.dim}Log saved to: ${LOG_FILE}${C.rst}`);
console.log(`${C.acc}Triage Complete.${C.rst}\n`);
