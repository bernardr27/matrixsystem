import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { spawn, execSync } from 'child_process';
import net from 'net';

/* ═══════════════════════════════════════════════════════
   CITADEL APPS API v1.0 — App lifecycle management
   GET  — List all apps with live status
   POST — Control app (start / stop / restart / build)
   ═══════════════════════════════════════════════════════ */

export interface AppDef {
    id: string;
    name: string;
    description: string;
    port: number;
    path: string;
    color: string;
    icon: string;
    image?: string;
    buildFlag?: string;
}

const APPS: AppDef[] = [
    {
        id: 'rocket-command',
        name: 'RocketCommand Pro',
        description: 'AI command center — chat, missions & live telemetry',
        port: 4000,
        path: 'g:\\matrix\\apps\\rocket-command',
        color: '#ff6b35',
        icon: 'Rocket',
        image: '/icons/rocket.png',
    },
    {
        id: 'nexus',
        name: 'Nexus',
        description: 'Central intelligence hub for system coordination',
        port: 3001,
        path: 'g:\\matrix\\apps\\nexus',
        color: '#10b981',
        icon: 'Zap',
        image: '/icons/nexus.png',
    },
    {
        id: 'ghost-command',
        name: 'Ghost Command',
        description: 'Stealth operations interface for autonomous protocols',
        port: 5173,
        path: 'g:\\matrix\\apps\\ghost-command',
        color: '#8b5cf6',
        icon: 'Ghost',
        image: '/icons/ghost.png',
    },
    {
        id: 'reflect',
        name: 'Reflect',
        description: 'System mirror — monitoring, logs & diagnostics',
        port: 3000,
        path: 'g:\\matrix\\apps\\reflect',
        color: '#3b82f6',
        icon: 'Orbit',
        image: '/icons/reflect.png',
        buildFlag: '--webpack',
    },
];

/** TCP port check — returns true if something is listening */
function checkPort(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);
        socket.on('connect', () => { socket.destroy(); resolve(true); });
        socket.on('timeout', () => { socket.destroy(); resolve(false); });
        socket.on('error', () => { socket.destroy(); resolve(false); });
        socket.connect(port, '127.0.0.1');
    });
}

/** Auth gate */
function checkAuth(req: NextRequest): boolean {
    const token = req.cookies.get('citadel-session')?.value;
    return !!token && !!validateSession(token);
}

// ─── GET /api/apps — List all apps with live status ───
export async function GET(req: NextRequest) {
    if (!checkAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const statuses = await Promise.all(
        APPS.map(async (app) => ({
            id: app.id,
            name: app.name,
            description: app.description,
            port: app.port,
            color: app.color,
            icon: app.icon,
            image: app.image,
            status: (await checkPort(app.port)) ? 'online' as const : 'offline' as const,
        }))
    );

    return NextResponse.json({ apps: statuses });
}

// ─── POST /api/apps — Control an app ───
export async function POST(req: NextRequest) {
    if (!checkAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, action } = await req.json();
        const app = APPS.find(a => a.id === id);

        if (!app) {
            return NextResponse.json({ error: 'App not found' }, { status: 404 });
        }

        if (!['start', 'stop', 'restart', 'build', 'optimize', 'upgrade', 'clean', 'audit'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // ─── Background Advanced Actions ───
        if (['build', 'optimize', 'upgrade', 'clean', 'audit'].includes(action)) {
            let command = '';
            let statusLabel = '';

            if (action === 'build') { command = 'npm run build --webpack'; statusLabel = 'building'; }
            else if (action === 'optimize') { command = 'npm dedupe && npm rebuild'; statusLabel = 'optimizing'; }
            else if (action === 'upgrade') { command = 'npm update'; statusLabel = 'upgrading'; }
            else if (action === 'clean') { command = 'rmdir /s /q .next node_modules && npm i'; statusLabel = 'cleaning'; }
            else if (action === 'audit') { command = 'npm audit fix'; statusLabel = 'auditing'; }

            const child = spawn('cmd', [
                '/c',
                `cd /d ${app.path} && ${command}`,
            ], {
                detached: true,
                stdio: 'ignore',
                windowsHide: true,
            });
            child.unref();

            return NextResponse.json({ success: true, id: app.id, status: statusLabel });
        }

        // ─── Stop / Restart: Kill process on port ───
        if (action === 'stop' || action === 'restart') {
            try {
                execSync(
                    `powershell -Command "Get-NetTCPConnection -LocalPort ${app.port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
                    { timeout: 10000 }
                );
            } catch { /* process may not exist */ }

            if (action === 'restart') {
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        // ─── Start / Restart: Launch as background process ───
        if (action === 'start' || action === 'restart') {
            const child = spawn('cmd', [
                '/c',
                `cd /d ${app.path} && node node_modules\\next\\dist\\bin\\next start -p ${app.port} -H 127.0.0.1`,
            ], {
                detached: true,
                stdio: 'ignore',
                windowsHide: true,
            });
            child.unref();
        }

        // Wait for status to settle
        const wait = action === 'stop' ? 1500 : 4000;
        await new Promise(r => setTimeout(r, wait));
        const status = (await checkPort(app.port)) ? 'online' : 'offline';

        return NextResponse.json({ success: true, id: app.id, status });
    } catch (error) {
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }
}
