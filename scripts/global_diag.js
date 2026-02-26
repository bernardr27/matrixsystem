const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');

console.log('\x1b[36m--- GLOBAL SYSTEM DIAGNOSTICS ---\x1b[0m');

const ROOT = path.resolve(__dirname, '..');
const PROJECTS = ['nexus', 'app', 'ghost-command'];
const PORTS = {
    'nexus': 3001,
    'app': 3000,
    'ghost': 5173
};

// 1. Version Consistency Check
console.log('\n\x1b[33m[1/3] Checking Ecosystem Parity...\x1b[0m');
let parityIssue = false;

PROJECTS.forEach(proj => {
    const pkgPath = path.join(ROOT, proj, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            const nextVer = pkg.dependencies.next || pkg.devDependencies.next || 'N/A';
            const reactVer = pkg.dependencies.react || 'N/A';

            let status = '\x1b[32mOK\x1b[0m';
            if (!nextVer.includes('16') && nextVer !== 'N/A') {
                status = '\x1b[31mOLD\x1b[0m';
                parityIssue = true;
            }

            console.log(` - ${proj.padEnd(15)}: Next.js ${nextVer.padEnd(8)} | React ${reactVer.padEnd(8)} [${status}]`);
        } catch (e) {
            console.log(` - ${proj.padEnd(15)}: \x1b[31mERROR READ\x1b[0m`);
        }
    } else {
        console.log(` - ${proj.padEnd(15)}: \x1b[30mNOT FOUND\x1b[0m`);
    }
});

if (parityIssue) console.log('   \x1b[31m[WARN] Version mismatch detected! Run upgrades.\x1b[0m');

// 2. Port Conflict Check
console.log('\n\x1b[33m[2/3] Checking Network Ports...\x1b[0m');
Object.entries(PORTS).forEach(([name, port]) => {
    try {
        // PowerShell command to check port
        const cmd = `powershell -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`;
        const pid = execSync(cmd).toString().trim();

        if (pid) {
            console.log(` - Port ${port} (${name}): \x1b[32mONLINE\x1b[0m (PID: ${pid})`);
        } else {
            console.log(` - Port ${port} (${name}): \x1b[30mOFFLINE\x1b[0m`);
        }
    } catch (e) {
        console.log(` - Port ${port} (${name}): \x1b[30mOFFLINE\x1b[0m`);
    }
});

// 3. Zombie Process Check
console.log('\n\x1b[33m[3/3] Hunting Zombie Processes...\x1b[0m');
try {
    const nodeProcs = execSync('powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count"').toString().trim();
    if (parseInt(nodeProcs) > 5) {
        console.log(` - \x1b[33mWARN: High Node.js process count detected (${nodeProcs})\x1b[0m`);
        console.log('   Run "sys:kill_all" or use MASTER_CONTROL to purge.');
    } else {
        console.log(` - Node Processes: ${nodeProcs} (Normal)`);
    }
} catch (e) {
    console.log(' - No Node processes active.');
}

console.log('\n\x1b[36m--- GLOBAL DIAGNOSTICS COMPLETE ---\x1b[0m');
