const fs = require('fs');
const http = require('http');

const ports = [3000, 3001, 5173, 4000];
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

console.log('--- MATRIX SYSTEM HEALTH CHECK ---');

// Check Edge
if (fs.existsSync(edgePath)) {
    console.log(`[OK] Microsoft Edge found at: ${edgePath}`);
} else {
    console.log(`[FAIL] Microsoft Edge NOT found at: ${edgePath}`);
}

// Check Ports
ports.forEach(port => {
    const req = http.request({
        hostname: 'localhost',
        port: port,
        method: 'HEAD',
        timeout: 2000
    }, (res) => {
        console.log(`[OK] Port ${port}: HTTP ${res.statusCode}`);
    });

    req.on('error', (err) => {
        console.log(`[FAIL] Port ${port}: ${err.message}`);
    });

    req.on('timeout', () => {
        console.log(`[FAIL] Port ${port}: Timeout`);
        req.destroy();
    });

    req.end();
});
