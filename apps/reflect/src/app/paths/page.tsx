
import Link from 'next/link';
import { PATHS } from '@/lib/paths/content';
import { createClient } from '@/lib/supabase/server';
import { isSafeMode } from '@/lib/safe-mode';

export const metadata = {
    title: 'Guided Paths | Reflect',
};

async function getProgress(courseId: string) {
    if (isSafeMode()) return 0;

    // In real app, fetch from DB
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;

        const { data } = await supabase.from('course_progress')
            .select('completed_days')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .single();

        return data?.completed_days?.length || 0;
    } catch { return 0; }
}

export default async function PathsPage() {
    return (
        <main className="container">
            <Link href="/session" style={{ color: '#666', textDecoration: 'none', marginBottom: '2rem', display: 'block' }}>
                ← Back to Session
            </Link>

            <h1 style={{ marginBottom: '0.5rem' }}>Guided Paths</h1>
            <p style={{ color: '#888', marginBottom: '3rem' }}>Structured journeys for deeper work.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {PATHS.map(async (path) => {
                    const completed = await getProgress(path.id);
                    const total = path.days.length;

                    return (
                        <Link key={path.id} href={`/paths/${path.id}`} style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: '#111',
                                border: '1px solid #333',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s, border-color 0.2s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{
                                        background: path.color,
                                        color: '#000',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px'
                                    }}>
                                        {path.duration.toUpperCase()}
                                    </span>
                                    {completed > 0 && <span style={{ color: '#888', fontSize: '0.8rem' }}>{completed}/{total}</span>}
                                </div>

                                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#fff' }}>{path.title}</h2>
                                <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: 1.5, flex: 1 }}>{path.description}</p>

                                <div style={{ marginTop: '1.5rem', color: path.color, fontSize: '0.9rem', fontWeight: 600 }}>
                                    {completed === total ? 'Completed' : (completed > 0 ? 'Continue Path →' : 'Start Path →')}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </main>
    );
}
