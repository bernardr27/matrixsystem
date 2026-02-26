'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const NeuralFlow = ({ mood = 'neutral' }: { mood?: string }) => {
    const colors: Record<string, string> = {
        neutral: '#3b82f6', // Blue
        focus: '#10b981',   // Emerald
        logic: '#3b82f6',   // Blue
        creative: '#f59e0b', // Amber
        reflection: '#ec4899', // Rose
        rest: '#6366f1',    // Indigo
        chaos: '#ef4444'    // Red
    };

    const activeColor = colors[mood] || colors.neutral;

    // Generate 7 unique fibers with different paths and timings
    const fibers = [
        { d: "M 10 0 Q 25 100 10 200 T 10 400", delay: 0, duration: 8 },
        { d: "M 20 0 Q 5 150 20 300 T 20 600", delay: 1, duration: 10 },
        { d: "M 0 0 Q 30 120 0 240 T 0 480", delay: 2, duration: 7 },
        { d: "M 15 0 Q -10 180 15 360 T 15 720", delay: 1.5, duration: 12 },
        { d: "M -10 0 Q 15 200 -10 400 T -10 800", delay: 0.5, duration: 9 },
        { d: "M -20 0 Q -5 100 -20 200 T -20 400", delay: 2.5, duration: 11 },
        { d: "M 5 0 Q 20 250 5 500 T 5 1000", delay: 3, duration: 13 }
    ];

    return (
        <div style={{
            position: 'absolute',
            inset: 0, // Cover the background space
            zIndex: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center'
        }}>
            <svg width="100" height="100%" viewBox="0 0 100 1000" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                    <linearGradient id="fiberGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor={activeColor} stopOpacity="0.4" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>

                {fibers.map((f, i) => (
                    <React.Fragment key={i}>
                        {/* Static Subtle Line */}
                        <path
                            d={f.d}
                            stroke={activeColor}
                            strokeWidth="0.5"
                            fill="none"
                            opacity="0.03"
                        />

                        {/* Animated Flow Pulse (Optimized: No slow SVG filters) */}
                        <motion.path
                            d={f.d}
                            stroke={activeColor}
                            strokeWidth="1.2"
                            fill="none"
                            initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
                            animate={{
                                pathLength: [0, 0.2, 0],
                                pathOffset: [0, 1.2],
                                opacity: [0, 0.6, 0]
                            }}
                            transition={{
                                duration: f.duration,
                                repeat: Infinity,
                                delay: f.delay,
                                ease: "linear"
                            }}
                            style={{
                                filter: `drop-shadow(0 0 3px ${activeColor})`,
                                willChange: 'pathLength, pathOffset, opacity'
                            }}
                        />

                        {/* Traveling Data Bit */}
                        <motion.circle
                            r="1.2"
                            fill={activeColor}
                            animate={{
                                offsetDistance: ["0%", "100%"],
                                opacity: [0, 1, 1, 0]
                            }}
                            transition={{
                                duration: f.duration,
                                repeat: Infinity,
                                delay: f.delay,
                                ease: "linear"
                            }}
                            style={{
                                offsetPath: `path("${f.d}")`,
                                filter: `drop-shadow(0 0 4px ${activeColor})`,
                                willChange: 'offsetDistance, opacity'
                            } as any}
                        />
                    </React.Fragment>
                ))}
            </svg>
        </div>
    );
};
