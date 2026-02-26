import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import net from 'net';
import os from 'os';

const execAsync = promisify(exec);

interface ServiceConfig {
    name: string;
    port: number;
    dir: string;
    color: string;
}

const SERVICES: Record<string, ServiceConfig> = {
    ghost: { name: 'Ghost Command', port: 5173, dir: 'apps/ghost-command', color: 'cyan' },
    reflect: { name: 'Reflect', port: 3000, dir: 'apps/reflect', color: 'blue' },
    nexus: { name: 'Nexus', port: 3001, dir: 'apps/nexus', color: 'violet' },
    rocket: { name: 'RocketCommand Pro', port: 4000, dir: 'apps/rocket-command', color: 'orange' },
};

// Check if a port is listening
async function isPortOpen(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);
        socket.on('connect', () => { socket.destroy(); resolve(true); });
        socket.on('timeout', () => { socket.destroy(); resolve(false); });
        socket.on('error', () => { socket.destroy(); resolve(false); });
        socket.connect(port, '127.0.0.1');
    });
}

// Get PID using a port
async function getPidOnPort(port: number): Promise<number | null> {
    try {
        const { stdout } = await execAsync(
            `powershell -Command "Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq ${port} } | Select-Object -First 1 -ExpandProperty OwningProcess"`,
            { timeout: 5000 }
        );
        const pid = parseInt(stdout.trim(), 10);
        return isNaN(pid) ? null : pid;
    } catch {
        return null;
    }
}

// System metrics — real CPU & memory from OS
let prevCpuTimes: { idle: number; total: number } | null = null;
function getSystemMetrics() {
    const cpus = os.cpus();
    let idle = 0, total = 0;
    for (const cpu of cpus) {
        idle += cpu.times.idle;
        total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
    }
    let cpuPercent = 0;
    if (prevCpuTimes) {
        const idleDiff = idle - prevCpuTimes.idle;
        const totalDiff = total - prevCpuTimes.total;
        cpuPercent = totalDiff === 0 ? 0 : Math.round(((totalDiff - idleDiff) / totalDiff) * 100);
    }
    prevCpuTimes = { idle, total };
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);
    return { cpu: cpuPercent, memory: memoryPercent };
}

// GET — Returns status of all services
export async function GET() {
    const results: Record<string, { name: string; port: number; status: string; pid: number | null; latency: number | null; color: string }> = {};

    await Promise.all(
        Object.entries(SERVICES).map(async ([key, svc]) => {
            const start = Date.now();
            const alive = await isPortOpen(svc.port);
            const latency = alive ? Date.now() - start : null;
            const pid = alive ? await getPidOnPort(svc.port) : null;

            results[key] = {
                name: svc.name,
                port: svc.port,
                status: alive ? 'online' : 'offline',
                pid,
                latency,
                color: svc.color,
            };
        })
    );

    const metrics = getSystemMetrics();
    return NextResponse.json({ services: results, cpu: metrics.cpu, memory: metrics.memory, timestamp: Date.now() });
}

// POST — Execute service operations (start/stop/restart)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, target } = body as { action: string; target: string };

        if (!['start', 'stop', 'restart', 'start_all', 'stop_all', 'restart_all'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Bulk operations
        if (action.endsWith('_all')) {
            const baseAction = action.replace('_all', '');
            const results: Record<string, { success: boolean; message: string }> = {};

            for (const [key, svc] of Object.entries(SERVICES)) {
                if (key === 'rocket' && baseAction === 'stop') {
                    results[key] = { success: false, message: 'Cannot stop self' };
                    continue;
                }
                results[key] = await executeServiceAction(baseAction, key, svc);
            }

            return NextResponse.json({ action, results, timestamp: Date.now() });
        }

        // Single service operation
        if (!target || !SERVICES[target]) {
            return NextResponse.json({ error: `Unknown service: ${target}` }, { status: 400 });
        }

        if (target === 'rocket' && action === 'stop') {
            return NextResponse.json({ error: 'Cannot stop self (RocketCommand)' }, { status: 400 });
        }

        const result = await executeServiceAction(action, target, SERVICES[target]);
        return NextResponse.json({ action, target, ...result, timestamp: Date.now() });

    } catch (err) {
        return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
    }
}

async function executeServiceAction(
    action: string,
    key: string,
    svc: ServiceConfig
): Promise<{ success: boolean; message: string }> {
    try {
        const matrixRoot = process.cwd().replace(/[\\/]apps[\\/]rocket-command$/, '');

        if (action === 'stop') {
            const pid = await getPidOnPort(svc.port);
            if (!pid) return { success: true, message: `${svc.name} is not running` };

            await execAsync(
                `powershell -Command "Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue"`,
                { timeout: 10000 }
            );

            // Wait for port to free
            for (let i = 0; i < 10; i++) {
                await new Promise(r => setTimeout(r, 500));
                if (!(await isPortOpen(svc.port))) break;
            }

            return { success: true, message: `${svc.name} stopped (PID ${pid})` };
        }

        if (action === 'start') {
            if (await isPortOpen(svc.port)) {
                return { success: true, message: `${svc.name} is already running on port ${svc.port}` };
            }

            const svcDir = `${matrixRoot}\\${svc.dir.replace(/\//g, '\\\\')}`;

            // Use start to launch detached — this keeps it running even if this request ends
            await execAsync(
                `powershell -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'cd /d ${svcDir} && npm run dev' -WindowStyle Hidden"`,
                { timeout: 15000 }
            );

            // Wait for port to come up (up to 30s for Next.js cold start)
            for (let i = 0; i < 60; i++) {
                await new Promise(r => setTimeout(r, 500));
                if (await isPortOpen(svc.port)) {
                    return { success: true, message: `${svc.name} started on port ${svc.port}` };
                }
            }

            return { success: true, message: `${svc.name} launch initiated (port ${svc.port} not yet responding — may need 30-60s for cold start)` };
        }

        if (action === 'restart') {
            // Stop first
            const pid = await getPidOnPort(svc.port);
            if (pid) {
                await execAsync(
                    `powershell -Command "Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue"`,
                    { timeout: 10000 }
                );
                // Wait for port release
                for (let i = 0; i < 10; i++) {
                    await new Promise(r => setTimeout(r, 500));
                    if (!(await isPortOpen(svc.port))) break;
                }
            }

            // Then start
            const matrixDir = `${matrixRoot}\\${svc.dir.replace(/\//g, '\\\\')}`;
            await execAsync(
                `powershell -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'cd /d ${matrixDir} && npm run dev' -WindowStyle Hidden"`,
                { timeout: 15000 }
            );

            for (let i = 0; i < 60; i++) {
                await new Promise(r => setTimeout(r, 500));
                if (await isPortOpen(svc.port)) {
                    return { success: true, message: `${svc.name} restarted on port ${svc.port}` };
                }
            }

            return { success: true, message: `${svc.name} restart initiated (cold start in progress)` };
        }

        return { success: false, message: `Unknown action: ${action}` };

    } catch (err) {
        return { success: false, message: `Failed: ${String(err)}` };
    }
}
