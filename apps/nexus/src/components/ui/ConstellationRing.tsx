'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTelemetry } from '@/components/providers/TelemetryProvider';
import { cn } from '@/lib/utils';
import { Shield, Zap, Activity, Globe, LayoutDashboard, Ghost } from 'lucide-react';

interface ServiceNode {
    key: string;
    label: string;
    icon: React.ElementType;
    angle: number;
}

const SERVICE_NODES: ServiceNode[] = [
    { key: 'nexus', label: 'Matrix Hub', icon: LayoutDashboard, angle: -90 }, // Top
    { key: 'ghost', label: 'Ghost', icon: Ghost, angle: -30 },           // Top Right
    { key: 'gate', label: 'Gate', icon: Globe, angle: 30 },              // Bottom Right
    { key: 'sentinel', label: 'Sentinel', icon: Shield, angle: 90 },     // Bottom
    { key: 'runner', label: 'Runner', icon: Zap, angle: 150 },           // Bottom Left
    { key: 'reflect', label: 'Reflect', icon: Activity, angle: 210 },    // Top Left
];

export function ConstellationRing() {
    const { services, isSyncing, lastPulse, resonance } = useTelemetry();
    const [isResonating, setIsResonating] = React.useState(false);

    React.useEffect(() => {
        if (resonance && Date.now() - resonance.timestamp < 3000) {
            setIsResonating(true);
            const timer = setTimeout(() => setIsResonating(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [resonance]);

    const pulseLatency = useMemo(() => {
        const now = Date.now();
        const latencies = Object.values(lastPulse).filter(t => t > 0).map(t => now - t);
        if (latencies.length === 0) return 5000;
        return Math.min(...latencies);
    }, [lastPulse]);

    const pulseSpeed = useMemo(() => {
        // Map latency (0-30000ms) to duration (0.5s - 5s)
        const dur = (pulseLatency / 30000) * 4.5 + 0.5;
        return Math.max(0.5, Math.min(5, dur));
    }, [pulseLatency]);

    const { onlineCount, totalCount, systemState } = useMemo(() => {
        const statuses = Object.values(services);
        const online = statuses.filter(s => s === 'online').length;
        const anyConnecting = statuses.some(s => s === 'connecting');
        const anyError = statuses.some(s => s === 'error');

        let state: 'nominal' | 'partial' | 'critical' | 'syncing' | 'offline' = 'offline';
        if (anyError) state = 'critical';
        else if (isSyncing || anyConnecting) state = 'syncing';
        else if (online === statuses.length) state = 'nominal';
        else if (online > 0) state = 'partial';

        return { onlineCount: online, totalCount: statuses.length, systemState: state };
    }, [services, isSyncing]);

    const ringRadius = 200; // Reduced from 320 for tighter fit

    // Generate connection lines between online services
    const connections = useMemo(() => {
        const activeNodes = SERVICE_NODES.filter(n =>
            services[n.key as keyof typeof services] === 'online' ||
            services[n.key as keyof typeof services] === 'connecting'
        );
        const lines: { from: ServiceNode; to: ServiceNode }[] = [];
        for (let i = 0; i < activeNodes.length; i++) {
            for (let j = i + 1; j < activeNodes.length; j++) {
                lines.push({ from: activeNodes[i], to: activeNodes[j] });
            }
        }
        return lines;
    }, [services]);

    const getNodePosition = (angle: number) => {
        const rad = (angle * Math.PI) / 180;
        return {
            x: Math.cos(rad) * ringRadius,
            y: Math.sin(rad) * ringRadius,
        };
    };

    const stateColors = {
        nominal: {
            ring: 'border-cyan-500/20',
            glow: 'shadow-[0_0_30px_rgba(34,211,238,0.3)]',
            text: 'text-cyan-400',
            stroke: 'text-cyan-500',
            gradient: ['#22d3ee', '#06b6d4'],
            ambient: 'bg-cyan-900/10'
        },
        partial: {
            ring: 'border-amber-500/20',
            glow: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]',
            text: 'text-amber-400',
            stroke: 'text-amber-500',
            gradient: ['#fbbf24', '#d97706'],
            ambient: 'bg-amber-900/10'
        },
        critical: {
            ring: 'border-rose-500/30',
            glow: 'shadow-[0_0_40px_rgba(244,63,94,0.4)]',
            text: 'text-rose-400',
            stroke: 'text-rose-500',
            gradient: ['#f43f5e', '#e11d48'],
            ambient: 'bg-rose-900/20'
        },
        syncing: {
            ring: 'border-violet-500/30',
            glow: 'shadow-[0_0_40px_rgba(167,139,250,0.4)]',
            text: 'text-violet-400',
            stroke: 'text-violet-500',
            gradient: ['#a78bfa', '#7c3aed'],
            ambient: 'bg-violet-900/20'
        },
        offline: {
            ring: 'border-slate-700/30',
            glow: '',
            text: 'text-slate-500',
            stroke: 'text-slate-600',
            gradient: ['#64748b', '#475569'],
            ambient: 'bg-slate-900/30'
        },
    };

    const colors = stateColors[systemState];
    const [containerScale, setContainerScale] = React.useState(1);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                const baseWidth = 700; // Adjusted for 640px diameter + some margin
                if (width > 0 && width < baseWidth) {
                    setContainerScale(width / baseWidth);
                } else {
                    setContainerScale(1);
                }
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative flex items-center justify-center w-full h-[500px] sm:h-[650px] overflow-visible z-0 mt-4 mb-4 perspective-[2000px]"
        >
            <div
                style={{
                    transform: `scale(${containerScale})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    willChange: 'transform'
                }}
            >
                {/* 3D Perspective Container */}

                {/* Dynamic Gradient Defs */}
                <svg width="0" height="0">
                    <defs>
                        <linearGradient id="circuit-gradient" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor={colors.gradient[0]} stopOpacity="0.1" />
                            <stop offset="50%" stopColor={colors.gradient[0]} stopOpacity="1" />
                            <stop offset="100%" stopColor={colors.gradient[1]} stopOpacity="0.1" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Ambient Background Field */}
                <motion.div
                    animate={{
                        opacity: systemState === 'syncing' ? [0.1, 0.3, 0.1] : 0.15,
                        scale: systemState === 'syncing' ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className={cn("absolute w-[400px] sm:w-[700px] h-[400px] sm:h-[700px] rounded-full blur-[80px] sm:blur-[120px] pointer-events-none", colors.ambient)}
                />

                {/* Resonance Wave */}
                {isResonating && (
                    <motion.div
                        initial={{ scale: 0.2, opacity: 0.8 }}
                        animate={{ scale: 3, opacity: 0 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="absolute w-[400px] h-[400px] rounded-full border-2 border-indigo-500/50 shadow-[0_0_100px_rgba(99,102,241,0.5)] pointer-events-none z-50"
                        key={resonance?.timestamp}
                    />
                )}

                {/* === GIMBAL RINGS SYSTEM === */}
                <div className="absolute flex items-center justify-center pointer-events-none">
                    {/* Synaptic Core Pulse (Only on resonance) */}
                    {isResonating && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="absolute w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl z-[-1]"
                        />
                    )}



                    {/* Ring Alpha: Outer Yaw (Y-Axis Spin) */}
                    <motion.div
                        className={cn("absolute rounded-full border border-dashed opacity-20", colors.ring)}
                        style={{ width: 500, height: 500, borderWidth: '1px' }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Ring Beta: Middle Pitch (X-Axis Spin) */}
                    <motion.div
                        className={cn("absolute rounded-full border border-dotted opacity-30", colors.ring)}
                        style={{ width: 440, height: 440, borderWidth: '2px' }}
                        animate={{ rotate: -360 }}
                        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                    />


                </div>

                {/* === MAIN DATA PLANE (Nodes & Connections) === */}
                <div className="relative w-full h-full flex items-center justify-center">

                    {/* Orbital Container - Spins on Z-axis only */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        animate={{
                            rotate: systemState === 'syncing' ? 360 : 0,
                        }}
                        transition={{
                            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
                        }}
                    >
                        {/* Connection Layer (Circuit Board) */}
                        <svg
                            className="absolute w-[650px] h-[650px] pointer-events-none overflow-visible"
                            viewBox="-325 -325 650 650"
                            style={{ transform: 'translateZ(0px)' }} // Explicit Z-index
                        >
                            <g>
                                {connections.map((conn, i) => {
                                    const nodeRadius = 24; // Flush with node edge
                                    const posFrom = getNodePosition(conn.from.angle);
                                    const posTo = getNodePosition(conn.to.angle);

                                    const dx = posTo.x - posFrom.x;
                                    const dy = posTo.y - posFrom.y;
                                    const dist = Math.sqrt(dx * dx + dy * dy);
                                    const uX = dx / dist; const uY = dy / dist;

                                    const pX = -uY; const pY = uX;
                                    const railOffset = 4;

                                    const start = { x: posFrom.x + uX * nodeRadius, y: posFrom.y + uY * nodeRadius };
                                    const end = { x: posTo.x - uX * nodeRadius, y: posTo.y - uY * nodeRadius };

                                    return (
                                        <React.Fragment key={`${conn.from.key}-${conn.to.key}`}>
                                            {/* Core Beam */}
                                            <motion.line
                                                x1={start.x} y1={start.y} x2={end.x} y2={end.y}
                                                stroke={colors.stroke} strokeWidth={1.5} strokeOpacity={0.8}
                                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                                transition={{ duration: 1, delay: i * 0.05 }}
                                            />
                                            {/* Rails */}
                                            <motion.line
                                                x1={start.x + pX * railOffset} y1={start.y + pY * railOffset}
                                                x2={end.x + pX * railOffset} y2={end.y + pY * railOffset}
                                                stroke={colors.stroke} strokeWidth={0.5} strokeOpacity={0.3} strokeDasharray="4 4"
                                            />
                                            <motion.line
                                                x1={start.x - pX * railOffset} y1={start.y - pY * railOffset}
                                                x2={end.x - pX * railOffset} y2={end.y - pY * railOffset}
                                                stroke={colors.stroke} strokeWidth={0.5} strokeOpacity={0.3} strokeDasharray="4 4"
                                            />
                                            {/* Data Packet Pulse */}
                                            <motion.line
                                                x1={start.x} y1={start.y} x2={end.x} y2={end.y}
                                                stroke="url(#circuit-gradient)" strokeWidth={3} strokeLinecap="square"
                                                initial={{ strokeDasharray: "0 1" }}
                                                animate={{
                                                    strokeDasharray: ["0 80 20 80", "0 80 100 80", "0 80 20 80"],
                                                    strokeDashoffset: [0, -dist]
                                                }}
                                                transition={{
                                                    duration: 1.5 + (i % 3) * 0.5, repeat: Infinity, ease: "linear", delay: i * 0.1
                                                }}
                                            />
                                        </React.Fragment>
                                    );
                                })}
                            </g>
                        </svg>

                        {/* Nodes Layer - Floating above connections */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {SERVICE_NODES.map((node) => {
                                const pos = getNodePosition(node.angle);
                                const status = services[node.key as keyof typeof services];
                                const isOnline = status === 'online';
                                const isConnecting = status === 'connecting';
                                const isSyncingMode = systemState === 'syncing';
                                const Icon = node.icon;

                                return (
                                    <motion.div
                                        key={node.key}
                                        className="absolute cursor-pointer z-50 group pointer-events-auto"
                                        style={{
                                            transform: `translate3d(${pos.x}px, ${pos.y}px, 0px)`, // Flat plane for stability
                                            transformStyle: "preserve-3d"
                                        }}
                                        whileHover={{ scale: 1.2, z: 50 }}
                                    >

                                        <motion.div
                                            className={cn("relative w-14 h-14 flex items-center justify-center transition-all duration-500")}
                                            animate={{
                                                rotate: systemState === 'syncing' ? -360 : 0, // Counter-spin
                                            }}
                                            transition={{
                                                rotate: { duration: 25, repeat: Infinity, ease: "linear" },
                                            }}
                                        >
                                            <div className={cn(
                                                "absolute inset-0 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500",
                                                isSyncingMode ? "bg-violet-500" : (isOnline ? "bg-cyan-500" : "bg-violet-500")
                                            )} />

                                            <div className={cn(
                                                "relative w-full h-full rounded-[1.5rem] border backdrop-blur-xl flex flex-col items-center justify-center shadow-lg transition-all duration-500",
                                                isSyncingMode ? "bg-slate-900/60 border-violet-500/50 shadow-violet-500/20" :
                                                    isOnline ? "bg-slate-900/60 border-cyan-500/30 shadow-cyan-500/10 group-hover:border-cyan-400" :
                                                        "bg-slate-950/80 border-slate-700/30 opacity-60"
                                            )}>
                                                <Icon size={20} className={cn("transition-colors duration-300",
                                                    isSyncingMode ? "text-violet-300" : isOnline ? "text-cyan-400" : "text-slate-600")} />
                                                <span className={cn("text-[10px] font-black uppercase tracking-wider mt-1.5",
                                                    isSyncingMode ? "text-violet-400" : isOnline ? "text-cyan-500/80" : "text-slate-600")}>
                                                    {node.label}
                                                </span>
                                            </div>

                                            {/* Status Pips */}
                                            {(isOnline || isSyncingMode) && (
                                                <motion.div
                                                    className={cn("absolute -top-1 -right-1 w-3 h-3 rounded-full shadow border border-slate-900",
                                                        isSyncingMode ? "bg-violet-400" : "bg-cyan-400")}
                                                    animate={{ scale: [1, 1.3, 1] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                />
                                            )}
                                        </motion.div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* CENTRAL CORE: THE BRAIN */}
                    <div className="relative z-20 flex flex-col items-center justify-center transform-style-preserve-3d">
                        {/* Inner spinning reactor */}
                        <motion.div
                            className={cn("absolute w-24 h-24 rounded-full border border-dashed opacity-30", colors.ring)}
                            animate={{ rotate: 360, scale: [0.95, 1.05, 0.95] }}
                            transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, scale: { duration: 3, repeat: Infinity } }}
                        />
                        <div className={cn("absolute w-16 h-16 rounded-full border opacity-40 backdrop-blur-sm", colors.ring)} />

                        {/* Floating HUD Text */}
                        <div className="flex flex-col items-center gap-0.5 z-30">
                            <motion.span
                                animate={isResonating ? {
                                    scale: [1, 1.25, 1],
                                    color: ['#22d3ee', '#6366f1', '#22d3ee'],
                                    textShadow: ['0 0 10px #22d3ee', '0 0 30px #6366f1', '0 0 10px #22d3ee']
                                } : {}}
                                className={cn("text-3xl font-black tracking-tighter tabular-nums drop-shadow-lg", colors.text)}
                            >
                                {totalCount > 0 ? Math.floor((onlineCount / totalCount) * 100) : 0}<span className="text-sm opacity-60">%</span>
                            </motion.span>
                            <motion.div
                                animate={isResonating ? { opacity: [0.8, 1, 0.8], y: [-2, 0, -2] } : {}}
                                className={cn("text-[8px] font-bold tracking-[0.2em] uppercase opacity-80", colors.text)}
                            >
                                {isResonating ? 'RESONATING' : (systemState === 'nominal' ? 'OPTIMAL' : systemState.toUpperCase())}
                            </motion.div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
