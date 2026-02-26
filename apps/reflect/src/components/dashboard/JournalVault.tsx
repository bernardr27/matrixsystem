'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { NeuralSurface } from '../ui/NeuralSurface';
import { NeuralButton } from '../ui/NeuralButton';
import CognitiveChallenge from '../Intelligence/CognitiveChallenge';

interface Entry {
    id: string;
    created_at: string;
    initial_input: string;
    mode: string;
}

export default function JournalVault() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeChallenge, setActiveChallenge] = useState<string | null>(null);
    const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
    const supabase = createClient();

    useEffect(() => {
        const fetchEntries = async () => {
            const { data } = await supabase
                .from('sessions')
                .select('id, created_at, initial_input, mode')
                .order('created_at', { ascending: false })
                .limit(5); // Show top 5 recent for dashboard focus

            if (data) setEntries(data);
            setLoading(false);
        };
        fetchEntries();
    }, [supabase]);

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', id);

        if (!error) {
            setEntries(prev => prev.filter(e => e.id !== id));
        }
    };

    const handleUnlock = (id: string) => {
        setUnlockedIds(prev => new Set(prev).add(id));
        setActiveChallenge(null);
    };

    const getModeColor = (mode: string) => {
        switch (mode) {
            case 'mindset': return 'var(--accent)';
            case 'career': return '#10b981';
            case 'money': return '#f59e0b';
            case 'relationships': return '#ec4899';
            case 'discipline': return '#6366f1';
            case 'truth': return '#ff4757';
            default: return 'var(--foreground)';
        }
    };

    return (
        <NeuralSurface
            variant="glass"
            style={{
                width: '100%',
                maxWidth: '1300px',
                padding: '3rem',
                borderRadius: 'var(--radius-premium)',
                background: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2.5rem',
                boxShadow: 'var(--shadow-md)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 100, letterSpacing: '-0.03em', margin: 0, color: 'var(--foreground)' }}>Memory Vault</h3>
                    <p style={{ fontSize: '0.7rem', opacity: 0.2, fontWeight: 900, letterSpacing: '0.3em', marginTop: '0.8rem' }}>REFLECT_ENGINE // HISTORIC_LOGS</p>
                </div>
                <NeuralButton href="/archive" variant="ghost" size="sm" style={{ height: '44px' }}>ACCESS_FULL_ARCHIVE</NeuralButton>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <AnimatePresence mode="popLayout">
                    {entries.map((entry, i) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            layout
                        >
                            <NeuralSurface
                                variant="glass"
                                style={{
                                    padding: '1.5rem 2rem',
                                    borderRadius: '24px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'var(--surface-higher)',
                                    border: '1px solid var(--border-subtle)',
                                    transition: 'all 0.4s var(--ease-fluid)',
                                    cursor: 'pointer'
                                }}
                                className="vault-item-hover"
                            >
                                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flex: 1 }}>
                                    {/* Small indicator dot */}
                                    <div style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: getModeColor(entry.mode),
                                        boxShadow: `0 0 15px ${getModeColor(entry.mode)}30`
                                    }} />

                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--foreground)', opacity: 0.2, letterSpacing: '0.2em', marginBottom: '0.4rem' }}>
                                            {(entry.mode || 'MINDSET').toUpperCase()} // {new Date(entry.created_at).toLocaleDateString()}
                                        </div>
                                        <p style={{ fontSize: '1rem', margin: 0, fontWeight: 300, color: 'var(--foreground)', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>
                                            &quot;{entry.initial_input}&quot;
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', paddingLeft: '2rem' }}>
                                    <NeuralButton variant="ghost" size="sm" style={{ opacity: 0.1, height: '36px' }} onClick={(e) => { e.preventDefault(); handleDelete(entry.id); }}>PURGE</NeuralButton>
                                    <NeuralButton href={`/archive/${entry.id}`} variant="ghost" size="sm" style={{ height: '36px' }}>RESTORE</NeuralButton>
                                </div>
                            </NeuralSurface>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {entries.length === 0 && !loading && (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center', opacity: 0.15, fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.3em', background: 'var(--surface-higher)', borderRadius: '24px', border: '1px dashed var(--border-subtle)' }}>
                        VAULT_EMPTY // NO_SIGNALS_RETAINED
                    </div>
                )}
            </div>
            <style>{`
                .vault-item-hover:hover {
                    background: var(--surface-hover) !important;
                    border-color: var(--border-highlight) !important;
                    transform: translateX(8px);
                }
            `}</style>
        </NeuralSurface>
    );
}
