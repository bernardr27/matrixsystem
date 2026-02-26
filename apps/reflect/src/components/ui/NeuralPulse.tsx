'use client';

import { motion } from 'framer-motion';

export default function NeuralPulse({ speed = 1, opacity = 0.3 }: { speed?: number, opacity?: number }) {
    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
            {/* Optimized Liquid Background (CPU-Friendly) */}
            <div style={{ position: 'absolute', inset: 0, opacity }}>
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, 0],
                    }}
                    transition={{ duration: 15 / speed, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: 'absolute',
                        inset: '-10%',
                        background: 'radial-gradient(circle at 20% 30%, rgba(74, 158, 255, 0.15) 0%, transparent 50%)',
                        willChange: 'transform',
                    }}
                />
                <motion.div
                    animate={{
                        scale: [1.1, 1, 1.1],
                        rotate: [180, 185, 180],
                    }}
                    transition={{ duration: 20 / speed, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: 'absolute',
                        inset: '-10%',
                        background: 'radial-gradient(circle at 80% 70%, rgba(138, 43, 226, 0.15) 0%, transparent 50%)',
                        willChange: 'transform',
                    }}
                />
            </div>

            {/* Optimized Pulsing Core */}
            <motion.div
                animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.15 * opacity, 0.25 * opacity, 0.15 * opacity],
                }}
                transition={{ duration: 6 / speed, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 'min(90vw, 600px)',
                    height: 'min(90vw, 600px)',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(74, 158, 255, 0.1) 0%, transparent 70%)',
                    transform: 'translate(-50%, -50%)',
                    filter: 'blur(40px)', // Reduced blur for performance
                    willChange: 'transform, opacity',
                }}
            />

            {/* Static Grid (Low-Overhead) */}
            <svg width="100%" height="100%" style={{ opacity: 0.03 * opacity, position: 'absolute' }}>
                <pattern id="neural-grid" width="100" height="100" patternUnits="userSpaceOnUse">
                    <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#neural-grid)" />
            </svg>
        </div>
    );
}
