import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';

function normalizeServiceUrl(url: string | undefined, fallback: string): string {
    const value = (url || '').trim();
    if (!value) return fallback;
    // Backward-compat: runner moved from 3002 to 3333.
    if (value.includes('localhost:3002')) return 'http://localhost:3333';
    return value;
}

export async function GET() {
    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = (usedMem / totalMem) * 100;

    const interfaces = os.networkInterfaces();
    const nets: { name: string; address: string; family: string }[] = [];
    for (const [name, addrs] of Object.entries(interfaces)) {
        if (!addrs) continue;
        for (const addr of addrs) {
            if (!addr.internal) {
                nets.push({ name, address: addr.address, family: addr.family });
            }
        }
    }

    // Check which services are reachable (env vars for production, localhost fallback for dev)
    const reflectUrl = normalizeServiceUrl(process.env.REFLECT_URL, 'http://localhost:3000');
    const nexusUrl = normalizeServiceUrl(process.env.NEXUS_URL, 'http://localhost:3001');
    const runnerUrl = normalizeServiceUrl(process.env.RUNNER_URL, 'http://localhost:3333');
    const rocketUrl = normalizeServiceUrl(process.env.ROCKET_URL, 'http://localhost:4000');
    const citadelUrl = normalizeServiceUrl(process.env.CITADEL_URL, 'http://localhost:3005');

    const serviceChecks = await Promise.allSettled([
        fetch(`${reflectUrl}/api/health`, { signal: AbortSignal.timeout(2000) }).then(r => r.ok),
        fetch(`${nexusUrl}/api/health`, { signal: AbortSignal.timeout(2000) }).then(r => r.ok),
        fetch(`${runnerUrl}/status`, { signal: AbortSignal.timeout(2000) }).then(r => r.ok),
        fetch(`${rocketUrl}/api/health`, { signal: AbortSignal.timeout(2000) }).then(r => r.ok),
        fetch(`${citadelUrl}/api/health`, { signal: AbortSignal.timeout(2000) }).then(r => r.ok),
    ]);

    const services = {
        reflect: serviceChecks[0].status === 'fulfilled' && serviceChecks[0].value ? 'online' : 'offline',
        nexus: serviceChecks[1].status === 'fulfilled' && serviceChecks[1].value ? 'online' : 'offline',
        runner: serviceChecks[2].status === 'fulfilled' && serviceChecks[2].value ? 'online' : 'offline',
        rocketCommand: serviceChecks[3].status === 'fulfilled' && serviceChecks[3].value ? 'online' : 'offline',
        citadel: serviceChecks[4].status === 'fulfilled' && serviceChecks[4].value ? 'online' : 'offline',
        ghostCommand: 'online',
    };

    const onlineCount = Object.values(services).filter(s => s === 'online').length;

    return NextResponse.json({
        status: 'healthy',
        service: 'ghost-command',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        system: {
            cpu: Math.round(cpuUsage * 10) / 10,
            ram: Math.round(memPercent * 10) / 10,
            totalMemGB: Math.round(totalMem / 1073741824 * 10) / 10,
            freeMemGB: Math.round(freeMem / 1073741824 * 10) / 10,
            platform: os.platform(),
            hostname: os.hostname(),
            cores: cpus.length,
            loadAvg: os.loadavg(),
        },
        services,
        network: {
            interfaces: nets.slice(0, 6),
            servicesOnline: onlineCount,
            servicesTotal: Object.keys(services).length,
        },
    });
}
