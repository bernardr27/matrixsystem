import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralSurface } from '../ui/NeuralSurface';
import { CinematicBackground } from '../ui/CinematicBackground';
import { LiquidGlass } from '../ui/LiquidGlass';
import { Reveal } from '../ui/Reveal';
import { ParallaxLayer } from '../ui/ParallaxLayer';

const SUBTITLES = [
    'A high-fidelity spatial environment for cognitive clarity.',
    'Engineered silence. A workspace for deep, structured thought.',
    "The operating system for your mind's eye.",
    'Fluid digital architecture designed for flow state.',
    'Recall, reflect, and organize without the static noise.'
];

export default function Hero({ onAppSelect }: { onAppSelect: (id: string) => void }) {
    const [index, setIndex] = useState(0);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % SUBTITLES.length);
        }, 3500);

        const handleMouseMove = (e: MouseEvent) => {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                const x = (e.clientX / window.innerWidth) * 2 - 1;
                const y = (e.clientY / window.innerHeight) * 2 - 1;
                setMousePos({ x, y });
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            clearInterval(interval);
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <section
            style={{
                width: '100%',
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '10vh 0'
            }}
        >
            <CinematicBackground />

            <NeuralSurface
                variant="ghost"
                style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'clamp(0.5rem, 1.5vh, 1rem)',
                    position: 'relative',
                    zIndex: 2,
                    padding: 0
                }}
            >
                <Reveal>
                    <LiquidGlass className="px-5 py-2 text-[10px] font-black tracking-[0.45em] text-white/55 uppercase">
                        REFLECT ENGINE // PROTOCOL 01
                    </LiquidGlass>
                </Reveal>

                <Reveal delay={0.05}>
                    <h1
                        style={{
                            fontSize: 'clamp(2rem, 6vw, 5.5rem)',
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            lineHeight: 1.1,
                            margin: 0,
                            color: '#fff',
                            textAlign: 'center',
                            fontFamily: 'var(--font-display)',
                            padding: '0 1rem',
                        }}
                    >
                        The OS for
                        <br />
                        your thoughts.
                    </h1>
                </Reveal>

                <ParallaxLayer offset={16}>
                    <motion.div
                        animate={{
                            x: mousePos.x * 12,
                            y: mousePos.y * 12
                        }}
                        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                        style={{
                            fontSize: 'clamp(3rem, 8vw, 7rem)',
                            fontWeight: 700,
                            fontStyle: 'italic',
                            fontFamily: 'Playfair Display, Georgia, serif',
                            color: 'rgba(255,255,255,0.9)',
                            marginTop: 'clamp(0.5rem, 1.5vh, 1rem)',
                            letterSpacing: '0.05em',
                            textAlign: 'center',
                            willChange: 'transform',
                            textShadow: '0 20px 40px rgba(0,0,0,0.3)'
                        }}
                    >
                        REFLECT
                    </motion.div>
                </ParallaxLayer>

                <div
                    style={{
                        position: 'relative',
                        height: '3rem',
                        marginTop: 'clamp(1rem, 2vh, 1.5rem)',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center'
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 0.4, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                            style={{
                                fontSize: 'clamp(0.8rem, 1.2vw, 0.95rem)',
                                color: 'var(--foreground)',
                                maxWidth: '520px',
                                lineHeight: 1.6,
                                fontWeight: 400,
                                margin: 0,
                                letterSpacing: '0.02em',
                                textAlign: 'center',
                                padding: '0 2rem',
                                position: 'absolute',
                                fontFamily: 'var(--font-sans)',
                                filter: 'blur(0.5px)'
                            }}
                        >
                            {SUBTITLES[index]}
                        </motion.p>
                    </AnimatePresence>
                </div>

                <Reveal delay={0.1}>
                    <div className="mt-5 flex items-center justify-center gap-3 px-4 flex-wrap">
                        <LiquidGlass as="button" className="min-h-11 px-5 py-3 text-sm font-semibold text-white" onClick={() => onAppSelect('session')}>
                            Start Session
                        </LiquidGlass>
                        <LiquidGlass as="button" className="min-h-11 px-5 py-3 text-sm font-semibold text-cyan-200" onClick={() => onAppSelect('insights')}>
                            View Insights
                        </LiquidGlass>
                    </div>
                </Reveal>
            </NeuralSurface>
        </section>
    );
}
