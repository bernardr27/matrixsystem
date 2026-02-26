const net = require('net');

function checkPort(port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1000);
        socket.once('connect', () => {
            socket.destroy();
            resolve('ONLINE');
        });
        socket.once('timeout', () => {
            socket.destroy();
            resolve('OFFLINE');
        });
        socket.once('error', () => {
            socket.destroy();
            resolve('OFFLINE');
        });
        socket.connect(port, '127.0.0.1');
    });
}

async function runPulse() {
    console.log('[ISO-PULSE] Running native port check...');
    const ports = [3000, 3001, 5173];
    for (const port of ports) {
        const status = await checkPort(port);
        console.log(`Port ${port}: ${status}`);
    }
    console.log('[ISO-PULSE] Complete.');
}

runPulse();
