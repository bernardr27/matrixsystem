'use client';

import { createClient } from '@/lib/supabase/client';
import { MOCK_HISTORY } from '@/lib/debug/mocks';

export function SettingsExport({ isSafeMode }: { isSafeMode: boolean }) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const hasSupabase = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder';
    const simulated = isSafeMode || !hasSupabase;

    const handleExport = async () => {
        let jsonStr = "";

        if (simulated) {
            jsonStr = JSON.stringify(MOCK_HISTORY, null, 2);
        } else {
            const supabase = createClient();
            const { data } = await supabase.from('sessions').select('*');
            jsonStr = JSON.stringify(data, null, 2);
        }

        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reflect-export-${new Date().toISOString()}.json`;
        a.click();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {simulated && (
                <span style={{
                    fontSize: '0.55rem',
                    fontWeight: 900,
                    letterSpacing: '0.35em',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(245,158,11,0.35)',
                    color: '#fbbf24',
                    background: 'rgba(245,158,11,0.08)',
                    width: 'fit-content'
                }}>
                    SIMULATED
                </span>
            )}
            <button onClick={handleExport} style={{ background: '#333', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer' }}>
                Export JSON
            </button>
        </div>
    );
}
