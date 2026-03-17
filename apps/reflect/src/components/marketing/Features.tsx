'use client';

import { NeuralSurface } from '../ui/NeuralSurface';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { NeuralButton } from '../ui/NeuralButton';
import { CinematicBackground } from '../ui/CinematicBackground';
import { LiquidGlass } from '../ui/LiquidGlass';
import { Reveal } from '../ui/Reveal';
import { ParallaxLayer } from '../ui/ParallaxLayer';

type FeatureItem = {
    title: string;
    desc: string;
    icon: React.ReactNode;
};

export default function Features() {
    const [selectedFeature, setSelectedFeature] = useState<FeatureItem | null>(null);

    const features: FeatureItem[] = [
        {
            title: "Neural Workbench",
            desc: "The core of your reflection. Synthesize thoughts, refract logic, and explore the depth of your consciousness.",
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.1" />
                </svg>
            )
        },
        {
            title: "Cognitive Insights",
            desc: "Advanced pattern recognition across your neural map. Unlock hidden mental loops and growth trajectories.",
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 8V4m0 16v-4m-8-4h4m12 0h-4M5.6 5.6l2.8 2.8m7.2 7.2l2.8 2.8M5.6 18.4l2.8-2.8m7.2-7.2l2.8-2.8" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            )
        },
        {
            title: "Voice Resonance",
            desc: "Speak freely. Our semantic engine transcribes, structures, and analyzes your thoughts in real-time.",
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4m-4 0h8" strokeLinecap="round" />
                </svg>
            )
        },
        {
            title: "Private & Secure",
            desc: "Your consciousness, encrypted. Local-first architecture with optional Safe Mode operation.",
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
            )
        },
        {
            title: "Collective Mind",
            desc: "Optional P2P sharing. Connect with similar neural signatures while maintaining absolute privacy.",
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                </svg>
            )
        },
        {
            title: "Emotional Weather",
            desc: "Track the subtle shifts in your cognitive climate. Visualize mood clustering over time.",
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17.5 19a3.5 3.5 0 1 1-5.95-2.28 7 7 0 1 1 10.9-4.82 4.5 4.5 0 1 1-4.95 7.1Z" />
                </svg>
            )
        },
        {
            title: "Transcendent Tier",
            desc: "Unlock infinite storage, deeper AI refraction, and advanced cognitive telemetry.",
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="m12 3-1.912 5.813L4.275 8.813l4.713 3.424-1.8 5.513L12 14.337l4.812 3.424-1.8-5.513 4.713-3.424-5.813-.012L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        }
    ];

    return (
        <section style={{ width: '100%', background: 'transparent', position: 'relative' }}>
            <CinematicBackground className="opacity-60" />
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 0', width: '100%' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', // Grand card size
                    gap: '2.5rem',
                    justifyContent: 'center'
                }}>
                    {features.map((f, i) => (
                        <Reveal key={f.title} delay={i * 0.05}>
                            <motion.div
                                onClick={() => setSelectedFeature(f)}
                                style={{ cursor: 'pointer', height: '100%' }}
                                whileHover={{ y: -8 }}
                            >
                                <ParallaxLayer offset={10 + (i % 3) * 4}>
                                    <NeuralSurface
                                        variant="glass"
                                        style={{
                                            padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 4vw, 2.5rem)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            minHeight: '260px',
                                            height: '100%',
                                            borderRadius: '32px',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            transition: 'all 0.5s var(--ease-fluid)',
                                            willChange: 'transform, box-shadow'
                                        }}
                                        className="feature-card-premium"
                                    >
                                        <LiquidGlass className="absolute top-4 right-4 px-3 py-1 text-[10px] text-white/60 font-semibold tracking-wide">
                                            Feature
                                        </LiquidGlass>
                                {/* Glowing Dynamic Border (Optimized) */}
                                <div className="glowing-border" style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: '32px',
                                    padding: '1.5px',
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2), transparent 50%, rgba(255,255,255,0.1))',
                                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                    WebkitMaskComposite: 'xor',
                                    maskComposite: 'exclude',
                                    opacity: 0,
                                    transition: 'opacity 0.4s ease',
                                    willChange: 'opacity'
                                }} />

                                        <div style={{
                                            color: '#fff',
                                            marginBottom: '1.8rem',
                                            opacity: 0.8,
                                            willChange: 'filter'
                                        }}>{f.icon}</div>

                                        <h3 style={{
                                            fontSize: '1.6rem', // Slightly compressed for mobile
                                            marginBottom: '1rem',
                                            color: '#fff',
                                            fontWeight: 100,
                                            letterSpacing: '-0.02em',
                                            lineHeight: 1.1
                                        }}>{f.title}</h3>

                                        <p style={{
                                            color: 'rgba(255,255,255,0.4)',
                                            lineHeight: 1.6,
                                            fontSize: '0.95rem',
                                            margin: 0,
                                            fontWeight: 300,
                                            letterSpacing: '0.01em'
                                        }}>{f.desc}</p>
                                    </NeuralSurface>
                                </ParallaxLayer>
                            </motion.div>
                        </Reveal>
                    ))}
                </div>
            </div>

            {/* Matter Black Popup Detail (Performance Optimized) */}
            <AnimatePresence>
                {selectedFeature && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 4000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem'
                    }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedFeature(null)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }}
                        />
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 20 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            style={{ position: 'relative', width: '100%', maxWidth: '600px', willChange: 'transform, opacity' }}
                        >
                            <NeuralSurface
                                variant="glass"
                                style={{
                                    padding: 'clamp(2rem, 8vw, 4rem) clamp(1.5rem, 5vw, 3rem)',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '40px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
                                    backdropFilter: 'blur(40px)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2rem',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{ color: '#fff', margin: '0 auto', opacity: 0.8 }}>{selectedFeature.icon}</div>
                                <h2 style={{ fontSize: 'clamp(1.8rem, 6vw, 2.5rem)', fontWeight: 100, color: '#fff', margin: 0, lineHeight: 1 }}>{selectedFeature.title}</h2>
                                <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.15rem)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, fontWeight: 300 }}>{selectedFeature.desc}</p>
                                <div style={{ marginTop: '1rem' }}>
                                    <NeuralButton variant="ghost" onClick={() => setSelectedFeature(null)} style={{ minWidth: '180px' }}>Close Detail</NeuralButton>
                                </div>
                            </NeuralSurface>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .feature-card-premium:hover .glowing-border {
                    opacity: 1 !important;
                }
                .feature-card-premium:hover {
                    box-shadow: 0 40px 80px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.02) !important;
                    background: rgba(255, 255, 255, 0.02) !important;
                }
            `}</style>
        </section>
    );
}
