'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { NeuralButton } from '@/components/ui/NeuralButton';
import SubPageSelector, { SubPageTab } from '@/components/ui/SubPageSelector';
import NeuralPulse from '@/components/ui/NeuralPulse';

const ARCHETYPES = [
    {
        id: 'anchoring',
        name: 'STASIS ANCHOR',
        desc: 'The tendency to rely on the first signal received, tethering the cognition to a fixed point in the void.',
        color: '#3b82f6',
        geometry: 'M 50 20 L 80 80 L 20 80 Z'
    },
    {
        id: 'confirmation',
        name: 'ECHO MIRROR',
        desc: 'The mind seeking its own reflection in the noise, amplifying existing structural resonance while filtering dissonance.',
        color: '#10b981',
        geometry: 'M 20 20 Q 50 80 80 20'
    }
];

const PATTERN_TABS: SubPageTab[] = [
    { id: 'archetypes', label: 'Archetypes', icon: '🎭' },
    { id: 'recursions', label: 'Recursions', icon: '🌀' },
    { id: 'library', label: 'Library', icon: '📚' },
    { id: 'simulation', label: 'Sim', icon: '🧪' }
];

export default function PatternsClient() {
    const [activeTab, setActiveTab] = useState('archetypes');
    const [selected, setSelected] = useState<any>(null);
    const simulatedTabs = new Set(['recursions', 'library', 'simulation']);

    const renderContent = () => {
        switch (activeTab) {
            case 'archetypes':
                return (
                    <section style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '2.5rem',
                        width: '100%'
                    }}>
                        {ARCHETYPES.map((arch) => (
                            <motion.div
                                key={arch.id}
                                whileHover={{ y: -10, scale: 1.01 }}
                                onClick={() => setSelected(arch)}
                            >
                                <NeuralSurface variant="glass" style={{
                                    padding: '3.5rem',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '2.5rem',
                                    borderRadius: '40px'
                                }}>
                                    <div style={{ width: '120px', height: '120px' }}>
                                        <svg viewBox="0 0 100 100">
                                            <motion.path d={arch.geometry} stroke={arch.color} strokeWidth="1.5" fill="none" />
                                        </svg>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <h3 style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.3em', marginBottom: '1.2rem' }}>{arch.name}</h3>
                                        <p style={{ fontSize: '0.95rem', opacity: 0.4, fontWeight: 300, lineHeight: 1.7 }}>{arch.desc}</p>
                                    </div>
                                </NeuralSurface>
                            </motion.div>
                        ))}
                    </section>
                );
            case 'recursions':
                return (
                    <NeuralSurface variant="glass" style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🌀</div>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.3em', opacity: 0.5 }}>COGNITIVE LOOPS</h3>
                        <p style={{ opacity: 0.3, marginTop: '1rem' }}>Analyzing recurring thought structures...</p>
                    </NeuralSurface>
                );
            case 'library':
                return (
                    <NeuralSurface variant="glass" style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.3em', opacity: 0.5 }}>MENTAL MODELS</h3>
                        <p style={{ opacity: 0.3, marginTop: '1rem' }}>Accessing the global cognitive archive...</p>
                    </NeuralSurface>
                );
            case 'simulation':
                return (
                    <NeuralSurface variant="glass" style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🧪</div>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.3em', opacity: 0.5 }}>NEURAL SIMULATION</h3>
                        <p style={{ opacity: 0.3, marginTop: '1rem' }}>Modeling cognitive shifts in hypothetical scenarios...</p>
                    </NeuralSurface>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
            <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.2, letterSpacing: '0.4em' }}>COGNITIVE ARCHIVE // MENTAL MODES</span>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: 'clamp(1.8rem, 8vw, 4rem)', fontWeight: 100, marginTop: '1rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Artifacts of Thought</h1>
                    {simulatedTabs.has(activeTab) && (
                        <span style={{ fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.35em', padding: '0.35rem 0.6rem', borderRadius: '999px', border: '1px solid var(--border-subtle)', color: 'var(--foreground)', opacity: 0.6, background: 'var(--surface-lower)', marginTop: '1.1rem' }}>
                            SIMULATED
                        </span>
                    )}
                </div>
            </header>

            <SubPageSelector
                tabs={PATTERN_TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(30px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
                        onClick={() => setSelected(null)}
                    >
                        <NeuralSurface variant="glass" style={{ padding: '4rem', textAlign: 'center', maxWidth: '600px', borderRadius: '48px' }}>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 100, marginBottom: '1.5rem' }}>{selected.name}</h2>
                            <p style={{ opacity: 0.5, lineHeight: 1.8, marginBottom: '2.5rem' }}>{selected.desc}</p>
                            <NeuralButton onClick={() => setSelected(null)}>DISMISS</NeuralButton>
                        </NeuralSurface>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
