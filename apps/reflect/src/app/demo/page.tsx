'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { NeuralButton } from '@/components/ui/NeuralButton';
import { NeuralSurface } from '@/components/ui/NeuralSurface';


const PROTOCOLS = [
    {
        id: 'unclutter',
        title: 'Unclutter Mind',
        description: 'Rapid dump of surface thoughts to clear mental RAM.',
        icon: '🌪️',
        color: '#3b82f6', // Blue
        prompt: "What's on your mind right now? Don't overthink, just dump it."
    },
    {
        id: 'pattern',
        title: 'Decode Pattern',
        description: 'Analyze recurring behaviors or loops.',
        icon: '🧬',
        color: '#8b5cf6', // Violet
        prompt: "Describe a situation that feels like 'Déjà vu' or a loop you're stuck in."
    },
    {
        id: 'signal',
        title: 'Find Signal',
        description: 'Isolate the core insight from the noise.',
        icon: '📡',
        color: '#10b981', // Emerald
        prompt: "What is the one thing you know is true, amidst the confusion?"
    }
];

export default function DemoPage() {
    const [selected, setSelected] = useState<string | null>(null);
    const [simulating, setSimulating] = useState(false);
    const router = useRouter();

    const handleSelect = (id: string) => {
        setSelected(id);
    };

    const runSimulation = async () => {
        if (!selected) return;
        setSimulating(true);

        try {
            const protocol = PROTOCOLS.find(p => p.id === selected);
            const res = await fetch('/api/demo/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: protocol?.prompt || "Standard Demo Reflection",
                    mode: 'mindset',
                    persona: 'sage'
                })
            });
            const data = await res.json();

            // Artificial delay to show simulation steps
            setTimeout(() => {
                router.push('/login?demo=' + selected);
            }, 4500);
        } catch (e) {
            setSimulating(false);
            alert("Simulation failed. Neural link unstable.");
        }
    };


    return (
        <main style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-sans)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Atmosphere */}
            <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle at 50% 50%, rgba(74, 158, 255, 0.05) 0%, transparent 50%)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            <div style={{ zIndex: 1, textAlign: 'center', maxWidth: '1200px', width: '100%', padding: '2rem' }}>
                <Link href="/" style={{
                    position: 'absolute',
                    top: '40px',
                    left: '40px',
                    color: '#666',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    ← EXIT DEMO
                </Link>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        fontWeight: 200,
                        letterSpacing: '-0.02em',
                        marginBottom: '1rem',
                        color: '#eee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem'
                    }}
                >
                    Select Neural Protocol
                    <span style={{
                        fontSize: '0.7rem',
                        padding: '4px 10px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        color: '#666',
                        fontWeight: 700,
                        letterSpacing: '0.1em'
                    }}>LIMITED TRIAL</span>
                    <span style={{
                        fontSize: '0.65rem',
                        padding: '4px 10px',
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.35)',
                        borderRadius: '999px',
                        color: '#fbbf24',
                        fontWeight: 800,
                        letterSpacing: '0.2em'
                    }}>SIMULATION</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    style={{ color: '#888', marginBottom: '4rem', fontSize: '1.2rem', fontWeight: 300 }}
                >
                    Choose a cognitive lens to begin the simulation.
                </motion.p>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem',
                    justifyContent: 'center',
                    justifyItems: 'center'
                }}>
                    {PROTOCOLS.map((p, i) => (
                        <NeuralSurface
                            key={p.id}
                            variant={selected === p.id ? 'glass' : 'ghost'}
                            style={{
                                padding: '2.5rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                                width: '100%',
                                maxWidth: '350px',
                                border: selected === p.id ? `1px solid ${p.color}` : undefined,
                                transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                            }}
                            onClick={() => handleSelect(p.id)}
                        >
                            <div style={{ fontSize: '3rem', marginBottom: '1.5rem', filter: selected === p.id ? 'grayscale(0%)' : 'grayscale(100%)', transition: 'filter 0.4s' }}>{p.icon}</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>{p.title}</h3>
                            <p style={{ color: '#888', fontSize: '0.95rem', lineHeight: 1.6 }}>{p.description}</p>
                        </NeuralSurface>
                    ))}

                </div>

                <AnimatePresence>
                    {selected && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            style={{
                                position: 'fixed',
                                bottom: '0',
                                left: '0',
                                width: '100%',
                                padding: '2rem',
                                background: 'linear-gradient(to top, #000 20%, transparent)',
                                display: 'flex',
                                justifyContent: 'center',
                                pointerEvents: 'none' // Allow clicking through upper parts
                            }}
                        >
                            <NeuralButton
                                onClick={runSimulation}
                                isLoading={simulating}
                                variant="primary"
                                size="lg"
                                glow={true}
                                style={{ pointerEvents: 'auto', padding: '1.2rem 4rem' }}
                            >
                                {simulating ? 'INITIALIZING NEURAL BRIDGE...' : 'INITIALIZE SIMULATION'}
                            </NeuralButton>

                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Simulation Overlay */}
                <AnimatePresence>
                    {simulating && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: '#000',
                                zIndex: 9999,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#0f0',
                                fontFamily: 'monospace'
                            }}
                        >
                            <div style={{ width: '60%', maxWidth: '600px' }}>
                                <p>{'>'} DETECTING PATTERNS...</p>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                >{'>'} ANALYZING SEMANTIC VECTORS...</motion.p>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.6 }}
                                >{'>'} CONSTRUCTING REFLECTION...</motion.p>
                                <br />
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 2.2 }}
                                    style={{ color: '#fff' }}
                                >
                                    To save this session and view the insight, a secure profile is required.
                                </motion.p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
