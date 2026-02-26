'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import SubPageSelector, { SubPageTab } from '@/components/ui/SubPageSelector';
import InsightsCharts from '@/components/InsightsCharts';
import SynapticGraph from '@/components/Map/SynapticGraph';
import MindGraph from './MindGraph';

interface InsightsClientProps {
    total: number;
    streak: string;
    modeData: any[];
    activityData: any[];
    biometricData?: any[];
    isSimulated?: boolean;
}

const INSIGHTS_TABS: SubPageTab[] = [
    { id: 'growth', label: 'Growth', icon: '📈' },
    { id: 'cognitive', label: 'Cognitive', icon: '🕸️' },
    { id: 'patterns', label: 'Patterns', icon: '🧬' },
    { id: 'terminal', label: 'Terminal', icon: '⌨️' }
];

export default function InsightsClient({ total, streak, modeData, activityData, biometricData = [], isSimulated = false }: InsightsClientProps) {
    const [activeTab, setActiveTab] = useState('growth');
    const [vizMode, setVizMode] = useState<'2d' | '3d'>('2d');
    const simulatedTabs = new Set(['terminal']);
    const showSimulated = isSimulated || simulatedTabs.has(activeTab);

    const renderContent = () => {
        switch (activeTab) {
            case 'growth':
                return <InsightsCharts modeData={modeData} activityData={activityData} biometricData={biometricData} />;
            case 'cognitive':
                return (
                    <NeuralSurface variant="glass" style={{ height: '70vh' }}>
                        <div style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 10, display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setVizMode('2d')}
                                style={{
                                    background: vizMode === '2d' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                    color: vizMode === '2d' ? '#000' : '#fff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '0.6rem 1.2rem',
                                    fontSize: '0.65rem',
                                    fontWeight: 900,
                                    letterSpacing: '0.15em',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                2D_SYNAPSE
                            </button>
                            <button
                                onClick={() => setVizMode('3d')}
                                style={{
                                    background: vizMode === '3d' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                    color: vizMode === '3d' ? '#000' : '#fff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '0.6rem 1.2rem',
                                    fontSize: '0.65rem',
                                    fontWeight: 900,
                                    letterSpacing: '0.15em',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                3D_CONSTELLATION
                            </button>
                        </div>
                        {vizMode === '2d' ? <SynapticGraph /> : <MindGraph />}
                    </NeuralSurface>
                );
            case 'patterns':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        <NeuralSurface variant="glass" style={{ padding: '2.5rem' }}>
                            <h3 style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.2em', opacity: 0.4, marginBottom: '1.5rem' }}>SYNAPTIC RECURSION</h3>
                            <p style={{ fontSize: '1.1rem', fontWeight: 200, lineHeight: 1.6 }}>
                                {total > 0
                                    ? `${total} entries analyzed across your journal history. ${streak} active engagement detected.`
                                    : 'Begin journaling to unlock pattern analysis across your entries.'}
                            </p>
                        </NeuralSurface>
                        <NeuralSurface variant="glass" style={{ padding: '2.5rem' }}>
                            <h3 style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.2em', opacity: 0.4, marginBottom: '1.5rem' }}>EMOTIONAL HARMONICS</h3>
                            <p style={{ fontSize: '1.1rem', fontWeight: 200, lineHeight: 1.6 }}>
                                {modeData.length > 0
                                    ? `Most active mode: ${modeData.reduce((a: any, b: any) => a.value > b.value ? a : b).name}. ${modeData.length} distinct modes tracked.`
                                    : 'Mode data will populate as you continue your reflection practice.'}
                            </p>
                        </NeuralSurface>
                    </div>
                );
            case 'terminal':
                return (
                    <NeuralSurface variant="glass" style={{
                        background: '#000',
                        padding: '2rem',
                        fontFamily: 'monospace',
                        height: '60vh',
                        fontSize: '0.8rem',
                        color: 'var(--accent)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        overflowY: 'auto'
                    }}>
                        <div>[ SYSTEM_READY ]</div>
                        <div>{">"} Loading reflect_os v4.1...</div>
                        <div>{">"} Synaptic buffer: 4096KB initialized.</div>
                        <div>{">"} Current User: Seeker_Resonant</div>
                        <div style={{ marginTop: '2rem', color: '#fff', opacity: 0.5 }}>$ _</div>
                    </NeuralSurface>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '3rem' }}>
                <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.45em', marginBottom: '0.8rem' }}>ANALYTIC ENGINE</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 100, letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>Insights</h1>
                        {showSimulated && (
                            <span style={{ fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.35em', padding: '0.35rem 0.6rem', borderRadius: '999px', border: '1px solid var(--border-subtle)', color: 'var(--foreground)', opacity: 0.6, background: 'var(--surface-lower)' }}>
                                SIMULATED
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 100, display: 'block', lineHeight: 1, letterSpacing: '-0.05em' }}>{total}</span>
                    <span style={{ color: 'var(--accent)', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.2em' }}>SYNAPSES CLOSED</span>
                </div>
            </div>

            <SubPageSelector
                tabs={INSIGHTS_TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                accentColor="var(--accent)"
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
