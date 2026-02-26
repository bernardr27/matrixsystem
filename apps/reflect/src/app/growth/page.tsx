import { createClient } from '@/lib/supabase/server';
import { isSafeMode } from '@/lib/safe-mode';
import { MOCK_HISTORY } from '@/lib/debug/mocks';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function GrowthPage() {
  let sessions: any[] = [];

  if (isSafeMode()) {
    sessions = MOCK_HISTORY.map((h) => ({
      initial_input: h.mirror,
      mirror_text: h.pattern,
      completed_at: h.date,
      mode: 'mindset',
      started_at: h.date
    }));
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/auth');

    const { data } = await supabase
      .from('sessions')
      .select('*')
      .order('started_at', { ascending: false });
    sessions = data || [];
  }

  // Calculate growth metrics
  const total = sessions?.length || 0;
  const completed = sessions?.filter((s) => s.completed_at).length || 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Detect pattern shifts
  const recentSessions = sessions?.slice(0, 10) || [];
  const olderSessions = sessions?.slice(10, 20) || [];
  
  const countNegativeWords = (text: string) => {
    const negative = /stuck|lost|frustrated|anxious|overwhelm|can't|impossible|hopeless/gi;
    return (text.match(negative) || []).length;
  };

  const recentNegative = recentSessions.reduce((sum, s) => 
    sum + countNegativeWords(`${s.initial_input} ${s.mirror_text}`), 0);
  const olderNegative = olderSessions.reduce((sum, s) => 
    sum + countNegativeWords(`${s.initial_input} ${s.mirror_text}`), 0);

  const improvement = olderNegative > 0 
    ? Math.round(((olderNegative - recentNegative) / olderNegative) * 100)
    : 0;

  // Mode diversity
  const modes = sessions?.map((s) => s.mode) || [];
  const uniqueModes = new Set(modes).size;

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 16 }}>
      <Link href="/session" style={{ color: '#666', textDecoration: 'none', marginBottom: '2rem', display: 'block' }}>
        ← Back to Session
      </Link>

      <h1 style={{ marginBottom: '1rem' }}>Growth Tracking</h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>Your reflection journey, measured</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', background: '#111', borderRadius: 8, border: '1px solid #333' }}>
          <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>TOTAL REFLECTIONS</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#22d3ee' }}>{total}</div>
        </div>

        <div style={{ padding: '1.5rem', background: '#111', borderRadius: 8, border: '1px solid #333' }}>
          <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>COMPLETION RATE</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#4ade80' }}>{completionRate}%</div>
        </div>

        <div style={{ padding: '1.5rem', background: '#111', borderRadius: 8, border: '1px solid #333' }}>
          <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>MODE DIVERSITY</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f59e0b' }}>{uniqueModes}/5</div>
        </div>

        <div style={{ padding: '1.5rem', background: '#111', borderRadius: 8, border: '1px solid #333' }}>
          <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>LANGUAGE SHIFT</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: improvement > 0 ? '#22c55e' : '#888' }}>
            {improvement > 0 ? `+${improvement}%` : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
            {improvement > 0 ? 'Less negative language' : 'Keep reflecting'}
          </div>
        </div>
      </div>

      <div style={{ padding: '1.5rem', background: '#111', borderRadius: 8, border: '1px solid #333' }}>
        <h3 style={{ marginBottom: '1rem' }}>What we track</h3>
        <ul style={{ color: '#aaa', lineHeight: 1.8, paddingLeft: '1.5rem' }}>
          <li><strong>Total Reflections:</strong> Every session you complete builds your practice.</li>
          <li><strong>Completion Rate:</strong> Finishing the full Mirror→Pattern→Reframe flow shows commitment.</li>
          <li><strong>Mode Diversity:</strong> Exploring different areas (mindset, career, money, etc.) indicates well-rounded growth.</li>
          <li><strong>Language Shift:</strong> AI detects when your input language becomes less negative over time—a sign of cognitive reframing success.</li>
        </ul>
      </div>
    </main>
  );
}
