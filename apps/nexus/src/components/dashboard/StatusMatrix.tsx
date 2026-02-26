'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTelemetry } from '@/components/providers/TelemetryProvider';
import { cn } from '@/lib/utils';
import { Zap, Activity, Globe, LayoutDashboard, Ghost, Hexagon, Server } from 'lucide-react';
import { NeuralSurface } from '@/components/ui/NeuralSurface';

interface Node {
    key: string;
    label: string;
    icon: React.ElementType;
    color: string;
}

const NODES: Node[] = [
    { key: 'nexus', label: 'Matrix Hub', icon: LayoutDashboard, color: 'text-cyan-400' },
    { key: 'reflect', label: 'Reflect UI', icon: Activity, color: 'text-blue-400' },
    { key: 'ghost', label: 'Ghost Cmd', icon: Ghost, color: 'text-violet-400' },
    { key: 'rocket', label: 'Rocket Cmd', icon: Zap, color: 'text-amber-400' },
    { key: 'gate', label: 'Gateway', icon: Globe, color: 'text-emerald-400' },
];

export function StatusMatrix() {
    const { services } = useTelemetry();
    const [hovered, setHovered] = useState<string | null>(null);

    return (
        <NeuralSurface variant="neumorphic" className="w-full relative overflow-hidden min-h-[140px] flex items-center p-6 border-none bg-black/40">
            {/* Veylix Background Texture */}
            <div className="absolute inset-0 industrial-grid opacity-[0.05] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent rotate-12 blur-3xl" />

            <div className="w-full flex items-center justify-between gap-4 relative z-10">
                {NODES.map((node, i) => {
                    const status = services[node.key as keyof typeof services] || 'offline';
                    const isOnline = status === 'online';

                    return (
                        <motion.div
                            key={node.key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.5 }}
                            className="flex-1"
                            onMouseEnter={() => setHovered(node.key)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <NeuralSurface
                                variant={isOnline ? 'neumorphic' : 'glass'}
                                className={cn(
                                    "p-4 flex flex-col items-center gap-3 transition-all duration-500",
                                    isOnline ? "shadow-[var(--m-shadow-neumorphic-outer)] border-white/5" : "opacity-40 grayscale",
                                    hovered === node.key ? "scale-105" : ""
                                )}
                                hoverEffect
                            >
                                {/* THE ICON RING (Nova Style) */}
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 relative",
                                    isOnline ? "bg-black/40 shadow-[var(--m-shadow-neumorphic-inner)]" : "bg-white/5"
                                )}>
                                    {isOnline && (
                                        <div className={cn(
                                            "absolute inset-0 rounded-2xl opacity-20 blur-md animate-pulse",
                                            node.color.replace('text-', 'bg-')
                                        )} />
                                    )}
                                    <node.icon
                                        size={20}
                                        className={cn(
                                            "relative z-10 transition-transform duration-500",
                                            isOnline ? node.color : "text-slate-600",
                                            hovered === node.key ? "scale-110" : ""
                                        )}
                                    />
                                </div>

                                {/* Status Details */}
                                <div className="flex flex-col items-center text-center">
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-[0.2em] mb-1",
                                        isOnline ? "text-white" : "text-slate-700"
                                    )}>
                                        {node.label.split(' ')[0]}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <div className={cn(
                                            "w-1 h-1 rounded-full",
                                            isOnline ? "bg-cyan-400 animate-pulse shadow-[0_0_8px_cyan]" : "bg-red-500"
                                        )} />
                                        <span className={cn(
                                            "text-[7px] font-mono tracking-widest uppercase",
                                            isOnline ? "text-cyan-500/80" : "text-red-900"
                                        )}>
                                            {status}
                                        </span>
                                    </div>
                                </div>

                                {/* Indicator bar */}
                                <div className="mt-1 flex gap-0.5">
                                    {[1, 2, 3, 4].map(b => (
                                        <div key={b} className={cn(
                                            "w-3 h-[2px] rounded-full transition-colors",
                                            isOnline ? (b <= (i % 3 + 2) ? "bg-cyan-500/40" : "bg-white/5") : "bg-white/5"
                                        )} />
                                    ))}
                                </div>
                            </NeuralSurface>
                        </motion.div>
                    );
                })}
            </div>
        </NeuralSurface>
    );
}
