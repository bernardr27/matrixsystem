'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, FileText, Cpu, HardDrive, Wifi, Shield } from 'lucide-react';
import { NeuralEntropy } from '@/components/diagnostics/NeuralEntropy';
import { AuraMonitor } from '@/components/diagnostics/AuraMonitor';
import { NeuralStream } from '@/components/diagnostics/NeuralStream';
import { OpsAutopilotPanel } from '@/components/diagnostics/OpsAutopilotPanel';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { cn } from '@/lib/utils';

export default function DiagnosticsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050510]" />}>
            <DiagnosticsPageContent />
        </Suspense>
    );
}

function DiagnosticsPageContent() {
    const STAT_COLORS: Record<string, { text: string; bg: string }> = {
        cyan: { text: 'text-cyan-400', bg: 'bg-cyan-400' },
        violet: { text: 'text-violet-400', bg: 'bg-violet-400' },
        emerald: { text: 'text-emerald-400', bg: 'bg-emerald-400' },
        amber: { text: 'text-amber-400', bg: 'bg-amber-400' },
    };

    const stats = [
        { label: 'CPU_Load', value: '34%', icon: Cpu, color: 'cyan', pct: 34 },
        { label: 'Memory', value: '12GB', icon: HardDrive, color: 'violet', pct: 62 },
        { label: 'Latency', value: '24ms', icon: Wifi, color: 'emerald', pct: 12 },
        { label: 'Uptime', value: '99.7%', icon: Shield, color: 'amber', pct: 99 },
    ];

    return (
        <div className="min-h-full bg-[#050510] text-slate-200 selection:bg-cyan-500/30 pb-8 overflow-x-hidden relative">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-4 space-y-8 relative z-10">
                {/* Header */}
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Activity size={20} className="text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-bold text-white">
                                    Diagnostics
                                </h1>
                                <div className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                                    OPTIMAL
                                </div>
                            </div>
                            <p className="text-[11px] text-white/40 mt-0.5">Real-time telemetry &amp; neural health</p>
                        </div>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <NeuralSurface className="p-6 flex flex-col gap-4 relative overflow-hidden group">
                                <div className="absolute right-4 top-4 opacity-10 group-hover:opacity-30 transition-opacity">
                                    <stat.icon size={40} />
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                    {stat.label}
                                </div>
                                <div className={cn(
                                    "text-3xl font-black italic tracking-tighter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                                    STAT_COLORS[stat.color]?.text
                                )}>
                                    {stat.value}
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stat.pct}%` }}
                                        transition={{ duration: 1.5, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                                        className={cn("h-full rounded-full", STAT_COLORS[stat.color]?.bg)}
                                    />
                                </div>
                            </NeuralSurface>
                        </motion.div>
                    ))}
                </div>

                {/* Main Visualizers */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-8"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <NeuralSurface variant="glass" className="space-y-4 p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                    <FileText size={18} className="text-rose-400" />
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Neural Entropy</h3>
                            </div>
                            <NeuralEntropy />
                        </NeuralSurface>

                        <NeuralSurface variant="glass" className="space-y-4 p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                                    <Zap size={18} className="text-cyan-400" />
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Aura Field</h3>
                            </div>
                            <AuraMonitor />
                        </NeuralSurface>
                    </div>

                    <NeuralSurface variant="glass" className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                <Activity size={18} className="text-violet-400" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Neural Stream</h3>
                            <div className="ml-auto flex gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-pulse [animation-delay:0.2s]" />
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/30 animate-pulse [animation-delay:0.4s]" />
                            </div>
                        </div>
                        <NeuralStream />
                    </NeuralSurface>

                    <OpsAutopilotPanel />
                </motion.div>
            </div>
        </div>
    );
}
