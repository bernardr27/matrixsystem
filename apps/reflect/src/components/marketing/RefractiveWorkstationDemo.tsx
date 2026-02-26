'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralSurface } from '../ui/NeuralSurface';
import { NeuralButton } from '../ui/NeuralButton';
// import { useAccount } from '@/context/AccountContext'; // Removed for Demo
// import { chatWithJournal } from '@/app/actions-chat'; // Removed for Demo

export default function RefractiveWorkstationDemo({
    onClose,
    onLaunchRitual,
    sensing = false,
    value,
    onValueChange,
    promptMode = 'demo'
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

    // Mock Archetype for Demo
    const archetype = {
        name: 'Guest',
        color: '#f59e0b', // Creative/Demo color
        traits: { focus: 'exploration' }
    };
    const activeColor = archetype.color;

    const demoResponses = [
        "The patterns you perceive are reflections of your own potential. (Demo Mode)",
        "In the silence between thoughts, a new clarity emerges. (Demo Mode)",
        "Your intention ripples through the neural fabric, creating new pathways. (Demo Mode)",
        "Focus is not a destination, but a frequency to be tuned. (Demo Mode)",
        "The algorithm acknowledges your query. Authenticate to deepen the link. (Demo Mode)"
    ];

    const handleSynthesize = async () => {
        if (!input.trim() || isThinking) return;
        setIsThinking(true);

        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Pick a random demo response
            const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
            setResult(randomResponse);

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
    useEffect(() => {
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
                        padding: 'clamp(2rem, 8vw, 4rem) clamp(1rem, 5vw, 3rem)',
                        borderRadius: '40px',
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'clamp(1.5rem, 5vw, 3rem)',
                        width: '100%',
                        maxWidth: '100%',
                        margin: 'auto',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(30px)'
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
                            opacity: 0.8,
                            textShadow: `0 0 10px ${activeColor}66`
                        }}>
                            PREVIEW_MODE // UNREGISTERED_SIGNAL
                        </div>
                        <h2 style={{
                            fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
                            fontWeight: 100,
                            letterSpacing: '-0.04em',
                            marginBottom: '0.6rem',
                            color: '#fff'
                        }}>Neural Workbench</h2>
                        <p style={{ color: '#555', fontSize: 'clamp(0.8rem, 2vw, 1rem)', fontWeight: 300, letterSpacing: '0.04em' }}>
                            Experience a simulation of the Reflect interface. <br />
                            <a href="/auth" style={{ color: activeColor, textDecoration: 'none', borderBottom: `1px solid ${activeColor}` }}>Sign In</a> to access full fidelity.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        <div style={{
                            position: 'relative',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '40px',
                            border: '1px solid rgba(255,255,255,0.06)',
                            padding: '10px 12px 10px 2rem',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.3)',
                        }} className="pill-input-focus-wrapper">
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
                                placeholder="State a thought (Demo)..."
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
                                    whileHover={{ scale: 1.05, opacity: 1, background: 'rgba(255,255,255,0.05)' }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.02)',
                                        color: '#fff',
                                        fontSize: '0.55rem',
                                        fontWeight: 900,
                                        letterSpacing: '0.2em',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '100px',
                                        cursor: 'pointer',
                                        opacity: input.trim() ? 0.6 : 0.2,
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    RITUAL
                                </motion.button>

                                <motion.button
                                    onClick={handleSynthesize}
                                    disabled={!input.trim() || isThinking}
                                    whileHover={{ scale: 1.05, background: '#fff' }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: input.trim() ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.3s ease',
                                        flexShrink: 0,
                                        boxShadow: input.trim() ? '0 0 20px rgba(255,255,255,0.1)' : 'none'
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
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                                            background: 'rgba(255, 255, 255, 0.02)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '32px',
                                            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
                                            position: 'relative',
                                            backdropFilter: 'blur(40px)',
                                            willChange: 'transform, opacity'
                                        }}
                                    >
                                        <div style={{
                                            color: 'rgba(255,255,255,0.3)',
                                            fontSize: '0.65rem',
                                            fontWeight: 900,
                                            letterSpacing: '0.4em',
                                            marginBottom: '1.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.8rem'
                                        }}>
                                            <div style={{ width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent)' }} />
                                            DEMO_SYNTHESIS
                                        </div>

                                        <p style={{
                                            fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
                                            lineHeight: 1.4,
                                            color: '#fff',
                                            fontWeight: 100,
                                            fontStyle: 'italic',
                                            margin: 0,
                                            letterSpacing: '0.01em',
                                            whiteSpace: 'pre-wrap'
                                        }}>&quot;{result}&quot;</p>

                                        <div style={{ marginTop: '2.5rem', textAlign: 'right' }}>
                                            <NeuralButton variant="ghost" size="sm" onClick={handleDismiss} style={{ minWidth: '140px' }}>DISMISS</NeuralButton>
                                        </div>
                                    </NeuralSurface>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </NeuralSurface>

                <style>{`
                    .pill-input-focus-wrapper:focus-within {
                        border-color: rgba(255,255,255,0.2) !important;
                        background: rgba(255,255,255,0.04) !important;
                        box-shadow: inset 0 8px 30px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.02) !important;
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
