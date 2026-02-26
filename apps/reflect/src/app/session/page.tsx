'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SoulStream from '@/components/dashboard/SoulStream';
import ActionTiles from '@/components/dashboard/ActionTiles';
import RefractiveWorkstation from '@/components/marketing/RefractiveWorkstation';
import SpatialReflector from '@/components/Reflect/SpatialReflector';
import SystemTour from '@/components/ui/SystemTour';
import ShadowMirror from '@/components/dashboard/ShadowMirror';
import DashboardHero from '@/components/dashboard/DashboardHero';
import JournalVault from '@/components/dashboard/JournalVault';
import AstraCard from '@/components/dashboard/AstraCard';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { NeuralButton } from '@/components/ui/NeuralButton';
import { ProfileIcon } from '@/components/ui/ProfileIcons';
import { ARCHETYPES } from '@/lib/ai/archetypes';
import PhaseSelector, { DashboardPhase } from '@/components/dashboard/PhaseSelector';
import ResonanceField from '@/components/Collective/ResonanceField';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import SynapticGraph from '@/components/Map/SynapticGraph';
import { useNotifications } from '@/context/NotificationContext';
import { useAccount, Tier } from '@/context/AccountContext';
import { useCognitive } from '@/context/CognitiveContext';
import { Zap, Brain } from 'lucide-react';

import { getRandomPrompt, ProtocolType } from '@/lib/ai/prompts';

function SessionDashboardContent() {
    const [showTour, setShowTour] = useState(false);
    const [hasHydrated, setHasHydrated] = useState(false);
    const [activePrompt, setActivePrompt] = useState('');
    const [activeMode, setActiveMode] = useState<ProtocolType>('mindset');
    const [ritualActive, setRitualActive] = useState(false);
    const [isSensing, setIsSensing] = useState(false);
    const [activePhase, setActivePhase] = useState<DashboardPhase>('RITUAL');
    const [showWelcomeSummary, setShowWelcomeSummary] = useState(false);
    const [isResonating, setIsResonating] = useState(false);
    const [resonanceStatus, setResonanceStatus] = useState('Resonating...');

    const { archetype, tier, insights, setInsights, calibrationSnippet } = useAccount();
    const { logInteraction, mood } = useCognitive();
    const phasesList: DashboardPhase[] = ['RITUAL', 'IDENTITY', 'VAULT', 'FIELD'];

    const handleSwipe = (direction: number) => {
        const currentIndex = phasesList.indexOf(activePhase);
        const nextIndex = Math.max(0, Math.min(phasesList.length - 1, currentIndex + direction));
        if (nextIndex !== currentIndex) {
            setActivePhase(phasesList[nextIndex]);
        }
    };

    const searchParams = useSearchParams();

    const { addToast } = useNotifications();

    useEffect(() => {
        setHasHydrated(true);
        if (typeof window !== 'undefined') {
            const isNewAccount = localStorage.getItem('reflect_new_account');
            if (isNewAccount) {
                setIsResonating(true);
                localStorage.removeItem('reflect_new_account');

                // Cinematic Loading Sequence
                const statuses = ['Resonating...', 'Compiling Reflection...', 'Forging Archetype...', 'Stabilizing Neural Kernel...'];
                let i = 0;
                const statusInterval = setInterval(() => {
                    if (i < statuses.length - 1) {
                        i++;
                        setResonanceStatus(statuses[i]);
                    }
                }, 1200);

                setTimeout(() => {
                    clearInterval(statusInterval);
                    setIsResonating(false);
                    setShowWelcomeSummary(true);
                    addToast('System Link Established', 'success');
                }, 5000);

                // Fetch Insights if missing
                if (!insights && archetype) {
                    fetch('/api/insights/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: localStorage.getItem('reflect_username') || 'Unknown Seeker',
                            archetype,
                            tier,
                            calibrationSnippet
                        })
                    }).then(res => res.json()).then(data => {
                        if (data.insights) setInsights(data.insights);
                    }).catch(console.error);
                }
            }
        }
    }, [addToast, insights, archetype, tier, calibrationSnippet, setInsights]);

    const handleProtocolSelect = async (id: ProtocolType, label: string) => {
        setActiveMode(id);
        setIsSensing(true);
        setActivePrompt(''); // Clear current to show sensing

        try {
            const res = await fetch(`/api/prompts/personalized?mode=${id}`);
            const data = await res.json();
            if (data.prompt) {
                setActivePrompt(data.prompt);
            }
        } catch (err) {
            console.error(err);
            // Fallback to static if absolutely necessary
            setActivePrompt(`Let's talk about your ${id}...`);
        } finally {
            setIsSensing(false);
        }
    };

    const handleLaunchRitual = (text: string) => {
        setActivePrompt(text);
        setRitualActive(true);
        logInteraction();
    };

    const finishTour = () => {
        localStorage.removeItem('reflect_start_tutorial');
        setShowTour(false);
    };

    const handleEgress = () => {
        setRitualActive(false);
        setActivePrompt(''); // Reset prefill text field when returning back to dashboard 
    };

    const skipSplash = searchParams.get('noSplash') === 'true';

    if (!hasHydrated && !skipSplash) return <div style={{ minHeight: '100vh', background: '#000' }} />;

    if (isResonating && !skipSplash) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#000',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem'
            }}>
                <div style={{ position: 'relative', width: '300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Veylix Orbital Rings */}
                    {[1, 2, 3].map(ring => (
                        <motion.div
                            key={ring}
                            animate={{
                                rotate: ring % 2 === 0 ? 360 : -360,
                                scale: [1, 1.05, 1],
                                opacity: [0.1, 0.2, 0.1]
                            }}
                            transition={{ duration: 10 + ring * 2, repeat: Infinity, ease: "linear" }}
                            style={{
                                position: 'absolute',
                                width: `${100 + ring * 40}%`,
                                height: `${100 + ring * 40}%`,
                                border: '1px solid rgba(34, 211, 238, 0.1)',
                                borderRadius: '50%',
                            }}
                        />
                    ))}

                    {/* Central Resonance Core (Nova Style) */}
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            boxShadow: [
                                '0 0 50px rgba(34, 211, 238, 0.2)',
                                '0 0 100px rgba(139, 92, 246, 0.4)',
                                '0 0 50px rgba(34, 211, 238, 0.2)'
                            ]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-32 h-32 rounded-[2rem] bg-black/40 backdrop-blur-3xl border border-white/20 flex items-center justify-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 animate-pulse" />
                        <ProfileIcon type={archetype?.icon || 'seeker'} color="white" active size={64} />
                    </motion.div>
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginTop: '3rem',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        letterSpacing: '0.6em',
                        color: 'var(--accent)',
                        textAlign: 'center',
                        textTransform: 'uppercase'
                    }}
                >
                    {resonanceStatus}
                </motion.div>
            </div>
        );
    }

    if (ritualActive) {
        return <SpatialReflector initialPrompt={activePrompt} mode={activeMode} onEgress={handleEgress} />;
    }

    return (
        <>
            {showTour && <SystemTour onComplete={finishTour} />}

            <AnimatePresence>
                {showWelcomeSummary && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 2000,
                            background: 'rgba(0,0,0,0.92)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2rem'
                        }}
                    >
                        <NeuralSurface variant="glass" style={{ maxWidth: '600px', width: '100%', padding: 'clamp(1.5rem, 8vw, 4rem)', textAlign: 'center', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '2rem', right: '2rem', fontSize: '0.6rem', opacity: 0.2, fontWeight: 900, letterSpacing: '0.2rem' }}>WELCOME_SYSTEM_V4.0</div>

                            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center', filter: 'drop-shadow(0 0 20px var(--accent-glow))' }}>
                                <ProfileIcon type={archetype?.icon || 'seeker'} color={archetype?.color || 'var(--accent)'} active={true} size={100} />
                            </div>

                            <h2 style={{ fontSize: '1.5rem', fontWeight: 100, letterSpacing: '0.2em', marginBottom: '2.5rem', color: 'var(--accent)' }}>System Link Initialized</h2>

                            <div style={{ textAlign: 'left', marginBottom: '3rem' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.3, letterSpacing: '0.3em', marginBottom: '1.5rem' }}>NEURAL_SYNTHESIS</div>
                                <p style={{ fontSize: '1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', fontWeight: 300 }}>
                                    {insights || "Synchronizing insights... Your resonance data is being Compiled."}
                                </p>
                            </div>

                            <NeuralButton
                                onClick={() => setShowWelcomeSummary(false)}
                                style={{ width: '100%', padding: '1.2rem' }}
                            >
                                ENTER CORTEX
                            </NeuralButton>
                        </NeuralSurface>
                    </motion.div>
                )}
            </AnimatePresence>



            <StandardPageLayout>
                {/* Hero Section */}
                <DashboardHero />

                {/* Phase Selector */}
                <PhaseSelector activePhase={activePhase} onPhaseChange={setActivePhase} />

                <motion.div
                    style={{
                        width: '100%',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activePhase}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            style={{ width: '100%' }}
                        >
                            {activePhase === 'RITUAL' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    <RefractiveWorkstation
                                        value={activePrompt}
                                        onValueChange={setActivePrompt}
                                        promptMode={activeMode}
                                        onLaunchRitual={handleLaunchRitual}
                                        sensing={isSensing}
                                    />
                                    <ActionTiles onSelect={handleProtocolSelect} />
                                </div>
                            )}

                            {activePhase === 'IDENTITY' && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))',
                                    gap: '1.5rem',
                                    width: '100%'
                                }}>
                                    <NeuralSurface variant="neumorphic" className="p-8 border-none bg-gradient-to-br from-white/[0.02] to-transparent">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500/60">Soul Stream</span>
                                                <span className="text-[8px] font-mono text-white/20 mt-1">REALTIME INPUT SYNC</span>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                                <Zap size={16} className="text-cyan-400" />
                                            </div>
                                        </div>
                                        <SoulStream />
                                    </NeuralSurface>

                                    <NeuralSurface variant="neumorphic" className="p-8 border-none bg-gradient-to-tr from-violet-500/[0.02] to-transparent">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-violet-500/60">The Shadow</span>
                                                <span className="text-[8px] font-mono text-white/20 mt-1">SUBSURFACE ANALYSIS</span>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                                <Brain size={16} className="text-violet-400" />
                                            </div>
                                        </div>
                                        <ShadowMirror />
                                    </NeuralSurface>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <AstraCard />
                                    </div>
                                </div>
                            )}

                            {activePhase === 'VAULT' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <JournalVault />
                                    <NeuralSurface variant="glass" style={{ height: '400px', padding: 0, overflow: 'hidden' }}>
                                        <SynapticGraph />
                                    </NeuralSurface>
                                </div>
                            )}

                            {activePhase === 'FIELD' && (
                                <NeuralSurface variant="glass" style={{ height: '70vh', padding: 0, overflow: 'hidden' }}>
                                    <ResonanceField />
                                </NeuralSurface>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                {/* System Background Depth Layer */}
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: -1,
                    background: 'radial-gradient(circle at 50% 10%, var(--accent-glow) 0%, transparent 70%)',
                    pointerEvents: 'none',
                    opacity: 0.4
                }} />
            </StandardPageLayout>
        </>
    );
}

export default function SessionPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', opacity: 0.2, fontWeight: 900, letterSpacing: '0.5em', fontSize: '0.6rem' }}>SYNCHRONIZING_CORTEX...</div>}>
            <SessionDashboardContent />
        </Suspense>
    );
}
