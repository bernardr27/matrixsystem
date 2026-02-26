
import Link from 'next/link';
import { PATHS } from '@/lib/paths/content';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSafeMode } from '@/lib/safe-mode';

export default async function PathDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const path = PATHS.find(p => p.id === slug);
    if (!path) notFound();

    let completedDays: number[] = [];

    if (!isSafeMode()) {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('course_progress')
                .select('completed_days')
                .eq('user_id', user.id)
                .eq('course_id', path.id)
                .single();
            if (data) completedDays = data.completed_days;
        }
    }

    return (
        <main className="container">
            <Link href="/paths" style={{ color: '#666', textDecoration: 'none', marginBottom: '2rem', display: 'block' }}>
                ← Back to Paths
            </Link>

            <div style={{ marginBottom: '3rem' }}>
                <span style={{ color: path.color, fontWeight: 700, letterSpacing: '0.05em', fontSize: '0.9rem' }}>GUIDED PATH</span>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{path.title}</h1>
                <p style={{ fontSize: '1.1rem', color: '#888', maxWidth: '600px', lineHeight: 1.6 }}>{path.description}</p>
            </div>

            <div style={{ display: 'grid', gap: '1rem', maxWidth: '600px' }}>
                {path.days.map((day) => {
                    const isDone = completedDays.includes(day.day);
                    const isNext = !isDone && (day.day === 1 || completedDays.includes(day.day - 1));
                    const isLocked = !isDone && !isNext;

                    return (
                        <div key={day.day} style={{
                            background: isLocked ? '#0a0a0a' : '#111',
                            border: '1px solid',
                            borderColor: isNext ? path.color : '#222',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            opacity: isLocked ? 0.5 : 1
                        }}>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.8rem', color: isNext ? path.color : '#666', marginBottom: '0.25rem' }}>
                                    DAY {day.day}
                                </span>
                                <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>{day.title}</h3>
                            </div>

                            <div>
                                {isDone ? (
                                    <span style={{ color: '#22c55e' }}>✓ Done</span>
                                ) : isLocked ? (
                                    <span style={{ color: '#444' }}>Locked</span>
                                ) : (
                                    <Link href={`/session?prompt=${encodeURIComponent(day.prompt)}&mode=${day.mode}`} style={{
                                        background: path.color,
                                        color: '#000',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '50px',
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                        fontSize: '0.9rem'
                                    }}>
                                        Start
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </main>
    );
}
