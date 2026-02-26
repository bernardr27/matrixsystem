'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StandardPageLayout from '@/components/layout/StandardPageLayout';

const STORY_ARCS = [
    { id: 1, title: 'The Silent Threshold', period: 'NOV - DEC', color: '#3b82f6', intent: 'Overcoming creative paralysis through structured discipline.' },
    { id: 2, title: 'Neural Expansion', period: 'DEC - JAN', color: '#10b981', intent: 'Bridging technical logic with intuitive flow-states.' },
    { id: 3, title: 'Current Orbit', period: 'JAN - NOW', color: '#8b5cf6', intent: 'Manifesting the total system transcendence of cognition.' },
];

import { NeuralSurface } from '@/components/ui/NeuralSurface';

export default function NarrativeLifelines() {
    const [activeArc, setActiveArc] = useState<any>(null);

    return (
        <StandardPageLayout title="Narrative Lifelines">
            {/* Arc Cards — stacked vertically for mobile, inline for larger */}
            <div className="flex flex-col gap-6 w-full">
                {STORY_ARCS.map((arc, i) => (
                    <motion.div
                        key={arc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full"
                    >
                        <NeuralSurface
                            variant="glass"
                            hoverEffect
                            onClick={() => setActiveArc(arc)}
                            className="p-8 cursor-pointer relative overflow-hidden"
                            style={{
                                border: `1px solid ${arc.color}20`,
                                background: `linear-gradient(135deg, ${arc.color}08 0%, rgba(255,255,255,0.01) 100%)`,
                            }}
                        >
                            {/* Period Badge */}
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{
                                        background: arc.color,
                                        boxShadow: `0 0 12px ${arc.color}60`,
                                    }}
                                />
                                <span
                                    className="text-[10px] font-black uppercase tracking-[0.3em]"
                                    style={{ color: arc.color }}
                                >
                                    {arc.period}
                                </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-2xl font-light text-white mb-2 tracking-tight">
                                {arc.title}
                            </h3>

                            {/* Intent Preview */}
                            <p className="text-sm text-white/30 font-light leading-relaxed mb-0">
                                {arc.intent}
                            </p>

                            {/* SVG Arc Overlay */}
                            <svg className="absolute bottom-4 right-6 w-[50px] h-[24px]">
                                <motion.path
                                    d="M 5 20 Q 25 0 45 20"
                                    stroke={arc.color}
                                    strokeWidth="1.5"
                                    fill="none"
                                    strokeOpacity={0.4}
                                    animate={{ pathLength: [0, 1] }}
                                    transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
                                />
                            </svg>
                        </NeuralSurface>

                        {/* Connection Line */}
                        {i < STORY_ARCS.length - 1 && (
                            <div
                                className="absolute -bottom-6 left-8 w-[1px] h-6 z-0"
                                style={{
                                    background: `linear-gradient(to bottom, ${arc.color}40, ${STORY_ARCS[i + 1].color}40)`,
                                }}
                            />
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Footer Hint */}
            <div className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mt-8">
                TAP_ARC_TO_EXPAND
            </div>

            {/* Detailed Arc Modal */}
            <AnimatePresence>
                {activeArc && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 100,
                            background: 'rgba(2,2,2,0.95)',
                            backdropFilter: 'blur(30px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2rem',
                        }}
                        onClick={() => setActiveArc(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: -10 }}
                            style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ fontSize: '0.6rem', fontWeight: 900, color: activeArc.color, letterSpacing: '0.5em', marginBottom: '2rem', textTransform: 'uppercase' as const }}>
                                DEEP_TEMPORAL_DIVE
                            </div>
                            <h2 style={{
                                fontSize: 'clamp(2rem, 8vw, 3rem)',
                                fontWeight: 100,
                                color: '#fff',
                                marginBottom: '1.5rem',
                                letterSpacing: '-0.02em',
                            }}>
                                {activeArc.title}
                            </h2>
                            <p style={{
                                fontSize: 'clamp(0.95rem, 3vw, 1.2rem)',
                                color: 'rgba(255,255,255,0.5)',
                                fontWeight: 200,
                                lineHeight: 1.7,
                                fontStyle: 'italic',
                                marginBottom: '3rem',
                            }}>
                                &quot;{activeArc.intent}&quot;
                            </p>
                            <button
                                onClick={() => setActiveArc(null)}
                                style={{
                                    background: 'transparent',
                                    border: `1px solid ${activeArc.color}40`,
                                    color: activeArc.color,
                                    padding: '12px 32px',
                                    borderRadius: '100px',
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    letterSpacing: '0.2em',
                                    textTransform: 'uppercase' as const,
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                EXIT_ARC
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </StandardPageLayout>
    );
}
