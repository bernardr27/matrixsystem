import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@matrix-lib/supabase';

export const dynamic = 'force-dynamic';

/* ═══════════════════════════════════════════════════════
   CITADEL STATUS API v2.0 — Cloud-Only Mode
   Pings cloud health endpoints instead of localhost ports
   ═══════════════════════════════════════════════════════ */

const services = [
    { key: 'reflect', url: process.env.NEXT_PUBLIC_REFLECT_URL || process.env.REFLECT_URL || '', path: '/api/health' },
    { key: 'nexus', url: process.env.NEXT_PUBLIC_NEXUS_URL || process.env.NEXUS_URL || '', path: '/api/health' },
    { key: 'ghost-command', url: process.env.NEXT_PUBLIC_GHOST_URL || process.env.GHOST_URL || '', path: '/api/health' },
    { key: 'rocket-command', url: process.env.NEXT_PUBLIC_ROCKET_URL || process.env.ROCKET_URL || '', path: '/api/health' },
    { key: 'citadel', url: process.env.NEXT_PUBLIC_CITADEL_URL || process.env.CITADEL_URL || 'http://localhost:3005', path: '/api/health' },
];

export async function GET() {
    const results: Record<string, { status: string; latency?: number; data?: unknown; url?: string }> = {};

    await Promise.allSettled(
        services.map(async (svc) => {
            if (!svc.url) {
                results[svc.key] = { status: 'unconfigured', url: '' };
                return;
            }

            const start = Date.now();
            try {
                const endpoint = `${svc.url.replace(/\/$/, '')}${svc.path}`;
                const res = await fetch(endpoint, {
                    signal: AbortSignal.timeout(5000),
                    cache: 'no-store',
                });
                const latency = Date.now() - start;
                if (res.ok) {
                    const data = await res.json();
                    results[svc.key] = { status: 'online', latency, data, url: svc.url };
                } else {
                    results[svc.key] = { status: 'error', latency, url: svc.url };
                }
            } catch {
                results[svc.key] = { status: 'offline', latency: Date.now() - start, url: svc.url };
            }
        })
    );

    const online = Object.values(results).filter(r => r.status === 'online').length;
    const total = services.length;

    // Planetary Mesh Summary
    let meshSummary: any = null;
    try {
        const supabase = await createServerSupabaseClient();
        const { data: instances } = await supabase
            .from('matrix_instances')
            .select('*')
            .order('last_heartbeat', { ascending: false });

        if (instances) {
            const now = Date.now();
            const onlineNodes = instances.filter(i => (now - new Date(i.last_heartbeat).getTime()) < 120000);
            const regions: Record<string, number> = {};
            onlineNodes.forEach(node => {
                const region = node.metadata?.region || 'cloud';
                regions[region] = (regions[region] || 0) + 1;
            });

            meshSummary = {
                total_nodes: instances.length,
                online_nodes: onlineNodes.length,
                regional_distribution: regions
            };
        }
    } catch (err) {
        console.error('[STATUS_API] Mesh summary failed:', err);
    }

    return NextResponse.json({
        status: online === total ? 'all_online' : online > 0 ? 'partial' : 'critical',
        summary: `${online}/${total} services online`,
        mode: 'cloud',
        timestamp: new Date().toISOString(),
        services: results,
        mesh: meshSummary
    });
}
