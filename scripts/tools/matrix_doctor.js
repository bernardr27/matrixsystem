const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');

const results = {
    timestamp: new Date().toISOString(),
    environment: {},
    projects: [],
    ports: [],
    status: 'nominal'
};

// Helper for logging
const log = (type, msg) => {
    if (jsonMode) return;
    if (type === 'pass') console.log(`\x1b[32m[PASS]\x1b[0m ${msg}`);
    if (type === 'fail') console.log(`\x1b[31m[FAIL]\x1b[0m ${msg}`);
    if (type === 'warn') console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`);
    if (type === 'info') console.log(`\x1b[36m${msg}\x1b[0m`);
};

if (!jsonMode) log('info', '[MATRIX DOCTOR] System Diagnostic Tool initiated...');

// 1. Environment Checks
const runDiagnostics = async () => {
    try {
        const nodeVer = process.version;
        log('pass', `Node.js Version: ${nodeVer}`);
        results.environment.node = nodeVer;
    } catch (e) {
        log('fail', "Could not detect Node.js version");
        results.environment.node = 'unknown';
        results.status = 'critical';
    }

    // 2. Project Existence Checks
    const rootDir = path.join(__dirname, '..', '..');
    const projects = ['nexus', 'reflect', 'ghost-command'];
    projects.forEach(p => {
        const pPath = path.join(rootDir, 'apps', p);
        if (fs.existsSync(pPath)) {
            if (fs.existsSync(path.join(pPath, 'package.json'))) {
                log('pass', `Project Found: ${p} (package.json present)`);
                results.projects.push({ name: p, status: 'found' });
            } else {
                log('fail', `Project Found: ${p} (MISSING package.json)`);
                results.projects.push({ name: p, status: 'missing_package_json' });
                results.status = 'partial';
            }
        } else {
            log('warn', `Project Missing: ${p}`);
            results.projects.push({ name: p, status: 'missing' });
            results.status = 'partial';
        }
    });

    // 3. Port Availability Check
    const checkPort = (port) => {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(false);
                } else {
                    resolve(false); // Other error
                }
            });
            server.once('listening', () => {
                server.close();
                resolve(true);
            });
            server.listen(port);
        });
    };

    const ports = [3000, 3001, 5173];
    if (!jsonMode) console.log('\nScanning Ports...');

    for (const port of ports) {
        // Attempt to kill processes using the port on Windows
        if (process.platform === 'win32') {
            try {
                execSync(`powershell -WindowStyle Hidden -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`, { windowsHide: true, stdio: 'ignore' });
            } catch (error) {
                // Log but don't fail if killing process fails
                log('warn', `Failed to kill process on port ${port}: ${error.message}`);
            }
        }

        const isFree = await checkPort(port);
        results.ports.push({ port, status: isFree ? 'free' : 'in_use' });

        if (isFree) {
            log('pass', `Port ${port} is available.`);
        } else {
            log('warn', `Port ${port} is IN USE.`);
        }
    }

    if (jsonMode) {
        console.log(JSON.stringify(results));
    } else {
        log('info', '\n[MATRIX DOCTOR] Diagnosis Complete.');
    }
};

// Main Execution Flow
if (args.includes('--audit')) {
    console.log('\x1b[36m[MATRIX DOCTOR] Initiating Audit Sequence...\x1b[0m');
    const auditScript = path.join(__dirname, 'matrix_audit.js');
    if (fs.existsSync(auditScript)) {
        try {
            execSync(`node "${auditScript}"`, { stdio: 'inherit' });
            console.log('\x1b[32m[MATRIX DOCTOR] Audit Sequence Completed.\x1b[0m');
        } catch (error) {
            console.error('[FAIL] Audit execution failed.');
            process.exit(1);
        }
    } else {
        console.error('[FAIL] matrix_audit.js not found.');
        process.exit(1);
    }
} else {
    runDiagnostics().then(() => {
        process.exit(results.status === 'critical' ? 1 : 0);
    }).catch((err) => {
        console.error('[FAIL] Diagnostics crashed:', err.message);
        process.exit(1);
    });
}

