'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralSurface } from '../ui/NeuralSurface';

interface Blindspot {
    id: string;
    type: string;
    description: string;
    intensity: number; // 0-1
}

export default function ShadowMirror() {
    const [blindspots, setBlindspots] = useState<Blindspot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [metabolicProgress, setMetabolicProgress] = useState(0);
    const [isSimulated, setIsSimulated] = useState(false);

    useEffect(() => {
        const fetchBlindspots = async () => {
            try {
                const res = await fetch('/api/patterns/detect', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    const patterns = (data.patterns || data.blindspots || []).map((p: any, i: number) => ({
                        id: p.id || String(i + 1),
                        type: p.type || p.name || 'Pattern_' + (i + 1),
                        description: p.description || p.insight || 'Pattern detected in recent entries.',
                        intensity: p.intensity || p.confidence || p.score || 0.5,
                    }));
                    setBlindspots(patterns);
                    // Metabolic progress based on how many patterns have been addressed
                    const avgIntensity = patterns.length > 0
                        ? patterns.reduce((sum: number, p: Blindspot) => sum + p.intensity, 0) / patterns.length
                        : 0;
                    setMetabolicProgress(Math.round((1 - avgIntensity) * 100));
                } else {
                    setIsSimulated(true);
                }
            } catch {
                setIsSimulated(true);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBlindspots();
    }, []);

    return (
        <NeuralSurface variant="glass" style={{ padding: '3rem', height: '100%', minHeight: '350px', background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: '32px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#ff6b6b', letterSpacing: '0.4em', opacity: 0.8 }}>NEURAL_ENGINE // BLINDSPOTS</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isSimulated && (
                        <span style={{ fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.3em', padding: '0.35rem 0.6rem', borderRadius: '999px', border: '1px solid rgba(255,107,107,0.35)', color: '#ffb3b3', background: 'rgba(255,107,107,0.08)' }}>
                            SIMULATED
                        </span>
                    )}
                    <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#ff6b6b',
                        boxShadow: '0 0 15px rgba(255, 107, 107, 0.5)'
                    }} />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {isLoading ? (
                    <div style={{ opacity: 0.15, fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.2em', textAlign: 'center', padding: '2rem' }}>SCANNING_NEURAL_RECURSIONS...</div>
                ) : (
                    blindspots.map((bs, i) => (
                        <motion.div
                            key={bs.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                padding: '1.8rem',
                                background: 'rgba(255, 107, 107, 0.03)',
                                border: '1px solid rgba(255, 107, 107, 0.12)',
                                borderRadius: '20px',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#ff6b6b', letterSpacing: '0.15em' }}>{bs.type.toUpperCase()}</span>
                                <span style={{ fontSize: '0.6rem', color: 'var(--foreground)', opacity: 0.2, fontWeight: 900 }}>{Math.round(bs.intensity * 100)}% MATCH</span>
                            </div>
                            <p style={{ fontSize: '1rem', color: 'var(--foreground)', opacity: 0.7, fontWeight: 300, lineHeight: 1.6, margin: 0 }}>
                                {bs.description}
                            </p>
                        </motion.div>
                    ))
                )}

                {!isLoading && blindspots.length === 0 && (
                    <div style={{ opacity: 0.2, fontSize: '0.85rem', fontWeight: 300, textAlign: 'center', padding: '3rem' }}>No significant blindspots detected in current cycle. Stay vigilant.</div>
                )}
            </div>

            {/* Metabolic Progress */}
            <div style={{ marginTop: 'auto', paddingTop: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--foreground)', opacity: 0.2, letterSpacing: '0.25em' }}>METABOLIC_DIGESTION</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 900, letterSpacing: '0.1em' }}>
                        {metabolicProgress > 70 ? 'STABLE_COGNITION' : metabolicProgress > 40 ? 'PROCESSING' : 'INTEGRATING'}
                    </span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'var(--surface-higher)', borderRadius: '100px', overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${metabolicProgress}%` }}
                        transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #ff6b6b, var(--accent))', boxShadow: '0 0 15px var(--accent-glow)' }}
                    />
                </div>
            </div>
        </NeuralSurface>
    );
}
