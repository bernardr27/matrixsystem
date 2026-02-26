/**
 * Phase 26: Health API v2 — Deep System Health Endpoint
 * 
 * Pings Supabase, checks Ghost command activity,
 * reports memory/uptime, and aggregates service status.
 */

import { NextResponse } from 'next/server';
import { createAnonSupabaseClientFromEnv } from '@matrix-lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Safe initialization
const supabase = createAnonSupabaseClientFromEnv(process.env);

export async function GET() {
    const start = Date.now();

    try {
        // 1. Supabase connectivity
        let supabaseStatus = 'unknown';
        let dbLatency = 0;

        if (supabase) {
            try {
                const dbStart = Date.now();
                const { error } = await supabase.from('ghost_bridge').select('id').limit(1);
                dbLatency = Date.now() - dbStart;
                supabaseStatus = error ? 'degraded' : 'connected';
            } catch {
                supabaseStatus = 'unreachable';
            }
        } else {
            supabaseStatus = 'configured_incorrectly';
        }

        // 2. Ghost Brain activity (last heartbeat via ghost_bridge)
        let ghostBrainStatus = 'unknown';
        let lastActivity: string | null = null;

        if (supabase) {
            try {
                const { data } = await supabase
                    .from('ghost_bridge')
                    .select('created_at')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (data) {
                    lastActivity = data.created_at;
                    const age = Date.now() - new Date(data.created_at).getTime();
                    ghostBrainStatus = age < 10 * 60 * 1000 ? 'active' : 'stale';
                } else {
                    ghostBrainStatus = 'no_data';
                }
            } catch {
                ghostBrainStatus = 'error';
            }
        }

        // 3. Recent system events (last hour)
        let recentErrors = 0;
        let recentWarnings = 0;

        if (supabase) {
            try {
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

                const { count: errCount } = await supabase
                    .from('system_events')
                    .select('id', { count: 'exact', head: true })
                    .eq('severity', 'error')
                    .gte('timestamp', oneHourAgo);

                const { count: warnCount } = await supabase
                    .from('system_events')
                    .select('id', { count: 'exact', head: true })
                    .eq('severity', 'warning')
                    .gte('timestamp', oneHourAgo);

                recentErrors = errCount || 0;
                recentWarnings = warnCount || 0;
            } catch { }
        }

        // 4. Latest uptime snapshot
        let latestUptime: any = null;
        if (supabase) {
            try {
                const { data } = await supabase
                    .from('uptime_log')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                latestUptime = data;
            } catch { }
        }

        // 5. Overall health score
        const issues: string[] = [];
        if (supabaseStatus !== 'connected') issues.push('supabase_degraded');
        if (ghostBrainStatus !== 'active') issues.push('ghost_brain_inactive');
        if (recentErrors > 5) issues.push('high_error_rate');
        if (latestUptime && !latestUptime.all_healthy) issues.push('services_unhealthy');
        if (latestUptime && latestUptime.ram_usage > 90) issues.push('high_memory');

        const overallStatus = issues.length === 0 ? 'healthy'
            : issues.length <= 2 ? 'degraded'
                : 'critical';

        const responseTime = Date.now() - start;

        return NextResponse.json({
            status: overallStatus,
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime}ms`,
            issues,
            components: {
                supabase: {
                    status: supabaseStatus,
                    latency: `${dbLatency}ms`
                },
                ghostBrain: {
                    status: ghostBrainStatus,
                    lastActivity
                },
                events: {
                    errorsLastHour: recentErrors,
                    warningsLastHour: recentWarnings
                },
                system: latestUptime ? {
                    cpu: latestUptime.cpu_load,
                    ram: `${latestUptime.ram_usage}%`,
                    uptime: `${latestUptime.uptime_hours?.toFixed(0)}h`,
                    services: latestUptime.services,
                    allHealthy: latestUptime.all_healthy,
                    snapshotAge: `${Math.round((Date.now() - new Date(latestUptime.timestamp).getTime()) / 60000)}min`
                } : null
            }
        }, { status: overallStatus === 'critical' ? 503 : 200 });

    } catch (error) {
        return NextResponse.json({
            status: 'critical',
            timestamp: new Date().toISOString(),
            error: 'Health check failed catastrophically',
            responseTime: `${Date.now() - start}ms`
        }, { status: 503 });
    }
}
