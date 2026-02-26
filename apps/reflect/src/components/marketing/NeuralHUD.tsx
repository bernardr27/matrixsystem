'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const HUDMetric = ({ label, value, color, delay }: { label: string; value: string; color: string; delay: number }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 1 }}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.2rem',
            padding: '0.8rem 1.2rem',
            background: 'rgba(255,255,255,0.01)',
            borderLeft: `2px solid ${color}`,
            borderRadius: '0 8px 8px 0',
            minWidth: '140px'
        }}
    >
        <span style={{ fontSize: '0.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.2em' }}>{label}</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 500, color, opacity: 0.8, letterSpacing: '0.05em' }}>{value}</span>
    </motion.div>
);

const NeuralPulse = () => (
    <div style={{ position: 'relative', width: '40px', height: '40px' }}>
        {[0, 1, 2].map((i) => (
            <motion.div
                key={i}
                style={{
                    position: 'absolute',
                    inset: 0,
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50%'
                }}
                animate={{
                    scale: [1, 2],
                    opacity: [0.3, 0]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: i * 1.5,
                    ease: "easeOut"
                }}
            />
        ))}
        <div style={{ position: 'absolute', inset: '15px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 15px #fff' }} />
    </div>
);

export default function NeuralHUD() {
    const [resonance, setResonance] = useState<{ intensity: number; message: string; timestamp: number } | null>(null);

    useEffect(() => {
        const channel = supabase.channel('reflect_resonance')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ghost_bridge' }, (payload: any) => {
                const { command, output } = payload.new;
                if (command === 'sys:broadcast') {
                    try {
                        const data = typeof output === 'string' ? JSON.parse(output) : output;
                        if (data.type === 'resonance') {
                            setResonance({
                                intensity: data.intensity || 1,
                                message: data.message || '',
                                timestamp: Date.now()
                            });
                            // Reset after 4s
                            setTimeout(() => setResonance(null), 4000);
                        }
                    } catch (e) {
                        console.warn('[HUD] Failed to parse resonance:', e);
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div style={{
            position: 'absolute',
            width: '100%',
            maxWidth: '1400px',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '2rem',
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 4rem',
            zIndex: 0,
            opacity: 0.6
        }}>
            {/* Left Wing */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <HUDMetric label="COGNITIVE_LOAD" value="12.4% NOMINAL" color="#3b82f6" delay={0.4} />
                <HUDMetric label="FOCUS_COEFFICIENT" value="0.92 SIGNAL" color="#10b981" delay={0.6} />
            </div>

            {/* Central Orbit (Hidden behind text but provides glow) */}
            <div style={{ opacity: 0.4 }}>
                <NeuralPulse />
            </div>

            <AnimatePresence>
                {resonance && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.2, y: -20 }}
                        style={{
                            position: 'absolute',
                            top: '120px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(168,85,247,0.1)',
                            border: '1px solid rgba(168,85,247,0.3)',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            backdropFilter: 'blur(10px)',
                            color: '#a855f7',
                            fontSize: '0.6rem',
                            fontWeight: 'bold',
                            letterSpacing: '0.1em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            zIndex: 100
                        }}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            style={{ width: '6px', height: '6px', background: '#a855f7', borderRadius: '50%' }}
                        />
                        {resonance.message.toUpperCase()}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Right Wing */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'flex-end' }}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 2 }}
                    style={{ textAlign: 'right' }}
                >
                    <div style={{ fontSize: '0.45rem', fontWeight: 900, color: 'rgba(255,255,255,0.05)', letterSpacing: '0.5em', marginBottom: '0.5rem' }}>SYSTEM_STATUS</div>
                    <div style={{ width: '100px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1))' }} />
                    <div style={{ fontSize: '0.6rem', color: resonance ? '#a855f7' : 'rgba(255,255,255,0.2)', marginTop: '0.5rem', fontWeight: 200, transition: 'color 0.5s' }}>
                        {resonance ? 'RESONANCE_ACTIVE' : 'V.5.1.0_SENTIENT'}
                    </div>
                </motion.div>
                <HUDMetric label="NEURAL_DENSITY" value="4.2k NODES" color="#ec4899" delay={0.8} />
            </div>
        </div>
    );
}
