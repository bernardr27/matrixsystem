'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { NeuralSurface } from '../ui/NeuralSurface';

interface Session {
    id: string;
    started_at: string;
    mode: string;
    initial_input: string;
}

export default function NeuralActivityFeed() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchRecent = async () => {
            const { data } = await supabase
                .from('sessions')
                .select('id, started_at, mode, initial_input')
                .order('started_at', { ascending: false })
                .limit(10);

            if (data) setSessions(data);
            setLoading(false);
        };
        fetchRecent();
    }, [supabase]);

    const getModeColor = (mode: string) => {
        switch (mode) {
            case 'mindset': return '#4ade80';
            case 'career': return '#60a5fa';
            case 'money': return '#fbbf24';
            case 'relationships': return '#f472b6';
            case 'discipline': return '#a78bfa';
            default: return '#555';
        }
    };

    if (loading) return null;

    return (
        <div style={{ width: '100%', overflowX: 'auto', padding: '1rem 0' }}>
            <motion.div
                style={{ display: 'flex', gap: '1rem', padding: '0 2rem' }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                {sessions.map((session, i) => (
                    <motion.div
                        key={session.id}
                        whileHover={{ y: -5, scale: 1.02 }}
                        style={{ flexShrink: 0 }}
                    >
                        <NeuralSurface
                            variant="glass"
                            style={{
                                padding: '0.8rem 1.2rem',
                                minWidth: '200px',
                                maxWidth: '280px',
                                borderLeft: `3px solid ${getModeColor(session.mode)}`,
                                background: 'rgba(255, 255, 255, 0.02)'
                            }}
                        >
                            <div style={{ fontSize: '0.55rem', fontWeight: 800, opacity: 0.4, letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
                                {(session.mode || 'mindset').toUpperCase()} // {session.started_at ? new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#fff', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                                {session.initial_input || 'Reflecting...'}
                            </p>
                        </NeuralSurface>
                    </motion.div>
                ))}
                {sessions.length === 0 && (
                    <div style={{ opacity: 0.3, fontSize: '0.7rem', letterSpacing: '0.1em' }}>NEURAL_FEED_EMPTY // AWAITING_INPUT</div>
                )}
            </motion.div>
        </div>
    );
}
