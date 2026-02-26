'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '@/components/providers/TelemetryProvider';
import { cn } from '@/lib/utils';
import { Activity, Cpu, Database } from 'lucide-react';

const CpuBar = React.memo(({ index, status }: { index: number, status: string }) => {
    const [duration, setDuration] = React.useState(0.8);

    React.useEffect(() => {
        setDuration(0.5 + Math.random());
    }, []);

    return (
        <motion.div
            className={cn(
                "w-1 rounded-full",
                status === 'ACTV' ? "bg-fuchsia-500" : "bg-slate-700"
            )}
            animate={{
                height: status === 'ACTV' ? [8, 24, 12, 32, 16] : 4
            }}
            transition={{
                duration,
                repeat: Infinity,
                delay: index * 0.1
            }}
        />
    );
});

CpuBar.displayName = 'CpuBar';

export function SystemPulse() {
    const { performanceHistory, services } = useTelemetry();

    const ramData = useMemo(() => {
        if (performanceHistory.length < 2) return "";
        const width = 200;
        const height = 40;
        const maxPoints = 20;
        // Slice to last maxPoints entries to prevent SVG path overflow
        const data = performanceHistory.slice(-maxPoints).map(h => h.ram);
        const len = data.length;

        return data.map((val, i) => {
            const x = (i / (len - 1)) * width;
            const y = height - (val / 100) * height;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    }, [performanceHistory]);

    const latestRam = performanceHistory[performanceHistory.length - 1]?.ram || 0;
    const latestCpu = performanceHistory[performanceHistory.length - 1]?.cpu || 'IDLE';

    const isRunnerOnline = services.runner === 'online';

    return (
        <div className="bg-[#050505]/60 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden group">
            {/* AGENTIC OVERLAY: Subtle scanline */}
            <div className="absolute inset-x-0 top-0 h-[100px] bg-gradient-to-b from-cyan-500/[0.03] to-transparent pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <Activity size={18} className="text-violet-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white">System Pulse</h3>
                        <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mt-1 flex items-center gap-2">
                            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse transition-colors duration-700", isRunnerOnline ? "bg-emerald-500" : "bg-rose-500")} />
                            {isRunnerOnline ? "Neural Uplink Active" : "No Signal Detected"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                {/* RAM Metric */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all duration-700">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-4">
                        <div className="flex items-center gap-2 text-slate-400 group-hover:text-cyan-400 transition-colors duration-500">
                            <Database size={14} />
                            <span>Memory Load</span>
                        </div>
                        <div className="w-[40px] text-right">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={latestRam}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="font-mono text-cyan-400 text-sm"
                                >
                                    {latestRam}%
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="h-16 w-full bg-black/40 rounded-xl relative overflow-hidden border border-white/5">
                        <svg className="w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
                            <motion.path
                                d={ramData}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                className="text-cyan-400/80"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1, ease: "linear" }}
                            />
                        </svg>
                        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
                    </div>
                </div>

                {/* CPU Metric */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-fuchsia-500/30 transition-all duration-700">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-4">
                        <div className="flex items-center gap-2 text-slate-400 group-hover:text-fuchsia-400 transition-colors duration-500">
                            <Cpu size={14} />
                            <span>Neural Load</span>
                        </div>
                        <div className="w-[40px] text-right">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={latestCpu}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="font-mono text-fuchsia-400 text-sm tracking-tighter uppercase"
                                >
                                    {latestCpu}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 h-16 w-full justify-center bg-black/40 rounded-xl border border-white/5 p-4">
                        {[...Array(12)].map((_, i) => (
                            <CpuBar key={i} index={i} status={latestCpu} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
