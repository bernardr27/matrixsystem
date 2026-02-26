'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralSurface } from '../ui/NeuralSurface';
import { NeuralButton } from '../ui/NeuralButton';

interface ChallengeProps {
    type: 'pattern' | 'reframe' | 'resonance';
    onComplete: () => void;
    onFail: () => void;
}

export default function CognitiveChallenge({ type, onComplete, onFail }: ChallengeProps) {
    const [step, setStep] = useState(0);
    const [timeLeft, setTimeLeft] = useState(10);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0) {
            onFail();
        }
    }, [timeLeft, isActive, onFail]);

    const startChallenge = () => {
        setIsActive(true);
    };

    const handleSuccess = () => {
        setIsActive(false);
        onComplete();
    };

    return (
        <NeuralSurface
            variant="glass"
            style={{
                width: '100%',
                padding: '3rem',
                borderRadius: '40px',
                background: 'rgba(0,0,0,0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{ position: 'absolute', top: '1.5rem', left: '0', width: '100%', opacity: 0.2, fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.5em' }}>
                NEURAL_CALIBRATION_REQUIRED
            </div>

            {!isActive ? (
                <div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 100, marginBottom: '1rem' }}>{type === 'pattern' ? 'Identify the Core Pattern' : 'Deconstruct the Distortion'}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', fontWeight: 200, lineHeight: 1.6 }}>
                        To unlock this high-tier thought artifact, you must first synchronize your cortex.
                        This exercise strengthens your neural agility.
                    </p>
                    <NeuralButton onClick={startChallenge} variant="primary">START_RITUAL</NeuralButton>
                </div>
            ) : (
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-1rem', right: '0', color: timeLeft < 4 ? '#ff4444' : '#fff', fontWeight: 900 }}>
                        {timeLeft}s
                    </div>

                    <div style={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Mini-game placeholder logic */}
                        {type === 'pattern' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleSuccess}
                                        style={{ width: '60px', height: '60px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', cursor: 'pointer' }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '2rem', fontSize: '0.7rem', opacity: 0.3 }}>FOCUS_AND_SELECT_THE_RESONANT_NODE</div>
                </div>
            )}
        </NeuralSurface>
    );
}
