import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ArchiveDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return <main style={{ padding: 24 }}>Error: {error.message}</main>;
  if (!data) notFound();

  return (
    <main style={{ maxWidth: 800, margin: '40px auto', padding: 16 }}>
      <h1>Session #{data.id}</h1>
      <p style={{ opacity: 0.7 }}>{data.started_at} {data.completed_at ? '✓' : ''}</p>

      <div style={{ borderLeft: '4px solid #ccc', paddingLeft: 12, marginTop: 16 }}>
        <h3>Mode</h3>
        <p>{data.mode}</p>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>Initial Input</h3>
        <p>{data.initial_input}</p>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>Mirror</h3>
        <p>{data.mirror_text}</p>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>Pattern</h3>
        <p>{data.pattern_text}</p>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>Reframe</h3>
        <p><strong>{data.reframe_question}</strong></p>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>Your Answer</h3>
        <p>{data.user_resolution || '(none)'}</p>
      </div>
    </main>
  );
}
