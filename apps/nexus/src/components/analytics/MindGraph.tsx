'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTelemetry } from '@/components/providers/TelemetryProvider';
import { useSoul } from '@/components/providers/SoulProvider';

export function MindGraph() {
    const { services, performanceHistory } = useTelemetry();
    const { profile } = useSoul();
    const [dots, setDots] = React.useState<any[]>([]);
    const [mounted, setMounted] = React.useState(false);
    const [systemId, setSystemId] = React.useState('');

    React.useEffect(() => {
        setMounted(true);
        setSystemId(Math.random().toString(16).substring(2, 8).toUpperCase());

        // Generate dots only on the client
        const newDots = Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 2
        }));
        setDots(newDots);
    }, []);

    return (
        <div className="relative h-[280px] w-full bg-[#050510]/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.02] to-cyan-500/[0.02]" />

            {/* Synthetic Particle Field */}
            {mounted && (
                <svg className="absolute inset-0 w-full h-full opacity-30">
                    {dots.map((dot) => (
                        <motion.circle
                            key={dot.id}
                            cx={`${dot.x}%`}
                            cy={`${dot.y}%`}
                            r={dot.size}
                            fill={dot.id % 2 === 0 ? '#22d3ee' : '#a78bfa'}
                            initial={{ opacity: 0.1, scale: 0 }}
                            animate={{
                                opacity: [0.1, 0.5, 0.1],
                                scale: [1, 1.5, 1],
                                y: [0, -20, 0]
                            }}
                            transition={{
                                duration: dot.duration,
                                repeat: Infinity,
                                delay: dot.delay,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </svg>
            )}

            {/* Neural Handshake Visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="w-32 h-32 rounded-full border border-cyan-500/20 blur-xl"
                    />
                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.2],
                            opacity: [0.1, 0.3, 0.1],
                        }}
                        transition={{ duration: 6, repeat: Infinity }}
                        className="absolute inset-0 w-32 h-32 rounded-full border border-violet-500/20 blur-xl"
                    />
                </div>
            </div>

            {/* HUD Overlay */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Neural_Resonance_Graph</h4>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                            <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Active_Telemetry</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.3em] block">Coherence_Rating</span>
                        <span className="text-lg font-mono font-bold text-white tracking-tighter">
                            {profile?.reflection_points || '—'}
                        </span>
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <div className="flex gap-4">
                        <div className="space-y-1">
                            <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest block">Resonance</span>
                            <div className="flex gap-0.5 h-3 items-end">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [4, 12, 6, 10, 4] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                        className="w-1 bg-violet-500/30 rounded-t-sm"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    {mounted && (
                        <div className="text-[7px] font-mono text-slate-500 uppercase tracking-[0.2em] bg-white/[0.03] border border-white/5 px-2 py-1 rounded-md">
                            SYS::{systemId}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
