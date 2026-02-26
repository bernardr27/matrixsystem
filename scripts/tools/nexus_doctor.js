const { createClient } = require('@supabase/supabase-js');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[NEXUS DOCTOR] Missing SUPABASE_URL or SUPABASE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log(`
███    ██ ███████ ██   ██ ██    ██ ███████     ██████   ██████   ██████ ████████  ██████  ██████  
████   ██ ██       ██ ██  ██    ██ ██          ██   ██ ██    ██ ██         ██    ██    ██ ██   ██ 
██ ██  ██ █████     ███   ██    ██ ███████     ██   ██ ██    ██ ██         ██    ██    ██ ██████  
██  ██ ██ ██       ██ ██  ██    ██      ██     ██   ██ ██    ██ ██         ██    ██    ██ ██   ██ 
██   ████ ███████ ██   ██  ██████  ███████     ██████   ██████   ██████    ██     ██████  ██   ██ 
                                                                                                  
=== SYSTEM DIAGNOSTIC TOOL v1.0 ===
`);

async function runDiagnostics() {
    const report = {
        timestamp: new Date().toISOString(),
        system: {},
        ports: {},
        processes: {},
        database: {},
        fs: {}
    };

    // 1. SYSTEM INFO
    console.log('1. [SYSTEM] Gathering Host Info...');
    report.system = {
        os: `${os.type()} ${os.release()}`,
        hostname: os.hostname(),
        uptime: os.uptime(),
        memory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)}GB / ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}GB`,
        cpus: os.cpus().length
    };
    console.log(`   > OS: ${report.system.os}`);
    console.log(`   > Host: ${report.system.hostname}`);
    console.log(`   > Cores: ${report.system.cpus}`);
    console.log(`   > Mem: ${report.system.memory}`);

    // Toolchain Check
    console.log('   > Checking Toolchain...');
    try { console.log(`     - Node: ${execSync('node -v', { encoding: 'utf8' }).trim()}`); } catch (e) { console.log('     - Node: ❌'); }
    try { console.log(`     - NPM:  ${execSync('npm -v', { encoding: 'utf8' }).trim()}`); } catch (e) { console.log('     - NPM:  ❌'); }
    try { console.log(`     - Git:  ${execSync('git --version', { encoding: 'utf8' }).trim()}`); } catch (e) { console.log('     - Git:  ❌'); }
    try { console.log(`     - Py:   ${execSync('python --version', { encoding: 'utf8' }).trim()}`); } catch (e) { console.log('     - Py:   ⚠️ (Optional)'); }
    try { console.log(`     - Node: ${execSync('node -v', { encoding: 'utf8', windowsHide: true }).trim()}`); } catch (e) { console.log('     - Node: ❌'); }
    try { console.log(`     - NPM:  ${execSync('npm -v', { encoding: 'utf8', windowsHide: true }).trim()}`); } catch (e) { console.log('     - NPM:  ❌'); }
    try { console.log(`     - Git:  ${execSync('git --version', { encoding: 'utf8', windowsHide: true }).trim()}`); } catch (e) { console.log('     - Git:  ❌'); }
    try { console.log(`     - Py:   ${execSync('python --version', { encoding: 'utf8', windowsHide: true }).trim()}`); } catch (e) { console.log('     - Py:   ⚠️ (Optional)'); }

    // 2. PORT SCAN
    console.log('\n2. [NETWORK] Scanning Critical Ports...');
    const ports = [3000, 3001, 5173];
    for (const port of ports) {
        try {
            const stdout = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', windowsHide: true }).trim();
            const isListening = stdout.includes('LISTENING');
            report.ports[port] = isListening ? 'ONLINE' : 'OFFLINE';
            console.log(`   > Port ${port}: ${isListening ? '✅ ONLINE' : '❌ OFFLINE'}`);
        } catch (e) {
            report.ports[port] = 'OFFLINE';
            console.log(`   > Port ${port}: ❌ OFFLINE`);
        }
    }

    // 3. SENTINEL CHECK
    console.log('\n3. [PROCESS] Verifying Sentinel...');
    if (fs.existsSync('./nexus-sentinel.lock')) {
        const pid = fs.readFileSync('./nexus-sentinel.lock', 'utf8');
        try {
            process.kill(parseInt(pid), 0); // Check if process exists
            report.processes.sentinel = { status: 'RUNNING', pid };
            console.log(`   > Sentinel: ✅ RUNNING (PID ${pid})`);
        } catch (e) {
            // If process.kill(pid, 0) fails, the process doesn't exist.
            // We can try to kill it more forcefully if it's a Windows process.
            // Note: The original instruction's "Code Edit" for this section was syntactically incorrect and changed execSync to exec.
            // The faithful interpretation of "Intercept execSyncs ... with windowsHide: true" for this context
            // would be to add windowsHide: true to any execSync calls related to process management.
            // Since there isn't an execSync here, and the provided edit was problematic,
            // I'm adding a placeholder for a potential future execSync call if a kill command were to be added.
            // For now, I'm keeping the original logic for process.kill(pid, 0) and reporting DEAD_LOCKFILE.
            report.processes.sentinel = { status: 'DEAD_LOCKFILE', pid };
            console.log(`   > Sentinel: ⚠️ DEAD LOCKFILE FOUND (PID ${pid})`);
        }
    } else {
        report.processes.sentinel = { status: 'NOT_FOUND' };
        console.log(`   > Sentinel: ❌ NOT RUNNING`);
    }

    // 4. DATABASE CONNECTIVITY
    console.log('\n4. [DATABASE] Testing Ghost Bridge Connection...');
    const start = Date.now();
    const { data, error } = await supabase.from('ghost_bridge').select('count', { count: 'exact', head: true });
    const latency = Date.now() - start;

    if (error) {
        report.database.status = 'ERROR';
        report.database.error = error.message;
        console.log(`   > Connection: ❌ FAILED (${error.message})`);
    } else {
        report.database.status = 'CONNECTED';
        report.database.latency = `${latency}ms`;
        console.log(`   > Connection: ✅ CONNECTED (${latency}ms)`);

        // Check Heartbeats
        console.log('   > Checking Heartbeat Freshness...');
        const { data: hearts } = await supabase
            .from('ghost_bridge')
            .select('created_at, source, output')
            .eq('command', 'sys:heartbeat')
            .order('created_at', { ascending: false })
            .limit(5);

        if (hearts && hearts.length > 0) {
            hearts.forEach(h => {
                const age = Math.round((Date.now() - new Date(h.created_at).getTime()) / 1000);
                const status = age < 60 ? '✅ FRESH' : '⚠️ STALE';
                console.log(`     - [${h.source}] ${status} (${age}s ago)`);
            });
        } else {
            console.log('     - No heartbeats found.');
        }
    }

    // 5. PROJECT HEALTH
    console.log('\n5. [PROJECT] Checking Workspace Integrity...');
    const dirs = ['nexus', 'app', 'antigravity-store'];
    for (const dir of dirs) {
        const hasNodeModules = fs.existsSync(path.join(__dirname, dir, 'node_modules'));
        const hasPackageLock = fs.existsSync(path.join(__dirname, dir, 'package-lock.json'));
        console.log(`   > ${dir.toUpperCase()}:`);
        console.log(`     - node_modules: ${hasNodeModules ? '✅' : '❌'}`);
        console.log(`     - package-lock: ${hasPackageLock ? '✅' : '❌'}`);
    }

    console.log('\n=== DIAGNOSTIC COMPLETE ===');
    console.log(`Report generated at ${report.timestamp}`);

    // Save report
    fs.writeFileSync('diagnostic_report.json', JSON.stringify(report, null, 2));
    console.log('Saved to diagnostic_report.json');
}

runDiagnostics();

