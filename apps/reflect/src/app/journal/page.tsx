import { createClient } from '@/lib/supabase/server';
import { isSafeMode } from '@/lib/safe-mode';
import { MOCK_HISTORY } from '@/lib/debug/mocks';
import ZenJournal from '@/components/journal/ZenJournal';
import StandardPageLayout from '@/components/layout/StandardPageLayout';

export default async function JournalPage() {
    let sessions: any[] = [];

    if (isSafeMode()) {
        sessions = MOCK_HISTORY.map(h => ({
            id: h.id,
            created_at: h.date,
            initial_input: "Neural synthesis: " + h.pattern + " optimization protocol.",
            mode: 'mindset'
        }));
    } else {
        const supabase = await createClient();
        const { data } = await supabase
            .from('sessions')
            .select('id, created_at, initial_input, mode, unlock_at, image_url')
            .order('created_at', { ascending: false });
        sessions = data || [];
    }

    return (
        <StandardPageLayout title="Neural Repository">
            {isSafeMode() && (
                <div style={{
                    fontSize: '0.55rem',
                    fontWeight: 900,
                    letterSpacing: '0.35em',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '999px',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--foreground)',
                    opacity: 0.6,
                    background: 'var(--surface-lower)',
                    width: 'fit-content'
                }}>
                    SIMULATED
                </div>
            )}
            <ZenJournal initialSessions={sessions} />
        </StandardPageLayout>
    );
}
