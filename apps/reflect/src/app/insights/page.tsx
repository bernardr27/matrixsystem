import { createClient } from '@/lib/supabase/server';
import { isSafeMode } from '@/lib/safe-mode';
import { MOCK_HISTORY } from '@/lib/debug/mocks';
import InsightsClient from '@/components/insights/InsightsClient';
import StandardPageLayout from '@/components/layout/StandardPageLayout';

export default async function InsightsPage() {
    let sessions: any[] = [];
    let biometricData: any[] = [];

    // Data Fetching
    if (isSafeMode()) {
        sessions = [
            ...MOCK_HISTORY,
            { id: '3', created_at: '2023-10-06', mode: 'money' },
            { id: '4', created_at: '2023-10-06', mode: 'career' },
            { id: '5', created_at: '2023-10-07', mode: 'career' },
        ];
    } else {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const [{ data: sessionData }, { data: bioData }] = await Promise.all([
                supabase.from('sessions').select('created_at, mode'),
                supabase.from('biometric_telemetry').select('metric_type, value, timestamp').order('timestamp', { ascending: true })
            ]);
            sessions = sessionData || [];
            biometricData = bioData || [];
        }
    }

    // Aggregation Logic
    const total = sessions.length;
    const streak = total > 0 ? "Active" : "Inactive";

    const modeCount: Record<string, number> = {};
    sessions.forEach(s => {
        modeCount[s.mode] = (modeCount[s.mode] || 0) + 1;
    });
    const modeData = Object.entries(modeCount).map(([name, value]) => ({ name, value }));

    const activityData = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        const count = sessions.filter(s => {
            const sDate = new Date(s.created_at || s.date);
            return sDate.getDate() === d.getDate() && sDate.getMonth() === d.getMonth();
        }).length;
        activityData.push({ day: dayStr, count });
    }

    return (
        <StandardPageLayout title="Neural Insights">
            <InsightsClient
                total={total}
                streak={streak}
                modeData={modeData}
                activityData={activityData}
                biometricData={biometricData}
                isSimulated={isSafeMode()}
            />
        </StandardPageLayout>
    );
}
