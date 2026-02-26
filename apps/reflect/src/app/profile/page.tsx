import ProfileForm from '@/components/ProfileForm';
import BadgeGrid from '@/components/profile/BadgeGrid';
import { isSafeMode } from '@/lib/safe-mode';
import { MOCK_HISTORY } from '@/lib/debug/mocks';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
    const simulated = isSafeMode();
    let sessions: any[] = [];

    if (simulated) {
        sessions = MOCK_HISTORY;
    } else {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) redirect('/auth');

        const { data } = await supabase
            .from('sessions')
            .select('id, created_at, mode, completed_at')
            .order('created_at', { ascending: false });
        sessions = data || [];
    }

    return (
        <StandardPageLayout title="Neural Profile">
            <div className="flex flex-col gap-12 max-w-2xl mx-auto w-full">
                <ProfileForm />

                <div className="space-y-6">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/20 mb-8 px-4">Temporal Achievements</h2>
                    {simulated && (
                        <span style={{
                            fontSize: '0.55rem',
                            fontWeight: 900,
                            letterSpacing: '0.35em',
                            padding: '0.35rem 0.6rem',
                            borderRadius: '999px',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--foreground)',
                            opacity: 0.6,
                            background: 'var(--surface-lower)',
                            width: 'fit-content',
                            marginLeft: '1rem'
                        }}>
                            SIMULATED
                        </span>
                    )}
                    <BadgeGrid sessions={sessions} />
                </div>
            </div>
        </StandardPageLayout>
    );
}
