export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArchiveList } from '@/components/ArchiveList';
import StandardPageLayout from '@/components/layout/StandardPageLayout';

export default async function ArchivePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('id, mode, started_at, completed_at, initial_input, mirror_text, pattern_text, reframe_question, user_resolution')
    .order('started_at', { ascending: false });

  if (error) {
    return (
      <StandardPageLayout title="Archive Error">
        <p>Error loading archive: {error.message}</p>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout title="Cognitive Archive">
      <header style={{ marginBottom: '1rem', opacity: 0.6 }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--foreground)', fontWeight: 300 }}>A ledger of your past neural refractions.</p>
      </header>

      {sessions && sessions.length > 0 ? (
        <ArchiveList sessions={sessions as any} />
      ) : (
        <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--surface)', borderRadius: '32px', border: '1px solid var(--border-subtle)' }}>
          <p style={{ opacity: 0.3, fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.2em' }}>NO_SESSIONS_RECORDED</p>
        </div>
      )}
    </StandardPageLayout>
  );
}
