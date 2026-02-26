'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralSurface } from '../ui/NeuralSurface';
import { NeuralButton } from '../ui/NeuralButton';
import { useAccount } from '@/context/AccountContext';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';

import { chatWithJournal } from '@/app/actions-chat';

export default function RefractiveWorkstation({
    onClose,
    onLaunchRitual,
    sensing = false,
    value,
    onValueChange,
    promptMode = 'mindset'
}: {
    onClose?: () => void,
    onLaunchRitual?: (text: string) => void,
    sensing?: boolean,
    value?: string,
    onValueChange?: (val: string) => void,
    promptMode?: string
}) {
    const [internalInput, setInternalInput] = useState('');
    const input = value !== undefined ? value : internalInput;
    const setInput = onValueChange || setInternalInput;
    const [isThinking, setIsThinking] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [dismissCount, setDismissCount] = useState(0);

    const { archetype } = useAccount();
    const activeColor = archetype?.color || '#fff';
    const { isListening, transcript, startListening, stopListening, resetTranscript, supported } = useVoiceInput();

    // Sync Voice to Input
    React.useEffect(() => {
        if (isListening && transcript) {
            setInput(transcript);
        }
    }, [isListening, transcript]);

    const protocols = [
        { id: 'clarity', label: 'CLARITY', prompt: archetype ? `How does ${archetype.traits.focus} influence my current thought?` : 'I need to clear my mind of...' },
        { id: 'restore', label: 'RESTORE', prompt: archetype ? `Restore equilibrium through the lens of ${archetype.name}.` : 'Guide me back to equilibrium.' },
        { id: 'focus', label: 'FOCUS', prompt: archetype ? `Lock onto ${archetype.traits.focus} with precision.` : 'Help me lock onto my primary objective.' }
    ];

    const handleSynthesize = async () => {
        if (!input.trim() || isThinking) return;
        setIsThinking(true);

        try {
            // Retrieve context if available
            const contextRaw = localStorage.getItem('reflect_journal_context');
            const context = contextRaw ? JSON.parse(contextRaw) : [];

            // Call server action correctly: expects messages array
            const response = await chatWithJournal([
                { role: 'user', content: input }
            ]);

            if (response && response.content) {
                setResult(response.content);
                // Optional: Save to local history or context
            } else if (response && typeof response === 'string') {
                // Fallback if it returns raw string
                setResult(response);
            } else {
                throw new Error("Invalid response format");
            }
        } catch (error) {
            console.error("Synthesis error:", error);
            setResult("Neural link unstable. Please try again.");
        } finally {
            setIsThinking(false);
        }
    };

    const handleDismiss = () => {
        if (dismissCount >= 1 && onClose) {
            // Second dismissal - force close
            onClose();
            // Reset for next time
            setTimeout(() => {
                setResult(null);
                setInput('');
                setDismissCount(0);
            }, 300);
        } else {
            // First dismissal - clear and reset
            setResult(null);
            setInput('');
            setDismissCount(prev => prev + 1);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        setInput(newVal);
    };

    // Keyboard handling: Scroll into view on focus/resize
    React.useEffect(() => {
        const handleResize = () => {
            if (document.activeElement?.tagName === 'TEXTAREA') {
                document.activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
        }
        window.addEventListener('resize', handleResize);

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
                window.visualViewport.removeEventListener('scroll', handleResize);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            position: 'relative',
            zIndex: 10,
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch' // Smooth scroll on iOS
        }}>
            <div style={{
                maxWidth: '100%',
                margin: '0',
                padding: '0',
                width: '100%',
                minHeight: '100%' // Ensure full height for scrolling
            }}>
                <NeuralSurface
                    variant="glass"
                    style={{
                        padding: 'clamp(1rem, 6vw, 4rem) clamp(1rem, 4vw, 3rem)',
                        borderRadius: 'clamp(20px, 5vw, 40px)',
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'clamp(1rem, 4vw, 3rem)',
                        width: '100%',
                        maxWidth: '100%',
                        margin: 'auto',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        willChange: 'backdrop-filter, transform'
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '0.6rem',
                            fontWeight: 900,
                            color: activeColor,
                            letterSpacing: '0.3em',
                            marginBottom: '1rem',
                            textTransform: 'uppercase',
                            opacity: 0.6,
                            textShadow: `0 0 10px ${activeColor}66`
                        }}>
                            SIGNAL_MODE // {promptMode}${archetype ? ` // ${archetype.name.toUpperCase()}` : ''}
                        </div>
                        <h2 style={{
                            fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
                            fontWeight: 100,
                            letterSpacing: '-0.04em',
                            marginBottom: '0.6rem',
                            color: '#fff'
                        }}>Neural Workbench</h2>
                        <p style={{ color: '#555', fontSize: 'clamp(0.8rem, 2vw, 1rem)', fontWeight: 300, letterSpacing: '0.04em' }}>Synthesize consciousness in precision fidelity.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        <div style={{
                            position: 'relative',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '100px', // TRUE PILL
                            border: '1px solid rgba(255,255,255,0.08)',
                            padding: '12px 16px 12px 2.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 2px 10px rgba(255,255,255,0.02)',
                            backdropFilter: 'blur(24px)'
                        }} className="pill-input-focus-wrapper group">
                            <textarea
                                value={sensing ? "Sensing soul stream..." : input}
                                onChange={handleInputChange}
                                onFocus={(e) => {
                                    // Scroll to ensure visibility when keyboard pops up
                                    setTimeout(() => {
                                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }, 300);
                                }}
                                disabled={sensing}
                                placeholder="State a thought..."
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: sensing ? 'rgba(255,255,255,0.3)' : '#fff',
                                    fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                                    fontFamily: 'inherit',
                                    resize: 'none',
                                    minHeight: '40px',
                                    maxHeight: '300px',
                                    paddingTop: '8px',
                                    lineHeight: '1.4',
                                    fontWeight: 200,
                                    fontStyle: sensing ? 'italic' : 'normal'
                                }}
                            />

                            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                <motion.button
                                    onClick={() => onLaunchRitual?.(input)}
                                    disabled={!input.trim()}
                                    whileHover={{ scale: 1.05, opacity: 1, background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: '#fff',
                                        fontSize: '0.6rem',
                                        fontWeight: 900,
                                        letterSpacing: '0.2em',
                                        padding: '0.6rem 1.2rem',
                                        borderRadius: '100px',
                                        cursor: 'pointer',
                                        opacity: input.trim() ? 0.9 : 0.3,
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    RITUAL
                                </motion.button>

                                <motion.button
                                    onClick={isListening ? stopListening : () => { resetTranscript(); startListening(); }}
                                    disabled={!supported || isThinking}
                                    whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        background: isListening ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255,255,255,0.05)',
                                        border: isListening ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.3s',
                                        boxShadow: isListening ? '0 0 20px rgba(239,68,68,0.4)' : 'none'
                                    }}
                                >
                                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                                </motion.button>

                                <motion.button
                                    onClick={handleSynthesize}
                                    disabled={!input.trim() || isThinking}
                                    whileHover={{ scale: 1.05, background: '#fff', boxShadow: '0 0 25px rgba(255,255,255,0.4)' }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: input.trim() ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.3s ease',
                                        flexShrink: 0,
                                        boxShadow: input.trim() ? '0 0 20px rgba(255,255,255,0.15)' : 'none'
                                    }}
                                >
                                    {isThinking ? (
                                        <div style={{
                                            width: '18px',
                                            height: '18px',
                                            border: '2px solid #000',
                                            borderTopColor: 'transparent',
                                            borderRadius: '50%'
                                        }} className="refract-spin" />
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? "#000" : "#fff"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </motion.button>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.98 }}
                                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                    style={{
                                        zIndex: 100
                                    }}
                                >
                                    <NeuralSurface
                                        variant="glass"
                                        style={{
                                            padding: 'clamp(1.5rem, 5vw, 2.5rem)',
                                            background: 'rgba(20, 25, 35, 0.6)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '2rem',
                                            boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 40px rgba(56,189,248,0.1)',
                                            position: 'relative',
                                            backdropFilter: 'blur(30px)',
                                            WebkitBackdropFilter: 'blur(30px)',
                                            willChange: 'transform, opacity, backdrop-filter'
                                        }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40 rounded-t-2rem" />
                                        <div style={{
                                            color: 'rgba(56, 189, 248, 0.6)',
                                            fontSize: '0.65rem',
                                            fontWeight: 900,
                                            letterSpacing: '0.4em',
                                            marginBottom: '1.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.8rem'
                                        }}>
                                            <div style={{ width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent)' }} />
                                            NEURAL_SYNTHESIS
                                        </div>

                                        <p style={{
                                            fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
                                            lineHeight: 1.6,
                                            color: '#fff',
                                            fontWeight: 200,
                                            margin: 0,
                                            letterSpacing: '0.02em',
                                            whiteSpace: 'pre-wrap'
                                        }}>{result}</p>

                                        <div style={{ marginTop: '2.5rem', textAlign: 'right' }}>
                                            <NeuralButton variant="ghost" size="sm" onClick={handleDismiss} className="rounded-full px-6 py-2 border border-white/10 hover:bg-rose-500/20 hover:text-rose-200" style={{ minWidth: '140px' }}>DISMISS</NeuralButton>
                                        </div>
                                    </NeuralSurface>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </NeuralSurface>

                <style>{`
                    .pill-input-focus-wrapper:focus-within {
                        border-color: rgba(56,189,248,0.3) !important;
                        background: rgba(255,255,255,0.05) !important;
                        box-shadow: 0 20px 50px rgba(0,0,0,0.6), inset 0 2px 10px rgba(255,255,255,0.05), 0 0 40px rgba(56,189,248,0.15) !important;
                    }
                    .refract-spin {
                        animation: spin-refract 0.8s linear infinite;
                    }
                    @keyframes spin-refract {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
}
