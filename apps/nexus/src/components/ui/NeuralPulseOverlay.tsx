'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Zap, Shield, X, Activity, AlertTriangle, Server, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NeuralSurface } from './NeuralSurface';
import { useTelemetry } from '@/components/providers/TelemetryProvider';

interface PulseAlert {
    id: string;
    title: string;
    message: string;
    type: 'synergy' | 'warning' | 'info' | 'neural_pulse' | 'reload' | 'error' | 'critical' | 'recovery';
    timestamp: number;
}

const SEVERITY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
    info: { icon: <Activity size={28} />, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30' },
    warning: { icon: <AlertTriangle size={28} />, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
    error: { icon: <X size={28} />, color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30' },
    critical: { icon: <Zap size={28} />, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
    recovery: { icon: <CheckCircle size={28} />, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
    neural_pulse: { icon: <Zap size={28} />, color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/30' },
    synergy: { icon: <Brain size={28} />, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30' },
    reload: { icon: <X size={28} />, color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30' },
};

export function NeuralPulseOverlay() {
    // Consume broadcasts from TelemetryProvider instead of opening 2 extra Supabase channels
    const { broadcasts } = useTelemetry();
    const [alerts, setAlerts] = useState<PulseAlert[]>([]);
    const [eventCount, setEventCount] = useState(0);
    const lastSeenBroadcastRef = useRef<string | null>(null);

    // React to new broadcasts from TelemetryProvider (which already has the ghost_bridge channel open)
    useEffect(() => {
        if (!broadcasts || broadcasts.length === 0) return;
        const latest = broadcasts[0]; // broadcasts are prepended (newest first)
        if (!latest || latest.id === lastSeenBroadcastRef.current) return;
        lastSeenBroadcastRef.current = latest.id;

        const alert: PulseAlert = {
            id: latest.id,
            title: 'SYSTEM',
            message: latest.message,
            type: 'info',
            timestamp: Date.now()
        };

        setAlerts(prev => [...prev.slice(-4), alert]);
        setEventCount(prev => prev + 1);

        // Auto-dismiss after 8 seconds
        setTimeout(() => {
            setAlerts(prev => prev.filter(a => a.id !== alert.id));
        }, 8000);
    }, [broadcasts]);

    const activeAlert = alerts[alerts.length - 1] || null;

    return (
        <AnimatePresence>
            {activeAlert && (
                <div className="fixed inset-0 z-[300] pointer-events-none flex items-start justify-center p-6">
                    {/* Background Wash */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-cyan-500/[0.02] backdrop-blur-[2px]"
                    />

                    <motion.div
                        initial={{ y: -100, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -50, opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-lg pointer-events-auto"
                    >
                        <NeuralSurface
                            variant="glass"
                            className="p-1 px-1 border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.15)] overflow-hidden"
                        >
                            <div className="relative p-6 px-8 flex items-center gap-6 bg-black/40 rounded-[30px]">
                                {/* Animated Icon Container */}
                                <div className="relative shrink-0">
                                    {(() => {
                                        const cfg = SEVERITY_CONFIG[activeAlert.type] || SEVERITY_CONFIG.info;
                                        return (
                                            <>
                                                <div className={cn(
                                                    "w-14 h-14 rounded-2xl border flex items-center justify-center transition-colors",
                                                    cfg.bgColor, cfg.borderColor
                                                )}>
                                                    <span className={cfg.color}>{cfg.icon}</span>
                                                </div>
                                                <motion.div
                                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className={cn(
                                                        "absolute inset-0 rounded-full blur-xl",
                                                        cfg.bgColor
                                                    )}
                                                />
                                            </>
                                        );
                                    })()}
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={12} className="text-amber-400" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400 font-display">
                                            {activeAlert.title}
                                        </span>
                                        {eventCount > 1 && (
                                            <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-slate-400 font-mono">
                                                {eventCount} events
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-bold text-white leading-tight uppercase tracking-wide">
                                        {activeAlert.message}
                                    </p>
                                    <div className="flex items-center gap-3 pt-1">
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent" />
                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                            Sage Autonomous Oversight
                                        </span>
                                    </div>
                                </div>

                                <button type="button"
                                    onClick={() => setAlerts([])}
                                    className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Progress bar timer */}
                            <motion.div
                                key={activeAlert.id}
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: 8, ease: "linear" }}
                                className="absolute bottom-0 left-0 h-[2px] bg-cyan-400/50"
                            />
                        </NeuralSurface>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
