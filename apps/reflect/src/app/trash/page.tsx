'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { NeuralButton } from '@/components/ui/NeuralButton';
import RefractiveWorkstation from '@/components/marketing/RefractiveWorkstation';
import { useNotifications } from '@/context/NotificationContext';
import styles from './Trash.module.css';

export default function TrashPage() {
    const [trashedSessions, setTrashedSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeInsight, setActiveInsight] = useState<string | null>(null);
    const { incrementTrash } = useNotifications();
    const supabase = useMemo(() => createClient(), []);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const hasSupabase = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder';

    const fetchTrash = useCallback(async () => {
        setLoading(true);
        if (!hasSupabase) {
            setTrashedSessions([]);
            setLoading(false);
            return;
        }
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('is_trashed', true)
            .order('started_at', { ascending: false });

        if (!error) setTrashedSessions(data || []);
        setLoading(false);
    }, [hasSupabase, supabase]);

    useEffect(() => {
        fetchTrash();
    }, [fetchTrash]);

    const handleRestore = async (id: string) => {
        if (!hasSupabase) return;
        const { error } = await supabase.from('sessions').update({ is_trashed: false }).eq('id', id);
        if (!error) fetchTrash();
    };

    const handlePermanentDelete = async (id: string) => {
        if (!hasSupabase) return;
        const { error } = await supabase.from('sessions').delete().eq('id', id);
        if (!error) fetchTrash();
    };

    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>TRASH_MATRIX</h1>
                <p className={styles.subtitle}>Discarded neural patterns awaiting re-integration or erasure.</p>
                {!hasSupabase && (
                    <span style={{
                        fontSize: '0.55rem',
                        fontWeight: 900,
                        letterSpacing: '0.35em',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '999px',
                        border: '1px solid rgba(245,158,11,0.35)',
                        color: '#fbbf24',
                        background: 'rgba(245,158,11,0.08)',
                        width: 'fit-content',
                        marginTop: '0.75rem',
                        display: 'inline-flex'
                    }}>
                        OFFLINE
                    </span>
                )}
            </div>

            <div className={styles.content}>
                <div className={styles.listSection}>
                    {loading ? (
                        <div className={styles.loading}>Scanning matrix...</div>
                    ) : trashedSessions.length === 0 ? (
                        <div className={styles.empty}>No objects detected in trash.</div>
                    ) : (
                        trashedSessions.map(session => (
                            <NeuralSurface key={session.id} variant="glass" className={styles.sessionCard}>
                                <div className={styles.sessionInfo}>
                                    <span className={styles.sessionDate}>{new Date(session.started_at).toLocaleDateString()}</span>
                                    <p className={styles.sessionInput}>"{session.initial_input}"</p>
                                </div>
                                <div className={styles.sessionActions}>
                                    <button
                                        className={styles.actionBtn}
                                        onClick={() => setActiveInsight(session.initial_input)}
                                        title="Receive More Insight"
                                    >
                                        ✨ EXPAND
                                    </button>
                                    <button
                                        className={styles.actionBtn}
                                        onClick={() => handleRestore(session.id)}
                                        title="Restore to Archive"
                                    >
                                        🛡️ RESTORE
                                    </button>
                                    <button
                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                        onClick={() => handlePermanentDelete(session.id)}
                                        title="Permanently Erase"
                                    >
                                        ✕ ERASE
                                    </button>
                                </div>
                            </NeuralSurface>
                        ))
                    )}
                </div>

                <div className={styles.workstationSection}>
                    <AnimatePresence mode="wait">
                        {activeInsight ? (
                            <motion.div
                                key="workstation"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={styles.workstationWrapper}
                            >
                                <div className={styles.workstationHeader}>
                                    <span>[ INSIGHT_EXPANSION_ENGINE ]</span>
                                    <button onClick={() => setActiveInsight(null)}>✕ CLOSE</button>
                                </div>
                                <RefractiveWorkstation
                                    value={activeInsight}
                                    promptMode="expansion"
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={styles.placeholder}
                            >
                                <div className={styles.placeholderIcon}>✨</div>
                                <h3>EXPANSION_UNIT_IDLE</h3>
                                <p>Select a discarded reflection to find new paths for clarity.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}
