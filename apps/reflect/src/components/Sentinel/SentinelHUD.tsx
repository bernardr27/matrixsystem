'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { LogEntry } from '@/lib/sentinel/logger';
import { SentinelAI, SentinelAnalysis } from '@/lib/sentinel/ai-engine';
import { NeuralButton } from '../ui/NeuralButton';
import { NeuralSurface } from '../ui/NeuralSurface';


interface ExtendedLog extends LogEntry {
    id?: string;
    timestamp: string; // Ensure compatible string type
}

const SentinelLogItem = React.memo(({ log, onDiagnose, isDiagnosing }: { log: ExtendedLog, onDiagnose: () => void, isDiagnosing: boolean }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="transition-all duration-500"
        style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            padding: '10px',
            borderLeft: `3px solid ${log.severity === 'critical' ? '#ef4444' : '#f59e0b'}`
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <div style={{ color: log.severity === 'critical' ? '#ef4444' : '#f59e0b', fontWeight: 700, fontSize: '0.7rem', marginBottom: '4px' }}>
                    {log.severity.toUpperCase()} <span style={{ color: '#555', fontWeight: 400 }}>• {new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div style={{ color: '#eee', fontSize: '0.8rem', lineHeight: 1.4 }}>{log.error_message}</div>
            </div>
            <NeuralButton
                onClick={onDiagnose}
                variant="secondary"
                size="sm"
                style={{
                    fontSize: '0.65rem',
                    whiteSpace: 'nowrap',
                    marginLeft: '8px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
            >
                {isDiagnosing ? 'CLOSE' : 'AI DIAGNOSE'}
            </NeuralButton>
        </div>
    </motion.div>
));

SentinelLogItem.displayName = 'SentinelLogItem';

export default function SentinelHUD() {
    const [logs, setLogs] = useState<ExtendedLog[]>([]);
    const [diagnosingId, setDiagnosingId] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<SentinelAnalysis | null>(null);
    const supabase = useMemo(() => createClient(), []);

    // Initial fetch
    const fetchLogs = useCallback(async () => {
        const { data } = await supabase
            .from('sentinel_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(20);

        if (data) setLogs(data);
    }, [supabase]);

    useEffect(() => {
        fetchLogs();

        // Real-time Subscription
        const channel = supabase
            .channel('sentinel-live')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sentinel_logs' }, (payload: any) => {
                const newLog = payload.new as ExtendedLog;
                setLogs(prev => [newLog, ...prev].slice(0, 50));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchLogs, supabase]);

    const runDiagnosis = async (log: ExtendedLog) => {
        if (diagnosingId === log.id) {
            setDiagnosingId(null);
            setAnalysis(null);
            return;
        }

        setDiagnosingId(log.id || 'temp');
        setAnalysis(null); // Clear previous

        // Sovereign AI Analysis
        const result = await SentinelAI.analyzeWithMatrix(log.error_message);
        setAnalysis(result);
    };

    const executeRepair = async (action: any) => {
        if (!process.env.NEXT_PUBLIC_SAFE_MODE) {
            const confirmed = window.confirm("Sentinel attempting automated repair. System reload may occur. Proceed?");
            if (!confirmed) return;
        }

        await SentinelAI.executeRepair(action);
        window.location.reload();
    };

    return (
        <NeuralSurface
            variant="glass"
            style={{
                marginTop: '1.5rem',
                padding: '1rem',
            }}
        >

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', transition: 'box-shadow 0.7s, background 0.7s' }} />
                    <span style={{ fontSize: '0.75rem', color: '#ccc', fontWeight: 600, letterSpacing: '0.05em' }}>SENTINEL LIVE</span>
                </div>
                <NeuralButton
                    onClick={fetchLogs}
                    variant="ghost"
                    size="sm"
                    style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                >
                    SYNC
                </NeuralButton>

            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                <AnimatePresence mode="popLayout">
                    {logs.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ padding: '2rem', textAlign: 'center', color: '#444', fontSize: '0.8rem', fontStyle: 'italic' }}
                        >
                            System Nominal. No Anomalies Detected.
                        </motion.div>
                    ) : (
                        logs.map((log) => (
                            <React.Fragment key={log.id}>
                                <SentinelLogItem
                                    log={log}
                                    onDiagnose={() => runDiagnosis(log)}
                                    isDiagnosing={diagnosingId === log.id}
                                />
                                <AnimatePresence>
                                    {diagnosingId === log.id && analysis && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{
                                                background: 'rgba(99, 102, 241, 0.05)',
                                                border: '1px solid rgba(99, 102, 241, 0.15)',
                                                borderRadius: '6px',
                                                padding: '10px',
                                                fontSize: '0.75rem',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <div style={{ color: '#a5b4fc', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span>🤖</span> SENTINEL INSIGHT
                                            </div>
                                            <p style={{ color: '#cbd5e1', marginBottom: '8px', lineHeight: 1.5 }}>{analysis.insight}</p>

                                            {analysis.action !== 'none' && (
                                                <NeuralButton
                                                    onClick={() => executeRepair(analysis.action)}
                                                    variant="primary"
                                                    size="sm"
                                                    glow={true}
                                                    icon="⚡"
                                                    style={{ marginTop: '8px' }}
                                                >
                                                    EXECUTE REPAIR: {analysis.action.replace('_', ' ').toUpperCase()}
                                                </NeuralButton>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </React.Fragment>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </NeuralSurface>
    );
}
