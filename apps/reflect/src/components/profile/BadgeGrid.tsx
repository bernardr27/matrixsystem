'use client';

import { BADGES, calculateUnlockedBadges } from '@/lib/gamification';
import { useState, useEffect } from 'react';

interface Session {
    id: string;
    mode: string;
    initial_input: string;
    mirror_text?: string;
    pattern_text?: string;
    reframe_question?: string;
    user_resolution?: string;
    completed_at?: string;
}

export default function BadgeGrid({ sessions }: { sessions: Session[] }) {
    const [unlocked, setUnlocked] = useState<string[]>([]);

    useEffect(() => {
        setUnlocked(calculateUnlockedBadges(sessions));
    }, [sessions]);

    return (
        <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: '#666', fontSize: '0.8rem', marginBottom: '1rem', letterSpacing: '0.05em' }}>ACHIEVEMENTS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                {BADGES.map(badge => {
                    const isUnlocked = unlocked.includes(badge.id);
                    return (
                        <div key={badge.id} style={{
                            background: '#111',
                            border: `1px solid ${isUnlocked ? '#444' : '#222'}`,
                            borderRadius: '8px',
                            padding: '1.25rem',
                            textAlign: 'center',
                            opacity: isUnlocked ? 1 : 0.4,
                            filter: isUnlocked ? 'none' : 'grayscale(100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span style={{ fontSize: '2rem' }}>{badge.icon}</span>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{badge.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem', lineHeight: 1.4 }}>{badge.description}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
