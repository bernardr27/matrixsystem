'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReflectMode, ReflectResponse } from '@/lib/ai/types';
import { useAmbient } from '@/lib/hooks/useAmbient';
import { useZen } from '@/lib/hooks/useZen';
import { useAudioResonance } from '@/lib/hooks/useAudioResonance';
import ArtCanvas from '@/components/ArtCanvas';
import { useRouter } from 'next/navigation';

import DailyPromptBanner from '@/components/DailyPrompt/DailyPromptBanner';
import MiniGameLauncher from '@/components/MiniGames/MiniGameLauncher';
import { SessionTemplates } from '@/components/SessionTemplates';
import PatternInsights from '@/components/PatternInsights/PatternInsights';
import PersonalizedPrompts from '@/components/PersonalizedPrompts/PersonalizedPrompts';
import SageCompanion from '@/components/SageCompanion/SageCompanion';
import NeuralPulse from '@/components/ui/NeuralPulse';
import NeuralVoice from '@/components/voice/NeuralVoice';
import { createClient } from '@/lib/supabase/client';
import { SentinelLogger } from '@/lib/sentinel/logger';
import { useAccount } from '@/context/AccountContext';
import { NeuralResonance } from '@/components/Reflect/NeuralResonance';
import { useNeuralSync } from '@/lib/hooks/useNeuralSync';

import styles from './ReflectSession.module.css';

type SessionStep = 'input' | 'processing' | 'reflect' | 'synthesis' | 'complete';

export default function ReflectSession({
    initialPrompt,
    initialMode,
    onEgress
}: {
    initialPrompt?: string,
    initialMode?: string,
    onEgress?: () => void
}) {
    const { tier, hasAccess } = useAccount();
    const router = useRouter();
    const [step, setStep] = useState<SessionStep>('input');
    const [mode, setMode] = useState<ReflectMode>((initialMode as ReflectMode) || 'mindset');
    const [persona, setPersona] = useState<any>('sage');
    const [input, setInput] = useState(initialPrompt || '');
    const [response, setResponse] = useState<(ReflectResponse & { sessionId?: string, resonance?: string }) | null>(null);
    const [resolution, setResolution] = useState('');
    const [synthesis, setSynthesis] = useState<string | null>(null);
    const [image, setImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resonatingWisdom, setResonatingWisdom] = useState<any[]>([]);
    const [sharing, setSharing] = useState(false);
    const [shared, setShared] = useState(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
    const [isAmbientEnabled, setIsAmbientEnabled] = useState(false);
    const [isCanvasEnabled, setIsCanvasEnabled] = useState(true);
    const [isCompanionEnabled, setIsCompanionEnabled] = useState(true);
    const [voiceText, setVoiceText] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const isGlobalSyncing = useNeuralSync();
    const [localSyncing, setLocalSyncing] = useState(false);

    const { isPlaying: isAmbient, toggle: toggleAmbient } = useAmbient(isAmbientEnabled);
    const { isZen, toggleZen } = useZen();
    const { triggerDissonance } = useAudioResonance(mode, isAmbient);

    useEffect(() => {
        if (initialPrompt) setInput(initialPrompt);
        fetchProfile();
    }, [initialPrompt]);

    const fetchProfile = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('voice_enabled, ambient_enabled, canvas_enabled, companion_enabled').eq('id', user.id).maybeSingle();
            if (data) {
                setIsVoiceEnabled(data.voice_enabled ?? false);
                setIsAmbientEnabled(data.ambient_enabled ?? false);
                setIsCanvasEnabled(data.canvas_enabled ?? true);
                setIsCompanionEnabled(data.companion_enabled ?? true);
            }
        }
    };

    const fetchResonance = async (m: string) => {
        try {
            const r = await fetch(`/api/resonance/discover?mode=${m}`);
            const data = await r.json();
            if (data.resonating) setResonatingWisdom(data.resonating);
        } catch (err) { }
    };

    const handleShare = async () => {
        if (!response || sharing || shared) return;
        setSharing(true);
        try {
            await fetch('/api/collective/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode,
                    input,
                    reframe: response.reframe,
                    patternType: response.pattern
                })
            });
            setShared(true);
        } catch (err) {
            setError("Sharing failed. Please try again.");
        } finally {
            setSharing(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStart = async () => {
        if (!input.trim() && !image) return;
        setStep('processing');
        setIsProcessing(true);
        triggerDissonance(0.5);

        try {
            const res = await fetch('/api/session/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: input, mode, imageUrl: image, persona })
            });
            const data = await res.json();
            setLocalSyncing(true);
            setTimeout(() => setLocalSyncing(false), 3000);

            if (data.response) {
                setResponse({ ...data.response, sessionId: data.id });
                setStep('reflect');
                if (isVoiceEnabled) setVoiceText(data.response.mirror);
                triggerDissonance(0);
                fetchResonance(mode);
            } else {
                throw new Error(data.error || "Generation failed");
            }
        } catch (err: unknown) {
            setError((err instanceof Error ? err.message : String(err)));
            SentinelLogger.log(err instanceof Error ? err : String(err), { zone: 'session_start', inputLength: input.length }, 'critical');
            setStep('input');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCompleteResolution = async () => {
        if (!resolution.trim()) return;
        setStep('processing');
        setIsProcessing(true);

        try {
            const res = await fetch('/api/session/synthesis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalInput: input,
                    aiInsights: response?.insight || response?.reframe,
                    userResolution: resolution,
                    mode
                })
            });
            const data = await res.json();
            if (data.synthesis) {
                setSynthesis(data.synthesis);
                setStep('synthesis');
            } else {
                setStep('complete'); // Fallback if synthesis fails
            }
        } catch (err) {
            setStep('complete');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleTemplateSelect = (tPrompt: string, tMode: string) => {
        setInput(tPrompt);
        setMode(tMode as ReflectMode);
    };

    const steps = [
        { id: 'input', label: 'Intent' },
        { id: 'reflect', label: 'Analysis' },
        { id: 'resolution', label: 'Integration' },
        { id: 'synthesis', label: 'Synthesis' },
        { id: 'complete', label: 'Transcendence' },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === (step === 'processing' ? (response ? 'reflect' : 'input') : step));

    return (
        <div className={styles.container}>
            {isZen && (
                <button onClick={toggleZen} style={{ position: 'fixed', top: '2rem', right: '2rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#888', padding: '0.8rem', borderRadius: '50%', cursor: 'pointer', zIndex: 101 }}>
                    ✕
                </button>
            )}

            <div className={styles.header}>
                <div className={styles.progressHub}>
                    {steps.map((s, i) => (
                        <div key={s.id} className={styles.progressStep}>
                            <div className={`${styles.stepDot} ${i <= currentStepIndex ? (i < currentStepIndex ? styles.stepDotDone : styles.stepDotActive) : ''}`} />
                            <span className={`${styles.stepLabel} ${i === currentStepIndex ? styles.stepLabelActive : ''}`}>{s.label}</span>
                        </div>
                    ))}
                </div>

                <div className={styles.modeSelector}>
                    {step === 'input' && (
                        <>
                            <button className={styles.modeBtn} onClick={toggleZen} title="Zen Mode">🧘</button>
                            <span style={{ width: 1, background: '#333', margin: '0 0.5rem', height: '20px', alignSelf: 'center' }}></span>
                            <button className={styles.modeBtn} onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} style={{ borderColor: isVoiceEnabled ? 'var(--accent)' : '#333', color: isVoiceEnabled ? 'var(--accent)' : '#666' }}>
                                {isVoiceEnabled ? '🔊 Voice' : '🔇 Voice'}
                            </button>
                            <span style={{ width: 1, background: '#333', margin: '0 0.5rem', height: '20px', alignSelf: 'center' }}></span>
                        </>
                    )}
                    {['mindset', 'career', 'money', 'relationships', 'discipline'].map(m => (
                        <button
                            key={m}
                            onClick={() => setMode(m as ReflectMode)}
                            className={`${styles.modeBtn} ${mode === m ? styles.activeMode : ''}`}
                            style={mode === m ? { '--mode-color': `var(--mode-${m})` } as any : {}}
                            disabled={step !== 'input'}
                        >
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                    ))}
                    <span style={{ width: 1, background: '#333', margin: '0 0.5rem', height: '20px', alignSelf: 'center' }}></span>
                    <button
                        className={styles.modeBtn}
                        onClick={() => onEgress ? onEgress() : router.push('/session')}
                        style={{ opacity: 0.5 }}
                    >
                        Exit
                    </button>
                </div>
            </div>

            <div className={styles.content}>
                <AnimatePresence mode="wait">
                    {step === 'input' && (
                        <motion.div key="input" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className={styles.inputPhase}>
                            <PersonalizedPrompts onSelectPrompt={setInput} currentMode={mode} />
                            <div style={{ margin: '2rem 0' }}>
                                <DailyPromptBanner />
                            </div>
                            <div className={styles.personaSelector}>
                                {['sage', 'marcus', 'lao', 'socrates'].map(p => (
                                    <button key={p} className={`${styles.personaBtn} ${persona === p ? styles.activePersona : ''}`} onClick={() => setPersona(p)}>
                                        {p.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                            <h2 className={styles.prompt}>What&apos;s surfacing?</h2>
                            <div className={styles.inputControls}>
                                <textarea className={styles.textArea} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe your thought..." />
                            </div>
                            <motion.button whileHover={{ scale: 1.02 }} className={styles.primaryBtn} onClick={handleStart} disabled={!input.trim()}>
                                Initiate Analysis
                            </motion.button>
                        </motion.div>
                    )}

                    {step === 'processing' && (
                        <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.loading}>
                            <div className={styles.breathingCircle}></div>
                            <p style={{ letterSpacing: '0.2em', fontSize: '0.7rem', opacity: 0.5 }}>COORDINATING_NEURAL_SYNAPSE...</p>
                        </motion.div>
                    )}

                    {step === 'reflect' && response && (
                        <motion.div key="reflect" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={styles.reflectPhase}>
                            <div className={styles.card} style={{ borderLeftColor: `var(--mode-${mode})` }}>
                                <span className={styles.label}>NEURAL_MIRROR</span>
                                <p style={{ fontSize: '1.2rem', fontWeight: 300 }}>{response.mirror}</p>
                            </div>
                            <div className={styles.card} style={{ borderLeftColor: 'var(--accent)' }}>
                                <span className={styles.label}>PROVOCATION</span>
                                <p style={{ fontSize: '1.5rem', fontWeight: 200, fontStyle: 'italic' }}>{response.reframe}</p>
                            </div>

                            <div className={styles.resolutionArea}>
                                <span className={styles.label}>YOUR_RESOLUTION</span>
                                <textarea className={styles.textArea} style={{ minHeight: '120px' }} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Integrate the reframe..." />
                                <motion.button whileHover={{ scale: 1.02 }} className={styles.primaryBtn} onClick={handleCompleteResolution} disabled={!resolution.trim()}>
                                    Confirm Integration
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'synthesis' && synthesis && (
                        <motion.div key="synthesis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.synthesisPhase}>
                            <div className={styles.label}>FINAL_SYNTHESIS</div>
                            <p className={styles.synthesisText}>&quot;{synthesis}&quot;</p>
                            <motion.button whileHover={{ scale: 1.05 }} className={styles.navBtn} onClick={() => setStep('complete')}>
                                Transcend Session
                            </motion.button>
                        </motion.div>
                    )}

                    {step === 'complete' && (
                        <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.completionScreen}>
                            <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
                                <NeuralPulse speed={1} opacity={0.3} />
                            </div>
                            <h1 className={styles.completeTitle}>REFLECTION_COMPLETE</h1>
                            <p style={{ opacity: 0.4, letterSpacing: '0.1em' }}>Your neural patterns have been archived and synthesized.</p>
                            <div className={styles.completeActions}>
                                <button className={styles.navBtn} onClick={() => {
                                    setStep('input');
                                    setInput('');
                                    setResolution('');
                                    setResponse(null);
                                    setSynthesis(null);
                                }}>NEW_SESSION</button>
                                <button className={`${styles.navBtn} ${styles.navBtnPrimary}`} onClick={() => router.push('/session')}>RETURN_TO_CORTEX</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <NeuralVoice text={voiceText} persona={persona} enabled={isVoiceEnabled} />

            {/* Error Display */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        style={{
                            position: 'fixed',
                            bottom: '6rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(255, 50, 50, 0.15)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 50, 50, 0.3)',
                            padding: '0.8rem 1.5rem',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            zIndex: 1000,
                            maxWidth: '90vw',
                        }}
                    >
                        <span style={{ fontSize: '0.75rem', color: '#ff6b6b' }}>{error}</span>
                        <button
                            onClick={() => setError(null)}
                            style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1rem' }}
                        >✕</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(localSyncing || isGlobalSyncing) && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        style={{
                            position: 'fixed',
                            bottom: '2rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(5, 5, 8, 0.8)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid var(--accent)',
                            padding: '0.8rem 1.5rem',
                            borderRadius: '100px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            zIndex: 1000,
                            pointerEvents: 'none'
                        }}
                    >
                        <div className={styles.syncPulse} />
                        <span style={{ fontSize: '0.7rem', letterSpacing: '0.2em', fontWeight: 900, color: 'var(--accent)' }}>SAGE_NEURAL_SYNC_ACTIVE</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
