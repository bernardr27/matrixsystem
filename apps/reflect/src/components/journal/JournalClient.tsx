'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { NeuralButton } from '@/components/ui/NeuralButton';
import SubPageSelector, { SubPageTab } from '@/components/ui/SubPageSelector';
import OracleChat from '@/components/Oracle/OracleChat';
import { cn } from '@/lib/utils';
import { Lock, Sparkles, Globe, BookOpen } from 'lucide-react';

interface JournalEntry {
    id: string;
    created_at: string;
    initial_input: string;
    mode: string;
    unlock_at?: string;
    image_url?: string;
}

interface JournalClientProps {
    initialSessions: JournalEntry[];
}

const JOURNAL_TABS: SubPageTab[] = [
    { id: 'oracle', label: 'Oracle', icon: '🔮' },
    { id: 'records', label: 'Records', icon: '📖' },
    { id: 'insights', label: 'Insights', icon: '✨' },
    { id: 'collective', label: 'Collective', icon: '🌐' }
];

export default function JournalClient({ initialSessions }: JournalClientProps) {
    const [activeTab, setActiveTab] = useState('oracle');

    const renderContent = () => {
        switch (activeTab) {
            case 'oracle':
                return <OracleChat />;
            case 'records':
                return (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                            paddingBottom: '6rem',
                            width: '100%'
                        }}
                    >
                        {initialSessions.map((session, idx) => {
                            const isLocked = session.unlock_at && new Date(session.unlock_at) > new Date();
                            const color = `var(--mode-${session.mode})`;

                            return (
                                <motion.div
                                    key={session.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    style={{ width: '100%' }}
                                >
                                    <NeuralSurface
                                        variant="glass"
                                        hoverEffect
                                        style={{
                                            borderRadius: '24px',
                                            overflow: 'hidden',
                                            padding: 0,
                                            border: '1px solid rgba(255,255,255,0.08)'
                                        }}
                                    >
                                        {/* Image Header */}
                                        <div style={{
                                            height: '140px',
                                            width: '100%',
                                            background: 'rgba(0,0,0,0.3)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {session.image_url ? (
                                                <div style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    backgroundImage: `url(${session.image_url})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    opacity: 0.8
                                                }} />
                                            ) : (
                                                <div style={{ fontSize: '3rem', opacity: 0.1, fontWeight: 100 }}>⌬</div>
                                            )}

                                            {/* Mode Badge */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '12px',
                                                left: '12px',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                background: 'rgba(0,0,0,0.6)',
                                                backdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                fontSize: '0.6rem',
                                                fontWeight: 800,
                                                letterSpacing: '0.15em',
                                                textTransform: 'uppercase',
                                                color: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
                                                {session.mode}
                                            </div>

                                            {isLocked && (
                                                <div style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    background: 'rgba(0,0,0,0.6)',
                                                    backdropFilter: 'blur(4px)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Lock size={24} color="rgba(255,255,255,0.5)" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div style={{ padding: '1.5rem', position: 'relative' }}>
                                            <time style={{
                                                display: 'block',
                                                fontSize: '0.6rem',
                                                fontWeight: 700,
                                                opacity: 0.4,
                                                marginBottom: '0.5rem',
                                                letterSpacing: '0.1em',
                                                textTransform: 'uppercase'
                                            }}>
                                                {new Date(session.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </time>

                                            <p style={{
                                                fontSize: '0.95rem',
                                                lineHeight: 1.6,
                                                fontWeight: 300,
                                                color: 'rgba(255,255,255,0.9)',
                                                margin: '0 0 1.5rem 0',
                                                opacity: isLocked ? 0.5 : 1,
                                                filter: isLocked ? 'blur(4px)' : 'none'
                                            }}>
                                                {isLocked ? "ENCRYPTED_CONTENT" : session.initial_input}
                                            </p>

                                            {!isLocked && (
                                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                    <NeuralButton
                                                        href={`/journal/${session.id}`}
                                                        variant="ghost"
                                                        style={{
                                                            fontSize: '0.65rem',
                                                            padding: '8px 16px',
                                                            opacity: 0.6
                                                        }}
                                                    >
                                                        OPEN RECORD →
                                                    </NeuralButton>
                                                </div>
                                            )}
                                        </div>
                                    </NeuralSurface>
                                </motion.div>
                            );
                        })}

                        {initialSessions.length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                padding: '4rem 0',
                                opacity: 0.2,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <BookOpen size={40} strokeWidth={1} />
                                <span style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.3em' }}>NO_RECORDS</span>
                            </div>
                        )}
                    </motion.div>
                );
            case 'insights':
                return (
                    <NeuralSurface variant="glass" style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', minHeight: '300px', justifyContent: 'center' }}>
                        <Sparkles size={32} style={{ opacity: 0.5 }} />
                        <h3 style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.3em', opacity: 0.5 }}>SYNAPTIC_INSIGHTS</h3>
                        <p style={{ fontSize: '0.9rem', opacity: 0.3, maxWidth: '280px', lineHeight: 1.6 }}>Aggregating neural patterns...</p>
                    </NeuralSurface>
                );
            case 'collective':
                return (
                    <NeuralSurface variant="glass" style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', minHeight: '300px', justifyContent: 'center' }}>
                        <Globe size={32} style={{ opacity: 0.5 }} />
                        <h3 style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.3em', opacity: 0.5 }}>GLOBAL_RESONANCE</h3>
                        <p style={{ fontSize: '0.9rem', opacity: 0.3, maxWidth: '280px', lineHeight: 1.6 }}>Synchronizing with the field...</p>
                    </NeuralSurface>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <SubPageSelector
                tabs={JOURNAL_TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                accentColor="var(--accent)"
            />
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
