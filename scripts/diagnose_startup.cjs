const fs = require('fs');
const path = require('path');
const net = require('net');

async function checkPort(port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.on('error', () => {
            resolve(false);
        });
        socket.connect(port, '127.0.0.1');
    });
}

async function main() {
    console.log('--- DIAGNOSTICS START ---');

    // 1. Check triage.config.json
    const configPath = path.join(__dirname, '..', 'triage.config.json');
    console.log(`Checking config at: ${configPath}`);
    if (fs.existsSync(configPath)) {
        try {
            const raw = fs.readFileSync(configPath, 'utf8');
            JSON.parse(raw);
            console.log('✅ triage.config.json is VALID');
        } catch (e) {
            console.error('❌ triage.config.json INVALID:', e.message);
        }
    } else {
        console.error('❌ triage.config.json NOT FOUND');
    }

    // 2. Check Ports
    const ports = [3000, 3001, 5173];
    for (const p of ports) {
        const open = await checkPort(p);
        console.log(`Port ${p}: ${open ? '✅ LISTENING' : '❌ CLOSED'}`);
    }

    console.log('--- DIAGNOSTICS END ---');
}

main();
