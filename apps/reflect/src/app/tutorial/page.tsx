'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { NeuralButton } from '@/components/ui/NeuralButton';
import { ProfileIcon } from '@/components/ui/ProfileIcons';
import { useAccount } from '@/context/AccountContext';

const TUTORIAL_STEPS = [
    {
        id: 'welcome',
        title: 'WELCOME TO CORTEX',
        desc: 'Your neural profile has been successfully anchored. You are now entering the ReflectOS environment.',
        action: 'BEGIN ORIENTATION'
    },
    {
        id: 'stream',
        title: 'SOUL STREAM',
        desc: 'The Soul Stream (left feed) is your personalized river of consciousness. It adapts to your "Mindset" and brings you relevant insights, media, and prompts.',
        action: 'OBSERVE FLOW'
    },
    {
        id: 'shadow',
        title: 'SHADOW MIRROR',
        desc: 'The Shadow Mirror (right panel) reflects your hidden patterns. It challenges your assumptions and helps you integrate your subconscious traits.',
        action: 'ACKNOWLEDGE SHADOW'
    },
    {
        id: 'dock',
        title: 'NEURAL DOCK',
        desc: 'The Floating Dock below is your central command. Access your "Journal Vault", "Resonance Field", and "Map" from anywhere.',
        action: 'INITIALIZE DOCK'
    },
    {
        id: 'complete',
        title: 'SYSTEM SYNCHRONIZED',
        desc: 'You are ready. The system will now load your personalized dashboard.',
        action: 'ENTER SESSION'
    }
];

export default function TutorialPage() {
    const [stepIndex, setStepIndex] = useState(0);
    const [isExiting, setIsExiting] = useState(false);
    const router = useRouter();
    const { archetype } = useAccount();
    const currentStep = TUTORIAL_STEPS[stepIndex];

    const nextStep = () => {
        if (stepIndex < TUTORIAL_STEPS.length - 1) {
            setStepIndex(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsExiting(true);
        localStorage.setItem('reflect_tutorial_complete', 'true');
        // Redirect to preloader instead of session directly
        setTimeout(() => router.push('/dashboard-loading'), 1000);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            fontFamily: 'monospace'
        }}>
            {/* Background Atmosphere */}
            <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
                transition={{ duration: 10, repeat: Infinity }}
                style={{
                    position: 'absolute',
                    width: '80vw',
                    height: '80vw',
                    background: `radial-gradient(circle, ${archetype?.color || '#3b82f6'}20 0%, transparent 70%)`,
                    borderRadius: '50%',
                    filter: 'blur(80px)',
                    zIndex: 0
                }}
            />

            <AnimatePresence mode="wait">
                {!isExiting && (
                    <motion.div
                        key="skip-button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 20 }}
                    >
                        <button
                            onClick={handleComplete}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'rgba(255,255,255,0.6)',
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                letterSpacing: '0.1em'
                            }}
                        >
                            SKIP
                        </button>
                    </motion.div>
                )}

                {!isExiting && (
                    <motion.div
                        key={currentStep.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 1.05, filter: 'blur(10px)' }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            zIndex: 10,
                            maxWidth: '600px',
                            width: '100%',
                            padding: '3rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center'
                        }}
                    >
                        <div style={{
                            marginBottom: '2rem',
                            filter: `drop-shadow(0 0 30px ${archetype?.color || '#fff'}40)`
                        }}>
                            <ProfileIcon type={archetype?.icon || 'seeker'} color={archetype?.color || '#fff'} active={true} size={80} />
                        </div>

                        <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 900,
                            letterSpacing: '0.3em',
                            color: 'rgba(255,255,255,0.4)',
                            marginBottom: '1rem',
                            display: 'block'
                        }}>
                            STEP {stepIndex + 1} // {TUTORIAL_STEPS.length}
                        </span>

                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: 100,
                            marginBottom: '1.5rem',
                            lineHeight: 1.1,
                            letterSpacing: '-0.02em'
                        }}>
                            {currentStep.title}
                        </h1>

                        <p style={{
                            fontSize: '1rem',
                            lineHeight: 1.6,
                            opacity: 0.7,
                            marginBottom: '3rem',
                            maxWidth: '450px'
                        }}>
                            {currentStep.desc}
                        </p>

                        <NeuralButton
                            onClick={nextStep}
                            style={{
                                minWidth: '220px',
                                boxShadow: `0 0 30px ${archetype?.color || '#fff'}20`
                            }}
                        >
                            {currentStep.action}
                        </NeuralButton>

                        {/* Pagination Dots */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '3rem' }}>
                            {TUTORIAL_STEPS.map((_, i) => (
                                <div key={i} style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: i === stepIndex ? '#fff' : 'rgba(255,255,255,0.2)',
                                    transition: 'all 0.3s'
                                }} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
