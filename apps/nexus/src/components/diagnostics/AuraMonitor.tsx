'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Terminal, Activity, Zap } from 'lucide-react';
import { useTelemetry } from '@/components/providers/TelemetryProvider';
import { cn } from '@/lib/utils';

export function AuraMonitor() {
    const { broadcasts } = useTelemetry();

    return (
        <div className="glass-card flex flex-col h-[300px] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <Radio size={14} className="text-emerald-400 animate-pulse" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic text-white">Global_Consciousness</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[8px] text-emerald-500/50 font-black tracking-[0.4em] italic uppercase">AURA_SYNC_v4.2</span>
                </div>
            </div>

            {/* Feed Viewport */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/20">
                <AnimatePresence initial={false}>
                    {broadcasts && broadcasts.length > 0 ? (
                        broadcasts.map((b, i) => (
                            <motion.div
                                key={b.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className={cn(
                                    "p-3 rounded-lg border flex flex-col gap-1.5 transition-all",
                                    i === 0 ? "bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]" : "bg-white/5 border-white/5 opacity-50"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-1 h-1 rounded-full",
                                            i === 0 ? "bg-emerald-400 animate-pulse" : "bg-white/20"
                                        )} />
                                        <span className="text-[9px] font-bold text-white uppercase tracking-tight">LOG_SEQ_{b.id.slice(-4)}</span>
                                    </div>
                                    <span className="text-[8px] text-slate-500 font-mono">
                                        <SafeTime timestamp={b.timestamp} />
                                    </span>
                                </div>
                                <p
                                    className={cn(
                                        "text-[10px] leading-relaxed font-medium transition-colors animate-[fadeIn_0.5s_ease-out]",
                                        i === 0 ? "text-emerald-400" : "text-slate-400"
                                    )}
                                >
                                    {b.message}
                                </p>
                            </motion.div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-3 opacity-20 py-12">
                            <Terminal size={32} className="text-slate-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Listening for Pulse...</span>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Status */}
            <div className="p-3 px-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-emerald-500/70">
                        <Activity size={10} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Watcher Active</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-violet-500/70">
                        <Zap size={10} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Self-Healing ON</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
function SafeTime({ timestamp }: { timestamp: string }) {
    const [time, setTime] = React.useState<string | null>(null);
    React.useEffect(() => {
        setTime(new Date(timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, [timestamp]);
    return <>{time || '--:--:--'}</>;
}
