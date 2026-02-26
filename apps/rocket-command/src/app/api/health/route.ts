import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = Math.round((usedMem / totalMem) * 100);

    // Aggregate CPU load
    const cpuLoad = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    // Ping sibling services
    const services: Record<string, string> = {};
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const endpoints = [
        { key: 'ghost', url: `http://${host}:5173/api/health` },
        { key: 'reflect', url: `http://${host}:3000/api/health` },
        { key: 'nexus', url: `http://${host}:3001/api/health` },
        { key: 'citadel', url: `http://${host}:3005/api/health` },
    ];

    await Promise.allSettled(
        endpoints.map(async (ep) => {
            try {
                const res = await fetch(ep.url, { signal: AbortSignal.timeout(3000) });
                services[ep.key] = res.ok ? 'online' : 'error';
            } catch {
                services[ep.key] = 'offline';
            }
        })
    );

    return NextResponse.json({
        status: 'ok',
        service: 'rocket-command-pro',
        version: '2.0.0',
        port: 4000,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        system: {
            platform: os.platform(),
            arch: os.arch(),
            hostname: os.hostname(),
            cpuCount: cpus.length,
            cpuModel: cpus[0]?.model || 'unknown',
            cpuLoad: Math.round(cpuLoad),
            totalMemory: Math.round(totalMem / (1024 * 1024 * 1024) * 10) / 10,
            usedMemory: Math.round(usedMem / (1024 * 1024 * 1024) * 10) / 10,
            memoryPercent: memPercent,
        },
        services,
    });
}
