'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const moods = [
    { id: 'neutral', color: '#fff', label: 'NEUTRAL' },
    { id: 'focus', color: '#10b981', label: 'FOCUS' },
    { id: 'logic', color: '#3b82f6', label: 'LOGIC' },
    { id: 'creative', color: '#f59e0b', label: 'CREATIVE' },
    { id: 'reflection', color: '#ec4899', label: 'REFLECTION' }
];

export default function MoodSelector({ currentMood, onMoodChange }: { currentMood: string, onMoodChange: (mood: string) => void }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '1.5rem',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '0 1rem'
            }}>
                {moods.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => onMoodChange(m.id)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '10px 4px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.6rem',
                            transition: 'all 0.3s var(--ease-fluid)',
                            flex: '0 1 auto'
                        }}
                    >
                        <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: currentMood === m.id ? m.color : 'var(--foreground)',
                            opacity: currentMood === m.id ? 1 : 0.1,
                            boxShadow: currentMood === m.id ? `0 0 15px ${m.color}` : 'none',
                            transition: 'all 0.5s var(--ease-fluid)',
                            transform: currentMood === m.id ? 'scale(1.2)' : 'scale(1)'
                        }} />

                        <motion.span
                            initial={false}
                            animate={{
                                opacity: currentMood === m.id ? 0.8 : 0.2,
                                y: currentMood === m.id ? 0 : 2
                            }}
                            style={{
                                fontSize: '0.55rem',
                                fontWeight: 900,
                                letterSpacing: '0.15em',
                                color: 'var(--foreground)',
                                pointerEvents: 'none',
                                textTransform: 'uppercase'
                            }}
                        >
                            {m.label}
                        </motion.span>
                    </button>
                ))}
            </div>
            <div style={{
                fontSize: '0.6rem',
                fontWeight: 900,
                letterSpacing: '0.5em',
                color: 'var(--foreground)',
                opacity: 0.15,
                marginTop: '1rem',
                textTransform: 'uppercase'
            }}>
                SYSTEM_MODALITY
            </div>
        </div>
    );
}



