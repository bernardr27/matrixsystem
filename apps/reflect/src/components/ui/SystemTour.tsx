'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOUR_STEPS = [
    {
        id: 'core',
        title: 'THE_SYNTHESIS_CORE',
        desc: 'This is your primary workbench. Here, you state your intent and allow the OS to refract your cognition.',
        target: '.synthesis-focus',
        position: 'center'
    },
    {
        id: 'feed',
        title: 'NEURAL_ACTIVITY_STREAM',
        desc: 'Your recent neural reflections flow here as live data signals, preserving the continuity of your growth.',
        target: '.feed-focus',
        position: 'top'
    },
    {
        id: 'dock',
        title: 'OS_CONDUITS',
        desc: 'Seamlessly traverse the Cortex. Notice the magnification—the OS responds to your presence.',
        target: '.dock-focus',
        position: 'bottom'
    }
];

export default function SystemTour({ onComplete }: { onComplete: () => void }) {
    const [stepIndex, setStepIndex] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 2000); // Wait for dashboard manifestation to settle
        return () => clearTimeout(timer);
    }, []);

    const next = () => {
        if (stepIndex < TOUR_STEPS.length - 1) {
            setStepIndex(stepIndex + 1);
        } else {
            setVisible(false);
            setTimeout(onComplete, 800);
        }
    };

    if (!visible) return null;

    const currentStep = TOUR_STEPS[stepIndex];

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(5px)'
        }}>
            {/* Global Overlay with Hole (Highlighter) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: -1
                }}
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        width: '100%',
                        maxWidth: '450px',
                        background: 'rgba(10, 10, 10, 0.95)',
                        backdropFilter: 'blur(40px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '32px',
                        padding: '3rem',
                        textAlign: 'center',
                        pointerEvents: 'auto',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 30px rgba(74, 158, 255, 0.1)',
                        position: 'relative'
                    }}
                >
                    <div style={{
                        color: 'rgba(255, 255, 255, 0.4)',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        letterSpacing: '0.4em',
                        marginBottom: '1.5rem'
                    }}>
                        GUIDANCE_RITUAL // STEP_0{stepIndex + 1}
                    </div>

                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 100,
                        color: '#fff',
                        marginBottom: '1rem',
                        letterSpacing: '-0.02em'
                    }}>
                        {currentStep.title}
                    </h2>

                    <p style={{
                        color: '#888',
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                        fontWeight: 200,
                        marginBottom: '2.5rem'
                    }}>
                        {currentStep.desc}
                    </p>

                    <button
                        onClick={next}
                        style={{
                            background: '#fff',
                            color: '#000',
                            border: 'none',
                            padding: '1rem 2.5rem',
                            borderRadius: '100px',
                            fontSize: '0.7rem',
                            fontWeight: 900,
                            letterSpacing: '0.2em',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        {stepIndex === TOUR_STEPS.length - 1 ? 'FINALIZE_GUIDANCE' : 'CONTINUE_TRAVERSAL'}
                    </button>

                    {/* Step Visual Indicator */}
                    <div style={{
                        display: 'flex',
                        gap: '6px',
                        justifyContent: 'center',
                        marginTop: '2rem'
                    }}>
                        {TOUR_STEPS.map((_, i) => (
                            <div key={i} style={{
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                background: i === stepIndex ? '#fff' : 'rgba(255,255,255,0.1)',
                                boxShadow: i === stepIndex ? '0 0 10px #fff' : 'none',
                                transition: 'all 0.3s'
                            }} />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

