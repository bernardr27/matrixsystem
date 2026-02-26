import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@matrix-lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const host = req.headers.get('host')?.split(':')[0] || 'localhost';

    const services = [
        { key: 'reflect', port: 3000, path: '/api/health' },
        { key: 'nexus', port: 3001, path: '/api/health' },
        { key: 'ghost-command', port: 5173, path: '/api/health' },
        { key: 'rocket-command', port: 4000, path: '/api/health' },
        { key: 'citadel', port: 3005, path: '/api/health' },
    ];

    const results: Record<string, { status: string; latency?: number; data?: unknown }> = {};

    await Promise.allSettled(
        services.map(async (svc) => {
            const start = Date.now();
            try {
                const res = await fetch(`http://${host}:${svc.port}${svc.path}`, {
                    signal: AbortSignal.timeout(3000),
                });
                const latency = Date.now() - start;
                if (res.ok) {
                    const data = await res.json();
                    results[svc.key] = { status: 'online', latency, data };
                } else {
                    results[svc.key] = { status: 'error', latency };
                }
            } catch {
                results[svc.key] = { status: 'offline', latency: Date.now() - start };
            }
        })
    );

    const online = Object.values(results).filter(r => r.status === 'online').length;
    const total = services.length;

    // Phase 47: Global Planetary Mesh Summary
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
                const region = node.metadata?.region || 'local-mesh';
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
        timestamp: new Date().toISOString(),
        services: results,
        mesh: meshSummary
    });
}
