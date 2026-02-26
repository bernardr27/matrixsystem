import { createServerSupabaseClient as createClient } from '@matrix-lib/supabase';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sync_mode, mock_data } = await req.json();

        // Simulation / Mock Data Logic
        if (sync_mode === 'simulate' || mock_data) {
            const metrics = [
                { type: 'hrv', base: 65, variance: 15 },
                { type: 'sleep_score', base: 80, variance: 10 },
                { type: 'readiness', base: 75, variance: 15 }
            ];

            const rows: any[] = [];
            const today = new Date();

            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);

                for (const m of metrics) {
                    rows.push({
                        user_id: user.id,
                        metric_type: m.type,
                        value: m.base + (Math.random() * m.variance * 2 - m.variance),
                        timestamp: date.toISOString(),
                        metadata: { simulated: true }
                    });
                }
            }

            const { error } = await supabase.from('biometric_telemetry').upsert(rows);
            if (error) throw error;

            return NextResponse.json({ success: true, message: 'Simulated biometrics synced', count: rows.length });
        }

        // Oura API Integration (Placeholder for Real API)
        const OURA_TOKEN = process.env.OURA_PERSONAL_ACCESS_TOKEN;
        if (!OURA_TOKEN) {
            return NextResponse.json({ error: 'Oura API key missing. Use sync_mode: simulate for testing.' }, { status: 400 });
        }

        // TODO: Implement real Oura fetch logic here
        // For now, return mock success to demonstrate the pipeline
        return NextResponse.json({ success: false, message: 'Real API integration pending token validation.' });

    } catch (err: any) {
        console.error("[CITADEL_BIOMETRICS] Sync error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (action === 'insight') {
            const { data: metrics, error } = await supabase
                .from('biometric_telemetry')
                .select('*')
                .eq('user_id', user.id)
                .order('timestamp', { ascending: false })
                .limit(30);

            if (error) throw error;

            const hrv = metrics.filter(m => m.metric_type === 'hrv');
            const sleep = metrics.filter(m => m.metric_type === 'sleep_score');
            const readiness = metrics.filter(m => m.metric_type === 'readiness');

            const avgHrv = hrv.length > 0 ? hrv.reduce((acc, m) => acc + m.value, 0) / hrv.length : 60;
            const avgSleep = sleep.length > 0 ? sleep.reduce((acc, m) => acc + m.value, 0) / sleep.length : 75;
            const avgReadiness = readiness.length > 0 ? readiness.reduce((acc, m) => acc + m.value, 0) / readiness.length : 70;

            let status = "Calm";
            let color = "gold";
            let resonance = 0.5;

            // Synthesis Logic
            if (avgHrv > 75 && avgReadiness > 85) {
                status = "Radiant";
                color = "amber";
                resonance = 0.9;
            } else if (avgHrv < 45 || avgReadiness < 50) {
                status = "Turbulent";
                color = "red";
                resonance = 0.3;
            } else if (avgSleep < 60) {
                status = "Depleted";
                color = "slate";
                resonance = 0.2;
            } else if (avgHrv > 65) {
                status = "Balanced";
                color = "gold";
                resonance = 0.7;
            }

            return NextResponse.json({
                cognitive_state: { status, color, resonance },
                metrics: { hrv: avgHrv, sleep: avgSleep, readiness: avgReadiness },
                timestamp: new Date().toISOString()
            });
        }

        const { data, error } = await supabase
            .from('biometric_telemetry')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false })
            .limit(100);

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
