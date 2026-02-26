'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSage } from '@/context/SageContext';
import { Terminal, Cpu, Zap, Beaker } from 'lucide-react';

export const AntigravityLens: React.FC = () => {
    const { status, messages } = useSage();
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return <div style={{ height: '240px', background: 'rgba(0,0,0,0.1)', borderRadius: '24px' }} />;

    return (
        <div style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            backdropFilter: 'blur(20px)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Beaker size={18} color="var(--accent)" />
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.1em' }}>ANTIGRAVITY_LENS</span>
                </div>
                <motion.div
                    animate={{ opacity: status === 'idle' ? 0.3 : 1 }}
                    style={{
                        padding: '4px 10px',
                        background: status === 'thinking' ? 'var(--accent)' :
                            status === 'executing' ? 'var(--neural-pulse)' : 'rgba(255,255,255,0.05)',
                        borderRadius: '6px',
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        color: status === 'idle' ? '#fff' : '#000'
                    }}
                >
                    {status.toUpperCase()}
                </motion.div>
            </div>

            <div style={{
                height: '120px',
                overflowY: 'auto',
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.4)',
                fontFamily: 'monospace',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
            }}>
                <AnimatePresence initial={false}>
                    {messages.slice(0, 10).map((log: { id?: string; content: string }, i: number) => (
                        <motion.div
                            key={log.id || i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{ display: 'flex', gap: '8px' }}
                        >
                            <span style={{ color: 'var(--accent)' }}>▶</span>
                            <span>{log.content}</span>
                        </motion.div>
                    ))}
                    {messages.length === 0 && (
                        <div style={{ opacity: 0.3, fontStyle: 'italic' }}>Waiting for neural transmission...</div>
                    )}
                </AnimatePresence>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', alignContent: 'center', gap: '6px', opacity: 0.5 }}>
                    <Cpu size={14} />
                    <span style={{ fontSize: '0.6rem' }}>OLLAMA_LOCAL</span>
                </div>
                <div style={{ display: 'flex', alignContent: 'center', gap: '6px', opacity: 0.5 }}>
                    <Zap size={14} />
                    <span style={{ fontSize: '0.6rem' }}>GHOST_LINK</span>
                </div>
            </div>
        </div>
    );
};
