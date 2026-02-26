'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '@/components/providers/TelemetryProvider';
import { cn } from '@/lib/utils';
import { Zap, Activity, Globe, LayoutDashboard, Ghost, Hexagon } from 'lucide-react';
import { NeuralSurface } from './NeuralSurface';

interface ServiceNode {
    key: string;
    label: string;
    icon: React.ElementType;
    color: string;
}

const NODES: ServiceNode[] = [
    { key: 'nexus', label: 'MATRIX HUB', icon: LayoutDashboard, color: 'text-cyan-400' },
    { key: 'ghost', label: 'GHOST', icon: Ghost, color: 'text-violet-400' },
    { key: 'gate', label: 'GATE', icon: Globe, color: 'text-emerald-400' },
    { key: 'rocket', label: 'ROCKET', icon: Zap, color: 'text-amber-400' },
    { key: 'reflect', label: 'REFLECT', icon: Activity, color: 'text-blue-400' },
];

export function NeuralConstellation() {
    const { services, isSyncing, lastPulse, resonance } = useTelemetry();
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Calculate system health for the core pulse
    const systemHealth = useMemo(() => {
        const statuses = Object.values(services);
        const online = statuses.filter(s => s === 'online').length;
        if (online === statuses.length) return 'nominal';
        if (online > 0) return 'partial';
        return 'critical';
    }, [services]);

    // Hexagonal Layout Calculation
    const radius = 180;
    const getNodePosition = (index: number, total: number) => {
        const angle = (index * 360) / total - 90; // Start top
        const rad = (angle * Math.PI) / 180;
        return {
            x: Math.cos(rad) * radius,
            y: Math.sin(rad) * radius,
        };
    };

    return (
        <div className="relative w-full max-w-[600px] aspect-square flex items-center justify-center">

            {/* Ambient Field */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.02] to-violet-500/[0.02] rounded-full blur-3xl pointer-events-none" />

            {/* Central Core - The Brain */}
            <div className="absolute z-10 flex items-center justify-center">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className={cn(
                        "w-32 h-32 rounded-full blur-2xl absolute",
                        systemHealth === 'nominal' ? "bg-cyan-500/20" : "bg-rose-500/20"
                    )}
                />
                <NeuralSurface className="w-24 h-24 rounded-full flex items-center justify-center border-2 border-white/10 z-20 overflow-hidden relative">
                    <div className="absolute inset-0 bg-slate-950/80" />
                    <Hexagon size={40} className={cn(
                        "relative z-10 animate-pulse-slow",
                        systemHealth === 'nominal' ? "text-cyan-400" : "text-rose-400"
                    )} />
                </NeuralSurface>

                {/* Core Rings */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute w-40 h-40 rounded-full border border-dashed border-white/10 pointer-events-none"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute w-36 h-36 rounded-full border border-dotted border-white/10 pointer-events-none"
                />
            </div>

            {/* Service Nodes */}
            <div className="absolute inset-0">
                {NODES.map((node, i) => {
                    const pos = getNodePosition(i, NODES.length);
                    const status = services[node.key as keyof typeof services] || 'offline';
                    const isOnline = status === 'online';

                    return (
                        <motion.div
                            key={node.key}
                            className="absolute top-1/2 left-1/2 w-0 h-0"
                            initial={{ x: 0, y: 0, opacity: 0 }}
                            animate={{
                                x: pos.x,
                                y: pos.y,
                                opacity: 1,
                                scale: hoveredNode === node.key ? 1.1 : 1
                            }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            style={{ marginLeft: -32, marginTop: -32 }} // Center offset (w-16/2)
                        >
                            <div
                                className="relative group cursor-pointer"
                                onMouseEnter={() => setHoveredNode(node.key)}
                                onMouseLeave={() => setHoveredNode(null)}
                            >
                                {/* Connection Line to Center */}
                                <svg className="absolute top-1/2 left-1/2 w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none overflow-visible">
                                    <motion.line
                                        x1="50%" y1="50%"
                                        x2={150 - pos.x} y2={150 - pos.y} // Inverted vector to center? No, simple line
                                        stroke={isOnline ? `url(#line-gradient-${node.key})` : "#334155"}
                                        strokeWidth="1"
                                        strokeDasharray="4 4"
                                    />
                                    <defs>
                                        <linearGradient id={`line-gradient-${node.key}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="rgba(34, 211, 238, 0)" />
                                            <stop offset="50%" stopColor="rgba(34, 211, 238, 0.3)" />
                                            <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
                                        </linearGradient>
                                    </defs>
                                </svg>

                                {/* Node Body */}
                                <NeuralSurface
                                    className={cn(
                                        "w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 border",
                                        isOnline
                                            ? "border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                                            : "border-white/10 bg-white/[0.02] opacity-80", // Increased visibility for offline nodes
                                        hoveredNode === node.key ? "scale-110 z-50 bg-slate-900 border-cyan-400" : ""
                                    )}
                                >
                                    <node.icon
                                        size={22}
                                        className={cn(
                                            "transition-colors duration-500",
                                            isOnline ? node.color : "text-slate-400" // Use slate-400 instead of 600 for visibility
                                        )}
                                    />
                                    <div className="flex flex-col items-center gap-0.5">
                                        <span className={cn(
                                            "text-[7px] font-black tracking-widest leading-none",
                                            isOnline ? "text-cyan-400/80" : "text-slate-500"
                                        )}>
                                            {node.label}
                                        </span>
                                        <div className={cn(
                                            "w-1 h-1 rounded-full transition-colors",
                                            isOnline ? "bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]" : "bg-rose-500/50"
                                        )} />
                                    </div>
                                </NeuralSurface>

                                {/* Label (Floating) */}
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] font-black tracking-[0.2em] text-cyan-400 bg-black/80 px-2 py-1 rounded backdrop-blur-md border border-white/10 block">
                                        {node.label}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Orbiting Particles (Visual Flair) */}
            <motion.div
                className="absolute w-[450px] h-[450px] rounded-full border border-white/5 pointer-events-none"
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-500 blur-sm shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
            </motion.div>

        </div>
    );
}
