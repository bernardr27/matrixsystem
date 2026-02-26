import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = Math.round((usedMem / totalMem) * 100);

    const cpuLoad = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    return NextResponse.json({
        status: 'ok',
        service: 'citadel',
        version: '3.0.0',
        port: 3005,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        system: {
            platform: os.platform(),
            hostname: os.hostname(),
            cpuCount: cpus.length,
            cpuLoad: Math.round(cpuLoad),
            totalMemoryGB: Math.round(totalMem / (1024 ** 3) * 10) / 10,
            usedMemoryGB: Math.round(usedMem / (1024 ** 3) * 10) / 10,
            memoryPercent: memPercent,
        },
    });
}
