
import { createClient } from '@/lib/supabase/server';
import { isSafeMode } from '@/lib/safe-mode';
import { MOCK_HISTORY } from '@/lib/debug/mocks';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export default async function JournalDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    let session: any = null;
    const simulated = isSafeMode();

    // Use Safe Mode Logic
    if (isSafeMode()) {
        const mock = MOCK_HISTORY.find(h => h.id === id);
        if (mock) {
            session = {
                id: mock.id,
                created_at: mock.date,
                mode: 'mindset',
                initial_input: "This is a mock input showing full text.",
                mirror_text: mock.mirror,
                pattern_text: mock.pattern,
                reframe_question: mock.reframe,
                user_resolution: "I learned nothing."
            };
        }
    } else {
        const supabase = await createClient();
        const { data } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', id)
            .single();
        session = data;
    }

    if (!session) return notFound();

    return (
        <main className="container">
            {simulated && (
                <div style={{
                    fontSize: '0.55rem',
                    fontWeight: 900,
                    letterSpacing: '0.35em',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '999px',
                    border: '1px solid #333',
                    color: 'rgba(255,255,255,0.6)',
                    background: 'rgba(255,255,255,0.03)',
                    width: 'fit-content',
                    marginBottom: '1.5rem'
                }}>
                    SIMULATED
                </div>
            )}
            <Link href="/journal" style={{ color: '#666', textDecoration: 'none', marginBottom: '2rem', display: 'block' }}>
                ← Back
            </Link>

            <div style={{
                borderLeft: `4px solid var(--mode-${session.mode})`,
                paddingLeft: '1.5rem',
                marginBottom: '3rem'
            }}>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{new Date(session.created_at).toLocaleDateString()}</h1>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem', color: '#888' }}>
                    {session.mode}
                </span>
            </div>

            <section style={{ marginBottom: '3rem' }}>
                <h3 style={{ color: '#666', fontSize: '0.9rem', letterSpacing: '0.1em', marginBottom: '1rem' }}>YOU SAID</h3>
                <p style={{ fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '2rem' }}>{session.initial_input}</p>
                {session.image_url && (
                    <div style={{ marginBottom: '2rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333' }}>
                        <Image
                            src={session.image_url}
                            alt="Reflection visual"
                            width={1200}
                            height={500}
                            style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', background: '#050505' }}
                            loader={({ src }) => src}
                            unoptimized
                        />
                    </div>
                )}
            </section>

            <div style={{ display: 'grid', gap: '2rem' }}>
                <div style={{ background: '#111', padding: '1.5rem', borderRadius: '8px' }}>
                    <h3 style={{ color: '#666', fontSize: '0.8rem', marginBottom: '0.5rem' }}>MIRROR</h3>
                    <p>{session.mirror_text}</p>
                </div>
                <div style={{ background: '#111', padding: '1.5rem', borderRadius: '8px' }}>
                    <h3 style={{ color: '#666', fontSize: '0.8rem', marginBottom: '0.5rem' }}>PATTERN</h3>
                    <p>{session.pattern_text}</p>
                </div>
                <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #fff' }}>
                    <h3 style={{ color: '#666', fontSize: '0.8rem', marginBottom: '0.5rem' }}>REFRAME</h3>
                    <p style={{ fontSize: '1.2rem', fontWeight: 500 }}>{session.reframe_question}</p>
                </div>
            </div>

            {session.user_resolution && (
                <section style={{ marginTop: '3rem', borderTop: '1px solid #333', paddingTop: '2rem' }}>
                    <h3 style={{ color: '#666', fontSize: '0.9rem', letterSpacing: '0.1em', marginBottom: '1rem' }}>RESOLUTION</h3>
                    <p>{session.user_resolution}</p>
                </section>
            )}
        </main>
    );
}
