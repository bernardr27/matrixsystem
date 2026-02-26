'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import NeuralPulse from '../ui/NeuralPulse';
import PatternInsights from '../PatternInsights/PatternInsights';
import { NeuralSurface } from '../ui/NeuralSurface';
import { NeuralButton } from '../ui/NeuralButton';

type Stage = 'void' | 'mirror' | 'forge' | 'bloom' | 'dissolve';

interface SpatialReflectorProps {
    initialPrompt?: string;
    mode: string;
    onEgress: () => void;
}

export default function SpatialReflector({ initialPrompt = '', mode, onEgress }: SpatialReflectorProps) {
    const [stage, setStage] = useState<Stage>('void');
    const [input, setInput] = useState(initialPrompt);
    const [analysis, setAnalysis] = useState<any>(null);
    const [resolution, setResolution] = useState('');
    const [synthesis, setSynthesis] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resonance, setResonance] = useState<string[]>([]);
    const [debouncedInput, setDebouncedInput] = useState(initialPrompt);
    const [debouncedResolution, setDebouncedResolution] = useState('');
    const [viewportOffset, setViewportOffset] = useState({ top: 0, right: 0 });
    const router = useRouter();

    useEffect(() => {
        const handleViewportChange = () => {
            if (window.visualViewport) {
                // Offset from the top-right of the visual viewport
                setViewportOffset({
                    top: window.visualViewport.offsetTop,
                    right: window.innerWidth - (window.visualViewport.offsetLeft + window.visualViewport.width)
                });
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
            window.visualViewport.addEventListener('scroll', handleViewportChange);
        }
        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleViewportChange);
                window.visualViewport.removeEventListener('scroll', handleViewportChange);
            }
        };
    }, []);

    useEffect(() => {
        // Fetch historical resonance for THE_FORGE
        const fetchResonance = async () => {
            const { data } = await createClient()
                .from('sessions')
                .select('initial_input')
                .limit(5);
            if (data) setResonance(data.map((d: any) => d.initial_input));
        };
        fetchResonance();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedInput(input);
        }, 800);
        return () => clearTimeout(timer);
    }, [input]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedResolution(resolution);
        }, 800);
        return () => clearTimeout(timer);
    }, [resolution]);

    const handleInitiateAnalysis = async () => {
        if (!input.trim()) return;
        setIsProcessing(true);
        setAnalysis({ reframe: "" }); // Reset for streaming
        setStage('mirror');

        try {
            const res = await fetch('/api/session/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: input, mode, stream: true })
            });

            if (!res.body) throw new Error('No readable stream');
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulated += chunk;

                // Optimized parsing for Ollama/Local streams
                try {
                    // Start often sends partial JSON. We attempt to parse or just extraction
                    const clean = accumulated.trim();
                    if (clean.startsWith('{') && clean.endsWith('}')) {
                        const parsed = JSON.parse(clean);
                        setAnalysis(parsed);
                    } else {
                        // Incremental feedback for reframe if direct JSON isn't available yet
                        setAnalysis({ reframe: accumulated });
                    }
                } catch (e) {
                    // If it's partial JSON, just keep accumulating
                    setAnalysis({ reframe: accumulated });
                }
            }

            // Final parse attempt for safety
            try {
                const final = JSON.parse(accumulated);
                setAnalysis(final);
            } catch (e) { }

        } catch (err) {
            console.error("Neural Stream Failure:", err);
            setAnalysis({ reframe: "Synthesis interrupted. Re-centering..." });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleInitiateSynthesis = async () => {
        if (!resolution.trim()) return;
        setIsProcessing(true);
        setSynthesis(""); // Reset for streaming
        setStage('bloom');

        try {
            const res = await fetch('/api/session/synthesis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({
                    originalInput: input,
                    aiInsights: analysis.reframe,
                    userResolution: resolution,
                    mode
                })
            });

            if (!res.body) throw new Error('No synthesis stream');
            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                setSynthesis(prev => (prev || "") + chunk);
            }
        } catch (err) {
            console.error("Synthesis Stream Failure:", err);
            setStage('dissolve');
        } finally {
            setIsProcessing(false);
        }
    };

    const stageMeta: Record<Stage, { bg: string; title: string }> = {
        void: { bg: 'radial-gradient(circle at 50% 0%, #171E2B 0%, #0B0E14 80%)', title: "What's surfacing?" },
        mirror: { bg: 'radial-gradient(circle at 50% 0%, #1E293B 0%, #0B0E14 80%)', title: "A New Perspective" },
        forge: { bg: 'radial-gradient(circle at 50% 0%, #312E81 0%, #0B0E14 80%)', title: "Deep Reflection" },
        bloom: { bg: 'radial-gradient(circle at 50% 0%, #064E3B 0%, #0B0E14 80%)', title: "Equilibrium Found" },
        dissolve: { bg: '#0B0E14', title: "Peace Found" }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 5000,
            background: stageMeta[stage].bg,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transition: 'background 2s ease'
        }}>
            {/* Background Particles / Pulse */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.1 }}>
                <NeuralPulse speed={stage === 'void' ? 0.3 : 1} opacity={0.5} />
            </div>

            {/* Global Exit Control */}
            {stage !== 'dissolve' && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{
                        opacity: 1,
                        x: 0,
                        top: `calc(1.5rem + ${viewportOffset.top}px)`,
                        right: `calc(1.5rem + ${viewportOffset.right}px)`
                    }}
                    style={{ position: 'fixed', zIndex: 6000 }}
                >
                    <NeuralButton variant="ghost" size="sm" onClick={onEgress}>EXIT_SESSION</NeuralButton>
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={stage}
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 1.02 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        width: '100%',
                        maxWidth: '800px',
                        padding: '2rem',
                        position: 'relative',
                        zIndex: 10,
                        textAlign: 'center'
                    }}
                >
                    {/* STAGE: VOID */}
                    {stage === 'void' && (
                        <>
                            <h2 style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', fontWeight: 100, color: '#fff', marginBottom: '3rem', letterSpacing: '-0.02em' }}>
                                What's surfacing for you?
                            </h2>
                            <motion.div
                                className="w-full bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-[2rem] p-6 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all focus-within:bg-white/[0.04] focus-within:border-white/[0.1] focus-within:shadow-[0_0_40px_rgba(45,212,191,0.15)] flex flex-col justify-center"
                                style={{ minHeight: '200px' }}
                            >
                                <textarea
                                    autoFocus
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleInitiateAnalysis()}
                                    placeholder="..."
                                    className="w-full bg-transparent border-none text-white text-center outline-none resize-none placeholder-white/20"
                                    style={{
                                        fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
                                    }}
                                />
                            </motion.div>
                            <div style={{ marginTop: '3rem' }}>
                                <NeuralButton className="rounded-full px-8 py-4 shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:shadow-[0_0_30px_rgba(45,212,191,0.4)]" onClick={handleInitiateAnalysis} disabled={isProcessing || !input.trim()}>
                                    {isProcessing ? 'SCANNING...' : 'SHARE THOUGHT'}
                                </NeuralButton>
                            </div>
                            {debouncedInput.length > 20 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '4rem' }}>
                                    <PatternInsights text={debouncedInput} />
                                </motion.div>
                            )}
                        </>
                    )}

                    {/* STAGE: MIRROR */}
                    {stage === 'mirror' && (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                                <div className="text-white/40 text-lg font-light italic leading-relaxed px-4">{input}</div>
                                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-[2rem] p-8 sm:p-12 text-left shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
                                    <div className="text-[10px] font-black tracking-[0.4em] mb-6 text-cyan-400/50">A NEW PERSPECTIVE</div>
                                    <p className="text-xl sm:text-2xl font-light text-white leading-relaxed m-0">{analysis.reframe}</p>
                                </div>
                            </div>
                            <div style={{ marginTop: '4rem' }}>
                                <NeuralButton className="rounded-full px-8 py-4 shadow-[0_0_20px_rgba(56,189,248,0.2)] hover:shadow-[0_0_30px_rgba(56,189,248,0.4)]" onClick={() => setStage('forge')}>SIT WITH THIS</NeuralButton>
                            </div>
                        </>
                    )}

                    {/* STAGE: FORGE */}
                    {stage === 'forge' && (
                        <>
                            {resonance.map((text, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: Math.random() * 400 - 200, y: Math.random() * 400 - 200 }}
                                    animate={{ opacity: 0.05 }}
                                    style={{ position: 'absolute', fontSize: '0.7rem', color: '#fff', whiteSpace: 'nowrap', pointerEvents: 'none' }}
                                >
                                    {text}
                                </motion.div>
                            ))}
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 100, color: '#fff', marginBottom: '3rem' }}>Where do we go from here?</h2>
                            <motion.div
                                className="w-full bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-[2rem] p-6 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all focus-within:bg-white/[0.04] focus-within:border-white/[0.1] focus-within:shadow-[0_0_40px_rgba(139,92,246,0.15)] flex flex-col justify-center"
                                style={{ minHeight: '200px' }}
                            >
                                <textarea
                                    autoFocus
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    placeholder="How does this change things?..."
                                    className="w-full bg-transparent border-none text-white text-center outline-none resize-none placeholder-white/20"
                                    style={{
                                        fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
                                    }}
                                />
                            </motion.div>
                            <div style={{ marginTop: '3rem' }}>
                                <NeuralButton className="rounded-full px-8 py-4 shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]" onClick={handleInitiateSynthesis} disabled={isProcessing || !resolution.trim()}>
                                    {isProcessing ? 'WEAVING...' : 'FIND PEACE'}
                                </NeuralButton>
                            </div>
                        </>
                    )}

                    {/* STAGE: BLOOM */}
                    {stage === 'bloom' && (
                        <>
                            <div style={{ opacity: 0.3, fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.4em', marginBottom: '2rem' }}>YOUR_NEW_TRUTH</div>
                            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 backdrop-blur-3xl border border-emerald-500/20 rounded-[2rem] p-10 sm:p-14 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative">
                                <p style={{
                                    fontSize: 'clamp(1.5rem, 6vw, 2.8rem)',
                                    fontWeight: 100,
                                    color: '#fff',
                                    lineHeight: 1.4,
                                    margin: 0,
                                    fontStyle: 'italic'
                                }}>&quot;{synthesis}&quot;</p>
                            </div>
                            <div style={{ marginTop: '5rem' }}>
                                <NeuralButton className="rounded-full px-8 py-4 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]" onClick={() => setStage('dissolve')}>STEP FORWARD</NeuralButton>
                            </div>
                        </>
                    )}

                    {/* STAGE: DISSOLVE */}
                    {stage === 'dissolve' && (
                        <>
                            <h1 style={{ fontSize: '3rem', fontWeight: 100, color: '#fff', marginBottom: '4rem' }}>Peace Found</h1>
                            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                                <NeuralButton variant="ghost" onClick={() => router.push('/session')}>DASHBOARD</NeuralButton>
                                <NeuralButton onClick={() => window.location.reload()}>NEW SESSION</NeuralButton>
                            </div>
                        </>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
