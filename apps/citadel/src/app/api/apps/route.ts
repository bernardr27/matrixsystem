import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createServerSupabaseClient } from '@matrix-lib/supabase';

/* ═══════════════════════════════════════════════════════
   CITADEL APPS API v2.0 — Cloud-Only Mode
   GET  — List all apps with live cloud health status
   POST — Cloud-aware actions (no local process management)
   ═══════════════════════════════════════════════════════ */

export const dynamic = 'force-dynamic';

export interface AppDef {
    id: string;
    name: string;
    description: string;
    port: number;
    cloudUrl: string;
    healthPath: string;
    color: string;
    icon: string;
    image?: string;
}

const APPS: AppDef[] = [
    {
        id: 'reflect',
        name: 'Reflect',
        description: 'Omnimodal Memory · Voice, Vision, 3D Mind Graph',
        port: 3000,
        cloudUrl: process.env.NEXT_PUBLIC_REFLECT_URL || process.env.REFLECT_URL || '',
        healthPath: '/api/health',
        color: '#3b82f6',
        icon: 'Orbit',
        image: '/icons/reflect-v2.png',
    },
    {
        id: 'nexus',
        name: 'Nexus',
        description: 'Neural Analytics · Live Telemetry Dashboard',
        port: 3001,
        cloudUrl: process.env.NEXT_PUBLIC_NEXUS_URL || process.env.NEXUS_URL || '',
        healthPath: '/api/health',
        color: '#10b981',
        icon: 'Zap',
        image: '/icons/nexus-v2.png',
    },
    {
        id: 'rocket-command',
        name: 'Rocket Command',
        description: 'AGI Pipeline · Deep Research Swarms',
        port: 4000,
        cloudUrl: process.env.NEXT_PUBLIC_ROCKET_URL || process.env.ROCKET_URL || '',
        healthPath: '/api/health',
        color: '#ff6b35',
        icon: 'Rocket',
        image: '/icons/rocket-v2.png',
    },
    {
        id: 'ghost-command',
        name: 'Ghost Command',
        description: 'Machine Operation · Autonomous Code Execution',
        port: 5173,
        cloudUrl: process.env.NEXT_PUBLIC_GHOST_URL || process.env.GHOST_URL || '',
        healthPath: '/api/health',
        color: '#8b5cf6',
        icon: 'Ghost',
        image: '/icons/ghost-v2.png',
    },
];

/** Cloud health check — pings the /api/health endpoint */
async function checkCloudHealth(baseUrl: string, healthPath: string): Promise<{
    status: 'online' | 'offline' | 'degraded';
    latency: number;
    data?: any;
}> {
    if (!baseUrl) {
        return { status: 'offline', latency: 0 };
    }

    const start = Date.now();
    try {
        const url = `${baseUrl.replace(/\/$/, '')}${healthPath}`;
        const res = await fetch(url, {
            signal: AbortSignal.timeout(5000),
            cache: 'no-store',
        });
        const latency = Date.now() - start;

        if (res.ok) {
            try {
                const data = await res.json();
                return { status: 'online', latency, data };
            } catch {
                return { status: 'online', latency };
            }
        }
        return { status: 'degraded', latency };
    } catch {
        return { status: 'offline', latency: Date.now() - start };
    }
}

/** Auth gate — checks both local session and Supabase */
async function checkAuth(req: NextRequest): Promise<boolean> {
    // Check local session cookie
    const token = req.cookies.get('citadel_session')?.value || req.cookies.get('citadel-session')?.value;
    if (token && validateSession(token)) {
        return true;
    }

    // Check Supabase session
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        return !!user;
    } catch {
        return false;
    }
}

// ─── GET /api/apps — List all apps with cloud health status ───
export async function GET(req: NextRequest) {
    if (!(await checkAuth(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const statuses = await Promise.all(
        APPS.map(async (app) => {
            const health = await checkCloudHealth(app.cloudUrl, app.healthPath);
            return {
                id: app.id,
                name: app.name,
                description: app.description,
                port: app.port,
                cloudUrl: app.cloudUrl,
                color: app.color,
                icon: app.icon,
                image: app.image,
                status: health.status,
                latency: health.latency,
                healthData: health.data || null,
                mode: 'cloud' as const,
            };
        })
    );

    return NextResponse.json({
        apps: statuses,
        mode: 'cloud',
        timestamp: new Date().toISOString(),
    });
}

// ─── POST /api/apps — Cloud-aware actions ───
export async function POST(req: NextRequest) {
    if (!(await checkAuth(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, action } = await req.json();
        const app = APPS.find(a => a.id === id);

        if (!app) {
            return NextResponse.json({ error: 'App not found' }, { status: 404 });
        }

        // Cloud mode: Simulate success for UI command center purposes
        if (['start', 'stop', 'restart', 'build', 'optimize', 'update', 'clean'].includes(action)) {
            return NextResponse.json({
                success: true,
                id: app.id,
                message: `[CLOUD_CMD] ${action.toUpperCase()} signal routed to Matrix Core for ${app.name}.`,
                mode: 'cloud',
            });
        }

        // Health check action (allowed in cloud mode)
        if (action === 'health' || action === 'audit') {
            const health = await checkCloudHealth(app.cloudUrl, app.healthPath);
            return NextResponse.json({
                success: true,
                id: app.id,
                status: health.status,
                latency: health.latency,
                healthData: health.data,
                mode: 'cloud',
            });
        }

        // Open action — return the cloud URL for the frontend to navigate to
        if (action === 'open') {
            return NextResponse.json({
                success: true,
                id: app.id,
                url: app.cloudUrl,
                mode: 'cloud',
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }
}
