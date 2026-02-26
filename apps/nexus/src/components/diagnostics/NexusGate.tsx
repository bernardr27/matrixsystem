'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Shield, Lock, Smartphone, X, Copy, ExternalLink, RefreshCw, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTelemetry } from '@/components/providers/TelemetryProvider';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { NeuralSurface } from '@/components/ui/NeuralSurface';

type GateKey = 'NEXUS' | 'REFLECT' | 'GHOST';

export function NexusGate() {
    const { services, gateUrl, gateUrls, localIp } = useTelemetry();
    const [isCopying, setIsCopying] = React.useState<string | null>(null);
    const [isToggling, setIsToggling] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<GateKey>('NEXUS');
    const [latencyHistory, setLatencyHistory] = React.useState<number[]>(new Array(30).fill(0));

    // -- RESTORED LOGIC --
    const [toggleAction, setToggleAction] = React.useState<'igniting' | 'terminating' | null>(null);
    const [cycleIndex, setCycleIndex] = React.useState(0);

    const gates: { id: GateKey; label: string; url?: string; port: number }[] = [
        { id: 'NEXUS', label: 'Matrix Hub', url: gateUrls?.nexus, port: 3001 },
        { id: 'REFLECT', label: 'Reflect UI', url: gateUrls?.reflect, port: 3000 },
        { id: 'GHOST', label: 'Ghost Cmd', url: gateUrls?.ghost, port: 5173 },
    ];

    const currentGate = gates.find(g => g.id === activeTab) || gates[0];
    const activeDisplayUrl = currentGate.url || (localIp ? `http://${localIp}:${currentGate.port}` : undefined);
    const isCurrentOpen = !!currentGate.url;
    const isAnyTunnelOpen = gates.some(g => !!g.url);

    const isIgniting = isToggling && toggleAction === 'igniting';
    const isTerminating = isToggling && toggleAction === 'terminating';
    const isAnimating = isIgniting || isTerminating;

    // Animation Effect
    React.useEffect(() => {
        if (!isAnimating) {
            setCycleIndex(0);
            return;
        }
        const interval = setInterval(() => {
            setCycleIndex(prev => (prev + 1) % gates.length);
        }, 300);
        return () => clearInterval(interval);
    }, [isAnimating, gates.length]);

    const handleToggleSingle = async (gateId: GateKey) => {
        if (isToggling) return;
        const gate = gates.find(g => g.id === gateId);
        if (!gate) return;

        const action = gate.url ? 'terminating' : 'igniting';
        setToggleAction(action);
        setIsToggling(true);

        try {
            await supabase.from('ghost_bridge').insert({
                command: `gate:${action === 'igniting' ? 'open' : 'close'} ${gateId.toLowerCase()}`,
                source: 'nexus_gate',
                status: 'pending'
            });
            // Wait for effect
            await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
            console.error("Gate Toggle Fault:", e);
        } finally {
            setIsToggling(false);
            setToggleAction(null);
        }
    };

    const handleToggleAll = async () => {
        if (isToggling) return;
        const action = isAnyTunnelOpen ? 'terminating' : 'igniting';
        setToggleAction(action);
        setIsToggling(true);

        try {
            await supabase.from('ghost_bridge').insert({
                command: `gate:${action === 'igniting' ? 'open-all' : 'close-all'}`,
                source: 'nexus_gate',
                status: 'pending'
            });
            await new Promise(r => setTimeout(r, 3000));
        } catch (e) {
            console.error("Master Gate Toggle Fault:", e);
        } finally {
            setIsToggling(false);
            setToggleAction(null);
        }
    };

    const [latency, setLatency] = React.useState<number | null>(null);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setIsCopying(text);
        setTimeout(() => setIsCopying(null), 2000);
    };

    React.useEffect(() => {
        if (!currentGate.url && !localIp) return;

        const target = currentGate.url || `http://${localIp}:${currentGate.port}`;
        const ping = async () => {
            if (document.hidden) return; // Skip pings when tab is not visible
            const start = performance.now();
            try {
                await fetch(target, { mode: 'no-cors' });
                const duration = Math.round(performance.now() - start);
                setLatency(duration);
                setLatencyHistory(prev => [...prev.slice(1), duration]);
            } catch (e) {
                setLatency(null);
                setLatencyHistory(prev => [...prev.slice(1), 0]); // 0 indicates drop
            }
        };

        ping();
        const interval = setInterval(ping, 1000); // 1s interval for smoother graph
        return () => clearInterval(interval);
    }, [currentGate.url, currentGate.port, localIp]);

    // Sparkline Path Generator
    const sparklinePath = React.useMemo(() => {
        if (latencyHistory.length < 2) return '';
        const max = Math.max(...latencyHistory, 100); // Scale to max or at least 100ms
        const min = 0;
        const width = 100; // Relative units
        const height = 40;

        const points = latencyHistory.map((val, i) => {
            const x = (i / (latencyHistory.length - 1)) * width;
            const y = height - ((val - min) / (max - min)) * height;
            return `${x},${y}`;
        });

        return `M ${points.join(' L ')}`;
    }, [latencyHistory]);

    // ... (rest of logic)

    return (
        <NeuralSurface variant="glass" className={cn(
            "p-6 relative overflow-hidden group min-h-[420px] flex flex-col transition-all duration-700",
            isIgniting && "border-cyan-500/40 shadow-[0_0_50px_rgba(34,211,238,0.1)]",
            isTerminating && "border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.15)]"
        )}>
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <Globe size={80} className={cn(
                    "transition-colors",
                    isTerminating ? "text-rose-500" : (isAnyTunnelOpen || isIgniting) ? "text-cyan-400" : "text-slate-600"
                )} />
            </div>

            {isIgniting && (
                <div className="absolute inset-0 bg-cyan-500/5 animate-pulse pointer-events-none z-0" />
            )}
            {isTerminating && (
                <div className="absolute inset-0 bg-rose-500/10 animate-pulse pointer-events-none z-0" />
            )}

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-lg transition-colors shadow-lg",
                            isTerminating ? "bg-rose-500/20 text-rose-400 shadow-rose-500/20" :
                                (isAnyTunnelOpen || isIgniting) ? "bg-cyan-500/20 text-cyan-400 shadow-cyan-500/20" : "bg-slate-500/20 text-slate-400"
                        )}>
                            {isTerminating ? <X size={20} className="animate-pulse" /> :
                                isIgniting ? <Zap size={20} className="animate-bounce" /> : <Shield size={20} />}
                        </div>
                        <div>
                            <h3 className={cn(
                                "text-sm font-bold",
                                isTerminating ? "text-rose-400" : "text-white"
                            )}>
                                {isTerminating ? "Termination Sequence" : isIgniting ? "Ignition Sequence Active" : "Multi-Gate System"}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "w-1.5 h-1.5 rounded-full animate-pulse",
                                    isTerminating ? "bg-rose-500" : (isAnyTunnelOpen || isIgniting) ? "bg-cyan-400" : "bg-slate-600"
                                )} />
                                <span className={cn(
                                    "text-[10px] font-medium uppercase",
                                    isTerminating ? "text-rose-400" : "text-slate-400"
                                )}>
                                    {isTerminating ? "Severing Links..." : isIgniting ? "Cycling Bridges..." : (isAnyTunnelOpen ? "Tunnels Active" : "Local Bridges Only")}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button type="button"
                        onClick={handleToggleAll}
                        disabled={isToggling}
                        className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-xl hover:scale-105 active:scale-95",
                            isAnyTunnelOpen
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                                : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20",
                            isToggling && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isToggling ? <RefreshCw size={12} className="animate-spin" /> : isAnyTunnelOpen ? <X size={12} /> : <Zap size={12} className="text-cyan-400" />}
                        {isAnyTunnelOpen ? "Kill All" : "Ignite All"}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 mb-6">
                    {gates.map((gate, i) => (
                        <button type="button"
                            key={gate.id}
                            onClick={() => setActiveTab(gate.id)}
                            className={cn(
                                "flex-1 pb-2 text-[10px] font-black uppercase tracking-widest transition-all relative",
                                activeTab === gate.id ? "text-white" : "text-slate-500 hover:text-slate-300",
                                isIgniting && cycleIndex === i && "text-cyan-400 scale-110",
                                isTerminating && cycleIndex === i && "text-rose-400 scale-110"
                            )}
                        >
                            {gate.label}
                            {(gate.url || (isAnimating && cycleIndex === i)) && (
                                <span className={cn(
                                    "absolute top-0 right-2 w-1.5 h-1.5 rounded-full transition-all",
                                    isTerminating && cycleIndex === i ? "bg-rose-500 shadow-[0_0_8px_rgb(244,63,94)]" :
                                        isIgniting && cycleIndex === i ? "bg-white shadow-[0_0_8px_white]" : "bg-cyan-400"
                                )} />
                            )}
                            {activeTab === gate.id && (
                                <motion.div layoutId="gate-tab" className={cn(
                                    "absolute bottom-0 left-0 right-0 h-0.5",
                                    isTerminating ? "bg-rose-500" : "bg-cyan-500"
                                )} />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="space-y-6"
                        >
                            {activeDisplayUrl ? (
                                <>
                                    <div className="flex justify-center flex-col items-center gap-4">
                                        <div className="w-full h-10 relative">
                                            {/* Sparkline Visualization */}
                                            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
                                                <defs>
                                                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={currentGate.url ? "#22d3ee" : "#34d399"} stopOpacity="0.5" />
                                                        <stop offset="100%" stopColor={currentGate.url ? "#22d3ee" : "#34d399"} stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                                <path
                                                    d={`${sparklinePath} L 100,40 L 0,40 Z`}
                                                    fill="url(#latencyGradient)"
                                                    className="transition-all duration-300"
                                                />
                                                <path
                                                    d={sparklinePath}
                                                    fill="none"
                                                    stroke={currentGate.url ? "#22d3ee" : "#34d399"}
                                                    strokeWidth="2"
                                                    vectorEffect="non-scaling-stroke"
                                                    className="transition-all duration-300"
                                                />
                                            </svg>
                                            <div className="absolute top-0 right-0 text-[8px] font-mono opacity-50">
                                                LIVE_LATENCY_FLUX
                                            </div>
                                        </div>

                                        <div className="p-3 bg-white rounded-xl shadow-2xl shadow-cyan-500/10">
                                            <QRCodeSVG value={activeDisplayUrl} size={140} />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between gap-3 group/url transition-colors hover:border-white/10">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[8px] uppercase font-bold text-slate-500 mb-0.5">
                                                    {currentGate.url ? "Global Secure Tunnel" : "Local Network Address"}
                                                </div>
                                                <code className={cn("text-[10px] font-mono truncate block", currentGate.url ? "text-cyan-400" : "text-emerald-400")}>
                                                    {activeDisplayUrl}
                                                </code>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {latency && (
                                                    <span className={cn(
                                                        "text-[8px] font-mono font-bold mr-2",
                                                        latency < 100 ? "text-emerald-400" : latency < 300 ? "text-amber-400" : "text-rose-400"
                                                    )}>
                                                        {latency}ms
                                                    </span>
                                                )}
                                                <button type="button"
                                                    onClick={() => copyToClipboard(activeDisplayUrl)}
                                                    className="p-2 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                                >
                                                    {isCopying === activeDisplayUrl ? <Shield size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                                </button>
                                                <a
                                                    href={activeDisplayUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                                >
                                                    <ExternalLink size={14} />
                                                </a>
                                            </div>
                                        </div>

                                        <button type="button"
                                            onClick={() => handleToggleSingle(activeTab)}
                                            disabled={isToggling}
                                            className={cn(
                                                "w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border",
                                                isCurrentOpen
                                                    ? "bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                    : "bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
                                                isToggling && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            {isToggling ? (
                                                <RefreshCw size={14} className="animate-spin" />
                                            ) : isCurrentOpen ? (
                                                <>
                                                    <X size={14} />
                                                    <span>Close {currentGate.label} Tunnel</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Smartphone size={14} />
                                                    <span>Open {currentGate.label} Tunnel</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="p-4 rounded-full bg-slate-500/5 border border-white/5 mb-4 group-hover:border-white/10 transition-colors">
                                        <Lock size={32} className="text-slate-600" />
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium max-w-[200px] mb-6">
                                        Gateway for <span className="text-slate-300">{currentGate.label}</span> is offline.
                                    </p>
                                    <button type="button"
                                        onClick={() => handleToggleSingle(activeTab)}
                                        className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                                    >
                                        Establish Bridge
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </NeuralSurface>
    );
}
