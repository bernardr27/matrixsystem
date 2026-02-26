const http = require('http');

const APPS = [
    { name: 'Reflect', port: 3000, path: '/api/health' },
    { name: 'Nexus', port: 3001, path: '/api/health' },
    { name: 'Ghost', port: 5173, path: '/' }
];

async function check(app) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${app.port}${app.path}`, { timeout: 5000 }, (res) => {
            resolve({ name: app.name, status: res.statusCode < 400 ? 'NOMINAL' : 'DEGRADED' });
        });
        req.on('error', () => resolve({ name: app.name, status: 'OFFLINE' }));
        req.on('timeout', () => { req.destroy(); resolve({ name: app.name, status: 'TIMEOUT' }); });
    });
}

async function run() {
    console.log('--- MATRIX SMOKE TEST ---');
    const results = await Promise.all(APPS.map(check));
    results.forEach(r => {
        const color = r.status === 'NOMINAL' ? '\x1b[32m' : '\x1b[31m';
        console.log(`${r.name}: ${color}${r.status}\x1b[0m`);
    });

    if (results.every(r => r.status === 'NOMINAL')) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

run();
