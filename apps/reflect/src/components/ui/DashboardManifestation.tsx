'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NeuralPulse from './NeuralPulse';

export default function DashboardManifestation({ onComplete }: { onComplete: () => void }) {
    const [stage, setStage] = useState<'loading' | 'calibrating' | 'complete'>('loading');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Orchestrated Loading Sequence
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setStage('calibrating');
                    setTimeout(() => {
                        setStage('complete');
                        setTimeout(onComplete, 1000);
                    }, 2000);
                    return 100;
                }
                return prev + 1;
            });
        }, 30);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {stage !== 'complete' && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: 'blur(20px)' }}
                    transition={{ duration: 1 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 10000,
                        background: '#000',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                        <NeuralPulse speed={1.5} opacity={0.3} />
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'radial-gradient(circle at 50% 50%, rgba(74, 158, 255, 0.1) 0%, transparent 70%)'
                        }} />
                    </div>

                    <motion.div
                        style={{
                            width: '300px',
                            height: '1px',
                            background: 'rgba(255,255,255,0.05)',
                            position: 'relative',
                            zIndex: 10,
                            marginBottom: '2rem'
                        }}
                    >
                        <motion.div
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                background: '#fff',
                                boxShadow: '0 0 20px #fff',
                                width: `${progress}%`
                            }}
                        />
                    </motion.div>

                    <div style={{
                        color: '#fff',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        letterSpacing: '0.4em',
                        opacity: 0.5,
                        zIndex: 10,
                        textAlign: 'center'
                    }}>
                        {stage === 'loading' ? 'MANIFESTING_CORTEX...' : 'NEURAL_CALIBRATION_STABLE'}
                    </div>

                    {stage === 'calibrating' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: '0.8rem',
                                fontWeight: 100,
                                marginTop: '1rem',
                                zIndex: 10
                            }}
                        >
                            Applying personalized neural interface...
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

