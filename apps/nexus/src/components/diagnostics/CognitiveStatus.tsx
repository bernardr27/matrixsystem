'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '@/components/providers/TelemetryProvider';
import { cn } from '@/lib/utils';
import { Brain, Zap, Cloud, HardDrive, Activity, Sparkles } from 'lucide-react';
import { NeuralSurface } from '../ui/NeuralSurface';

export function CognitiveStatus() {
    const { services, aiMode, performanceHistory } = useTelemetry();

    const isRunnerOnline = services.runner === 'online';
    const isGhostOnline = services.ghost === 'online';
    const isGroq = aiMode === 'groq';
    const isOllama = aiMode === 'ollama';

    const brainColor = useMemo(() => {
        if (!isRunnerOnline) return 'text-red-500';
        if (isGroq) return 'text-cyan-400';
        if (isOllama) return 'text-violet-400';
        return 'text-slate-500';
    }, [isRunnerOnline, isGroq, isOllama]);

    const statusLabel = useMemo(() => {
        if (!isRunnerOnline) return 'OFFLINE';
        if (isGroq) return 'GROQ CLOUD';
        if (isOllama) return 'LOCAL OLLAMA';
        return 'INITIALIZING';
    }, [isRunnerOnline, isGroq, isOllama]);

    const modelName = useMemo(() => {
        if (isGroq) return 'llama-3.3-70b';
        if (isOllama) return 'qwen2.5:7b';
        return '—';
    }, [isGroq, isOllama]);

    const latestRam = performanceHistory[performanceHistory.length - 1]?.ram || 0;

    return (
        <NeuralSurface variant="neumorphic" className="p-4 sm:p-5 h-full flex flex-col space-y-4 relative overflow-hidden group">
            {/* Ambient glow */}
            <div className={cn(
                "absolute inset-0 opacity-20 blur-[100px] pointer-events-none transition-all duration-1000",
                isGroq ? "bg-cyan-500/10" : isOllama ? "bg-violet-500/10" : "bg-transparent"
            )} />

            {/* Header */}
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2 rounded-xl border transition-all duration-700",
                        isRunnerOnline
                            ? isGroq
                                ? "bg-cyan-500/10 border-cyan-500/20"
                                : "bg-violet-500/10 border-violet-500/20"
                            : "bg-red-500/10 border-red-500/20"
                    )}>
                        <Brain size={16} className={cn(brainColor, "transition-colors duration-700")} />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white leading-none">Sage Core</h3>
                        <p className="text-[8px] text-slate-600 font-bold tracking-widest uppercase mt-0.5 opacity-60">
                            Neural Engine
                        </p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={statusLabel}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={cn(
                            "px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em] border",
                            isGroq ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" :
                                isOllama ? "bg-violet-500/10 border-violet-500/30 text-violet-400" :
                                    "bg-red-500/10 border-red-500/30 text-red-400"
                        )}
                    >
                        <span className="flex items-center gap-1">
                            {isGroq ? <Cloud size={8} /> : isOllama ? <HardDrive size={8} /> : <Activity size={8} />}
                            {statusLabel}
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10">
                {/* AI Engine */}
                <div className="p-3 rounded-xl bg-[var(--m-bg-primary)] shadow-[var(--m-shadow-neumorphic-inner)] border border-white/5 hover:border-cyan-500/20 transition-all duration-700">
                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1 flex items-center gap-1">
                        <Sparkles size={8} className={brainColor} />
                        Engine
                    </div>
                    <motion.div className={cn("text-xs font-bold leading-none", brainColor)}>
                        {isGroq ? 'Groq' : isOllama ? 'Ollama' : 'Offline'}
                    </motion.div>
                    <div className="text-[8px] text-slate-700 font-mono mt-0.5 truncate">{modelName}</div>
                </div>

                {/* Status Items */}
                <div className="p-3 rounded-xl bg-[var(--m-bg-primary)] shadow-[var(--m-shadow-neumorphic-inner)] border border-white/5 hover:border-emerald-500/20 transition-all duration-700">
                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1 flex items-center gap-1">
                        <Brain size={8} className="text-emerald-500" />
                        Brain
                    </div>
                    <div className={cn("text-xs font-bold leading-none", isRunnerOnline ? "text-emerald-400" : "text-red-400")}>
                        {isRunnerOnline ? 'Active' : 'Idle'}
                    </div>
                    <div className="text-[8px] text-slate-700 font-mono mt-0.5">{isRunnerOnline ? 'Syncing' : 'Waiting'}</div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--m-bg-primary)] shadow-[var(--m-shadow-neumorphic-inner)] border border-white/5 hover:border-amber-500/20 transition-all duration-700">
                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1 flex items-center gap-1">
                        <Activity size={8} className="text-amber-500" />
                        RAM Load
                    </div>
                    <div className={cn("text-xs font-bold font-mono leading-none", latestRam > 90 ? "text-red-400" : "text-emerald-400")}>
                        {latestRam}%
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--m-bg-primary)] shadow-[var(--m-shadow-neumorphic-inner)] border border-white/5 hover:border-cyan-500/20 transition-all duration-700">
                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1 flex items-center gap-1">
                        <Zap size={8} className="text-cyan-500" />
                        Network
                    </div>
                    <div className={cn("text-xs font-bold leading-none", isRunnerOnline && isGhostOnline ? "text-emerald-400" : "text-amber-400")}>
                        {isRunnerOnline && isGhostOnline ? 'Optimal' : isRunnerOnline || isGhostOnline ? 'Degraded' : 'Offline'}
                    </div>
                </div>
            </div>

            {/* Neural Pathway Animation */}
            {isRunnerOnline && (
                <div className="relative z-10 h-1 rounded-full overflow-hidden bg-white/5">
                    <motion.div
                        className={cn(
                            "h-full rounded-full",
                            isGroq ? "bg-gradient-to-r from-transparent via-cyan-500 to-transparent" :
                                "bg-gradient-to-r from-transparent via-violet-500 to-transparent"
                        )}
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        style={{ width: '40%' }}
                    />
                </div>
            )}
        </NeuralSurface>
    );
}
