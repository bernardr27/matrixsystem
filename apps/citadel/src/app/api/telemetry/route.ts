import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';

function getCpuInfo() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;
    for (const cpu of cpus) {
        for (const type in cpu.times) {
            total += cpu.times[type as keyof typeof cpu.times];
        }
        idle += cpu.times.idle;
    }
    return { idle, total };
}

// Attach to global to persist across hot-reloads and API calls
if (!global.lastCpuTime) {
    global.lastCpuTime = getCpuInfo();
}

export async function GET() {
    const current = getCpuInfo();
    const last = global.lastCpuTime || current;

    const idleDiff = current.idle - last.idle;
    const totalDiff = current.total - last.total;
    let load = 0;

    if (totalDiff > 0) {
        load = 100 - (100 * idleDiff / totalDiff);
    }

    global.lastCpuTime = current;

    // Memory
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memLoad = 100 * (totalMem - freeMem) / totalMem;

    // Optional: Network data (basic interface dump)
    const netInterfaces = os.networkInterfaces();
    let isOffline = true;
    for (const name of Object.keys(netInterfaces)) {
        for (const net of netInterfaces[name]!) {
            if (!net.internal && net.family === 'IPv4') {
                isOffline = false;
                break;
            }
        }
    }

    return NextResponse.json({
        cpu: Math.round(load),
        memory: Math.round(memLoad),
        totalMemoryGB: Math.round(totalMem / (1024 ** 3) * 10) / 10,
        networkOffline: isOffline,
        uptime: os.uptime(),
        platform: os.platform(),
        timestamp: Date.now()
    });
}
