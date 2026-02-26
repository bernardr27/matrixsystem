import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralSurface } from '../ui/NeuralSurface';

const SUBTITLES = [
    "A high-fidelity spatial environment for cognitive clarity.",
    "Engineered silence. A workspace for deep, structured thought.",
    "The operating system for your mind's eye.",
    "Fluid digital architecture designed for flow state.",
    "Recall, reflect, and organize without the static noise."
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
        <section style={{
            width: '100%',
            background: 'transparent',
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10vh 0'
        }}>
            {/* Optimized Background Glow */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80%',
                height: '80%',
                maxWidth: '800px',
                maxHeight: '800px',
                background: 'radial-gradient(circle, rgba(74, 158, 255, 0.05) 0%, transparent 75%)',
                filter: 'blur(100px)',
                zIndex: 0,
                pointerEvents: 'none',
                opacity: 0.8
            }} />

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
                <motion.div
                    animate={{ opacity: [0.15, 0.4, 0.15] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        fontSize: 'clamp(0.5rem, 0.8vw, 0.6rem)',
                        fontWeight: 900,
                        letterSpacing: '0.6em',
                        color: 'var(--foreground)',
                        opacity: 0.2,
                        textIndent: '0.6em',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-sans)'
                    }}
                >
                    REFLECT ENGINE // PROTOCOL 01
                </motion.div>

                <h1 style={{
                    fontSize: 'clamp(2rem, 6vw, 5.5rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    margin: 0,
                    color: '#fff',
                    textAlign: 'center',
                    fontFamily: 'var(--font-display)',
                }}>
                    The OS for<br />your thoughts.
                </h1>

                {/* Stabilized Magnetic Title */}
                <motion.div
                    animate={{
                        x: mousePos.x * 12,
                        y: mousePos.y * 12
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                    style={{
                        fontSize: 'clamp(4rem, 8vw, 7rem)',
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

                <div style={{ position: 'relative', height: '3rem', marginTop: 'clamp(1rem, 2vh, 1.5rem)', width: '100%', display: 'flex', justifyContent: 'center' }}>
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
            </NeuralSurface>
        </section >
    );
}
