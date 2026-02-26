/**
 * Phase 14: Uptime Logger
 * 
 * Periodically snapshots service health into Supabase
 * for historical dashboarding and tracking.
 */

const net = require('net');
const os = require('os');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

const LOG_INTERVAL = 15 * 60 * 1000; // Every 15 minutes

const SERVICES = [
    { name: 'reflect', port: 3000 },
    { name: 'matrix_hub', port: 3001 },
    { name: 'ghost_command', port: 5173 },
    { name: 'ollama', port: 11434 },
];

function checkPort(port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);
        socket.on('connect', () => { socket.destroy(); resolve(true); });
        socket.on('error', () => { socket.destroy(); resolve(false); });
        socket.on('timeout', () => { socket.destroy(); resolve(false); });
        socket.connect(port, '127.0.0.1');
    });
}

async function logSnapshot() {
    const timestamp = new Date().toISOString();
    const cpuLoad = os.loadavg()[0];
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const ramUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

    const serviceStatuses = {};
    for (const svc of SERVICES) {
        serviceStatuses[svc.name] = await checkPort(svc.port);
    }

    const snapshot = {
        timestamp,
        cpu_load: parseFloat(cpuLoad.toFixed(2)),
        ram_usage: ramUsage,
        ram_total_gb: parseFloat((totalMem / 1073741824).toFixed(1)),
        uptime_hours: parseFloat((os.uptime() / 3600).toFixed(1)),
        services: serviceStatuses,
        all_healthy: Object.values(serviceStatuses).every(v => v === true)
    };

    try {
        await supabase.from('uptime_log').insert(snapshot);
        console.log(`[UPTIME] Snapshot logged: ${timestamp} | RAM: ${ramUsage}% | All healthy: ${snapshot.all_healthy}`);
    } catch (err) {
        console.error('[UPTIME] Failed to log snapshot:', err.message);
    }
}

function start() {
    console.log('📊 [UPTIME_LOGGER] Service health tracking started');
    console.log(`   Interval: ${LOG_INTERVAL / 60000}min | Services: ${SERVICES.map(s => s.name).join(', ')}`);

    // First snapshot after 60s
    setTimeout(logSnapshot, 60000);

    // Then every 15 min
    setInterval(logSnapshot, LOG_INTERVAL);
}

module.exports = { start, logSnapshot };
