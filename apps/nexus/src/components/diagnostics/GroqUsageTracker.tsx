'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gauge, TrendingUp, Zap, Clock, DollarSign, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { NeuralSurface } from '../ui/NeuralSurface';

interface GroqUsage {
    totalCalls: number;
    avgLatency: number;
    errorRate: number;
    sources: Record<string, number>;
    recentCalls: { source: string; timestamp: string; duration: number }[];
}

export function GroqUsageTracker() {
    const [usage, setUsage] = useState<GroqUsage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

    useEffect(() => {
        const fetchUsage = async () => {
            setIsLoading(true);

            const rangeMs = timeRange === '1h' ? 3600000
                : timeRange === '24h' ? 86400000
                    : 604800000;
            const since = new Date(Date.now() - rangeMs).toISOString();

            // Run all three queries in parallel
            const [eventsResult, aiCommandsResult] = await Promise.all([
                supabase
                    .from('system_events')
                    .select('*')
                    .or('event_type.eq.groq_call,event_type.eq.ai_analysis,source.ilike.%groq%,source.ilike.%sage%')
                    .gte('timestamp', since)
                    .order('timestamp', { ascending: false })
                    .limit(200),
                supabase
                    .from('ghost_bridge')
                    .select('id', { count: 'exact', head: true })
                    .or('command.ilike.%sage:%,command.ilike.%ai:%,command.ilike.%think%')
                    .gte('created_at', since)
            ]);

            const { data: events } = eventsResult;
            const { count: aiCommands } = aiCommandsResult;

            const allEvents = events || [];
            const totalCalls = allEvents.length + (aiCommands || 0);
            const durations = allEvents
                .map(e => {
                    try { const m = JSON.parse(e.metadata || '{}'); return m.duration || 0; } catch { return 0; }
                })
                .filter(d => d > 0);

            const avgLatency = durations.length > 0
                ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
                : 0;

            const errors = allEvents.filter(e => e.severity === 'error').length;
            const errorRate = totalCalls > 0 ? Math.round((errors / totalCalls) * 100) : 0;

            // Group by source
            const sources: Record<string, number> = {};
            allEvents.forEach(e => {
                sources[e.source] = (sources[e.source] || 0) + 1;
            });

            const recentCalls = allEvents.slice(0, 5).map(e => ({
                source: e.source,
                timestamp: e.timestamp,
                duration: (() => { try { return JSON.parse(e.metadata || '{}').duration || 0; } catch { return 0; } })()
            }));

            setUsage({ totalCalls, avgLatency, errorRate, sources, recentCalls });
            setIsLoading(false);
        };

        fetchUsage();
        const interval = setInterval(() => {
            if (!document.hidden) fetchUsage();
        }, 60000); // Refresh every minute, skip if tab hidden
        return () => clearInterval(interval);
    }, [timeRange]);

    return (
        <NeuralSurface variant="neumorphic" className="p-6 space-y-6 h-full overflow-hidden border-none bg-black/40">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 shadow-[var(--m-shadow-neumorphic-inner)]">
                        <Gauge className="text-violet-400" size={16} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black tracking-[0.3em] text-white uppercase">Groq_Resonance</span>
                        <span className="text-[7px] font-mono text-violet-400/60 uppercase">Neural_Throughput_Uplink</span>
                    </div>
                </div>
                <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5 shadow-inner">
                    {(['1h', '24h', '7d'] as const).map(range => (
                        <button type="button"
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={cn(
                                "text-[8px] px-2 py-1 rounded-lg transition-all duration-300 font-black uppercase tracking-tighter",
                                timeRange === range
                                    ? "bg-violet-500/20 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.1)]"
                                    : "text-slate-600 hover:text-slate-400"
                            )}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-10">
                    <Activity className="text-violet-400 animate-pulse" size={24} />
                </div>
            ) : usage ? (
                <>
                    {/* Stats Bento Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'TOTAL_CALLS', val: usage.totalCalls, color: 'text-white' },
                            { label: 'AVG_LATENCY', val: `${usage.avgLatency}ms`, color: 'text-white' },
                            { label: 'SIGNAL_SYNC', val: `${100 - usage.errorRate}%`, color: usage.errorRate > 10 ? 'text-rose-400' : 'text-emerald-400' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-black/40 rounded-2xl p-4 border border-white/5 shadow-[var(--m-shadow-neumorphic-inner)] flex flex-col items-center">
                                <span className="text-[8px] font-black text-slate-600 tracking-widest uppercase mb-2">{stat.label}</span>
                                <motion.span
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={cn("text-xs font-black font-mono", stat.color)}
                                >
                                    {stat.val}
                                </motion.span>
                            </div>
                        ))}
                    </div>

                    {/* Distribution Charts (Veylix Style) */}
                    <div className="space-y-4 flex-1 min-h-0">
                        <div className="flex items-center justify-between text-[8px] font-black text-slate-500 tracking-[0.4em] uppercase">
                            <span>Throughput_Distribution</span>
                            <TrendingUp size={10} className="text-violet-400" />
                        </div>

                        <div className="space-y-3 overflow-y-auto max-h-[120px] pr-2 custom-scrollbar">
                            {Object.entries(usage.sources)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 5)
                                .map(([source, count], i) => {
                                    const pct = usage.totalCalls > 0 ? (count / usage.totalCalls) * 100 : 0;
                                    return (
                                        <div key={source} className="group/bar">
                                            <div className="flex items-center justify-between mb-1.5 px-1">
                                                <span className="text-[9px] font-black text-slate-500 group-hover/bar:text-slate-300 transition-colors uppercase tracking-widest truncate max-w-[120px]">
                                                    {source.replace('_', ' ')}
                                                </span>
                                                <span className="text-[8px] font-mono text-violet-400/40">{count}</span>
                                            </div>
                                            <div className="h-1.5 bg-black/40 rounded-full border border-white/5 overflow-hidden shadow-inner">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ delay: i * 0.1, duration: 1 }}
                                                    className="h-full bg-gradient-to-r from-violet-600/40 items-center to-violet-400/60 rounded-full relative"
                                                >
                                                    <div className="absolute inset-0 bg-violet-400 opacity-20 blur-xs" />
                                                </motion.div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* Recent Uplink Pulse */}
                    <div className="border-t border-white/5 pt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[7px] font-black text-slate-600 tracking-widest uppercase">Resonance_Sync_Live</span>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-20 filter grayscale">
                    <Activity className="animate-spin-slow mb-4 text-emerald-500/50" size={24} />
                    <span className="text-[10px] font-black tracking-[0.5em] uppercase text-emerald-500/50">Systems_Nominal_//_Idle</span>
                </div>
            )}
        </NeuralSurface>
    );
}
