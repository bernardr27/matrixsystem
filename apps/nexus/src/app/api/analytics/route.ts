import { NextResponse } from 'next/server';
import { createAdminSupabaseClientFromEnv } from '@matrix-lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createAdminSupabaseClientFromEnv(process.env);

export async function GET(req: Request) {
    try {
        if (!supabase) {
            return NextResponse.json({ source: 'no-db', health: {}, events: [] });
        }

        const url = new URL(req.url);
        const hours = parseInt(url.searchParams.get('hours') || '24');
        const since = new Date(Date.now() - hours * 3600000).toISOString();

        const [metricsRes, eventsRes, uptimeRes] = await Promise.all([
            supabase.from('system_metrics')
                .select('metric_type, value, metadata, created_at')
                .gte('created_at', since)
                .order('created_at', { ascending: false })
                .limit(500),
            supabase.from('system_events')
                .select('source, event_type, severity, message, timestamp')
                .gte('timestamp', since)
                .order('timestamp', { ascending: false })
                .limit(100),
            supabase.from('uptime_log')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50),
        ]);

        // Aggregate metrics by type
        const health: Record<string, { count: number; avg: number; latest: number }> = {};
        if (metricsRes.data) {
            for (const m of metricsRes.data) {
                if (!health[m.metric_type]) {
                    health[m.metric_type] = { count: 0, avg: 0, latest: m.value };
                }
                health[m.metric_type].count++;
                health[m.metric_type].avg += m.value;
            }
            for (const key of Object.keys(health)) {
                health[key].avg = Math.round((health[key].avg / health[key].count) * 100) / 100;
            }
        }

        // Severity distribution
        const severities: Record<string, number> = {};
        const events = (eventsRes.data || []).map(e => {
            severities[e.severity || 'info'] = (severities[e.severity || 'info'] || 0) + 1;
            return { timestamp: e.timestamp, source: e.source, type: e.event_type, severity: e.severity, message: e.message };
        });

        return NextResponse.json({
            source: 'cloud',
            timeRange: `${hours}h`,
            timestamp: new Date().toISOString(),
            health,
            events: events.slice(0, 20),
            severities,
            uptime: uptimeRes.data?.slice(0, 10) || [],
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
