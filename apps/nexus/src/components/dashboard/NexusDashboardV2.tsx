'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Activity, Cpu, Server, Shield, Zap, Globe, Command, TrendingUp, Clock, Signal, Eye, ChevronRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PipelineStatus } from './PipelineStatus';

/* ═══════════════════════════════════════════════════════
   NEXUS DASHBOARD v6.0 — Premium command center
   Gradient mesh background, bento grid, glassmorphism
   ═══════════════════════════════════════════════════════ */

interface UsageData {
    timestamp: string;
    calls: number;
    latency: number;
}

interface PipelineBadgeState {
    maintenanceActive: boolean;
}

// Animated number counter
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
    const [display, setDisplay] = useState(0);
    const displayRef = useRef(0);

    useEffect(() => {
        displayRef.current = display;
    }, [display]);

    useEffect(() => {
        const dur = 800;
        const start = performance.now();
        const from = displayRef.current;
        const step = (now: number) => {
            const t = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.round(from + (value - from) * eased));
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [value]);
    return <>{display}{suffix}</>;
}

export default function NexusDashboardV2() {
    const [stats, setStats] = useState({
        totalCalls: 0,
        avgLatency: 0,
        errorRate: 0,
        activeSess: 0
    });
    const [chartData, setChartData] = useState<UsageData[]>([]);
    const [isSecurityShieldActive, setIsSecurityShieldActive] = useState(true);
    const [now, setNow] = useState<Date | null>(null);
    const [pipelineState, setPipelineState] = useState<PipelineBadgeState>({ maintenanceActive: false });

    // Clock
    useEffect(() => {
        const t = setInterval(() => setNow(new Date(Date.now())), 1000);
        return () => clearInterval(t);
    }, []);

    // Fetch Real Volumetrics
    useEffect(() => {
        const fetchMetrics = async () => {
            const now = new Date(Date.now());
            const buckets = new Map<string, { calls: number, latency: number, count: number }>();
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 60 * 60 * 1000);
                const key = `${d.getHours()}:00`;
                buckets.set(key, { calls: 0, latency: 0, count: 0 });
            }
            const { data } = await supabase
                .from('system_events')
                .select('timestamp, metadata')
                .gte('timestamp', new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString());
            if (data) {
                data.forEach(evt => {
                    const d = new Date(evt.timestamp);
                    const key = `${d.getHours()}:00`;
                    if (buckets.has(key)) {
                        const b = buckets.get(key)!;
                        b.calls++;
                        try {
                            const meta = typeof evt.metadata === 'string' ? JSON.parse(evt.metadata) : evt.metadata;
                            if (meta.duration) { b.latency += meta.duration; b.count++; }
                        } catch { }
                    }
                });
            }
            const processed = Array.from(buckets.entries()).map(([time, data]) => ({
                timestamp: time,
                calls: data.calls,
                latency: data.count > 0 ? Math.round(data.latency / data.count) : 0
            }));
            setChartData(processed);
            const totalCalls = processed.reduce((acc, curr) => acc + curr.calls, 0);
            const avgLatency = processed.reduce((acc, curr) => acc + curr.latency, 0) / (processed.filter(p => p.latency > 0).length || 1);
            setStats(prev => ({ ...prev, totalCalls, avgLatency: Math.round(avgLatency) }));
        };
        fetchMetrics();
        const interval = setInterval(() => { if (!document.hidden) fetchMetrics(); }, 30000);
        return () => clearInterval(interval);
    }, []);

    // Realtime subscription
    useEffect(() => {
        const sub = supabase.channel('nexus_dashboard_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_events' }, () => {
                setStats(prev => ({ ...prev, totalCalls: prev.totalCalls + 1 }));
            })
            .subscribe();
        return () => { sub.unsubscribe(); };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const fetchPipelineState = async () => {
            try {
                const res = await fetch('/api/pipeline');
                if (!res.ok) return;
                const json = await res.json();
                if (cancelled) return;
                setPipelineState({
                    maintenanceActive: Boolean(json?.maintenance?.active)
                });
            } catch { }
        };
        fetchPipelineState();
        const interval = setInterval(fetchPipelineState, 30000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    if (!now) return null;

    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return (
        <div className="min-h-full text-white font-sans selection:bg-teal-500/30">
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">

                {/* ── HEADER ── */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.6)] animate-pulse" />
                            <span className="text-[10px] font-bold text-teal-400/80 tracking-[0.2em] uppercase">System Active</span>
                            {pipelineState.maintenanceActive && (
                                <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Maintenance Active
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                            Command <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">Center</span>
                        </h1>
                        <p className="text-white/30 text-sm mt-1">{dateStr} · Neural operations overview</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 squircle bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                            <span className="text-lg font-mono font-bold text-white/80 tabular-nums tracking-wider">{timeStr}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsSecurityShieldActive(!isSecurityShieldActive)}
                            className={cn(
                                "w-10 h-10 squircle flex items-center justify-center transition-all border",
                                isSecurityShieldActive
                                    ? "bg-teal-500/15 border-teal-500/30 text-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.2)]"
                                    : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60"
                            )}
                        >
                            <Shield className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── BENTO GRID ── */}
                <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">

                    {/* KPI Cards Row */}
                    <div className="col-span-1 lg:col-span-3 group">
                        <div className="h-full p-4 sm:p-5 squircle bg-gradient-to-br from-teal-500/[0.08] to-transparent border border-teal-500/[0.12] hover:border-teal-500/25 transition-all backdrop-blur-2xl shadow-xl hover:shadow-glow-cyan">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-9 h-9 squircle bg-teal-500/15 flex items-center justify-center">
                                    <Signal className="w-4 h-4 text-teal-400" />
                                </div>
                                <span className="text-[9px] font-bold text-teal-400/60 bg-teal-400/10 px-2 py-0.5 rounded-full tracking-wider">LIVE</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                <AnimatedNumber value={stats.totalCalls} />
                            </div>
                            <div className="text-[11px] text-white/35 mt-1 font-medium">Total Events · 12h</div>
                        </div>
                    </div>

                    <div className="col-span-1 lg:col-span-3">
                        <div className="h-full p-4 sm:p-5 squircle bg-gradient-to-br from-blue-500/[0.08] to-transparent border border-blue-500/[0.12] hover:border-blue-500/25 transition-all backdrop-blur-2xl shadow-xl hover:shadow-glow-cyan">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-9 h-9 squircle bg-blue-500/15 flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="text-[9px] font-bold text-blue-400/60 bg-blue-400/10 px-2 py-0.5 rounded-full tracking-wider">AVG</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                <AnimatedNumber value={stats.avgLatency} suffix="ms" />
                            </div>
                            <div className="text-[11px] text-white/35 mt-1 font-medium">Response Latency</div>
                        </div>
                    </div>

                    <div className="col-span-1 lg:col-span-3">
                        <div className="h-full p-4 sm:p-5 squircle bg-gradient-to-br from-violet-500/[0.08] to-transparent border border-violet-500/[0.12] hover:border-violet-500/25 transition-all backdrop-blur-2xl shadow-xl hover:shadow-glow-violet">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-9 h-9 squircle bg-violet-500/15 flex items-center justify-center">
                                    <Eye className="w-4 h-4 text-violet-400" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[9px] font-bold text-emerald-400/80">OK</span>
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">100%</div>
                            <div className="text-[11px] text-white/35 mt-1 font-medium">System Coherence</div>
                        </div>
                    </div>

                    <div className="col-span-1 lg:col-span-3">
                        <div className="h-full p-4 sm:p-5 squircle bg-gradient-to-br from-amber-500/[0.08] to-transparent border border-amber-500/[0.12] hover:border-amber-500/25 transition-all backdrop-blur-2xl shadow-xl hover:shadow-glow-amber">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-9 h-9 squircle bg-amber-500/15 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-amber-400" />
                                </div>
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">0.0%</div>
                            <div className="text-[11px] text-white/35 mt-1 font-medium">Error Rate</div>
                        </div>
                    </div>

                    {/* ── CHART (Large) ── */}
                    <div className="col-span-2 lg:col-span-8 row-span-1">
                        <div className="h-full p-4 sm:p-5 squircle bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.10] transition-all relative overflow-hidden backdrop-blur-2xl flex flex-col shadow-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none opacity-30" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' }} />

                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-2.5">
                                    <Activity className="w-4 h-4 text-teal-400" />
                                    <span className="text-sm font-semibold text-white/80">Neural Activity</span>
                                    <span className="text-[9px] text-white/25 font-mono bg-white/[0.04] px-2 py-0.5 rounded">12H WINDOW</span>
                                </div>
                            </div>

                            <div className="w-full h-[240px] sm:h-[280px] lg:h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorCallsNexus" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                        <XAxis dataKey="timestamp" stroke="rgba(255,255,255,0.06)" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} axisLine={false} />
                                        <YAxis stroke="rgba(255,255,255,0.06)" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} axisLine={false} width={30} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(16,185,129,0.2)' }}
                                            itemStyle={{ color: '#10b981' }}
                                            cursor={{ stroke: 'rgba(16,185,129,0.2)' }}
                                        />
                                        <Area type="monotone" dataKey="calls" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCallsNexus)" dot={false} style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.4))' }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* ── QUICK ACTIONS (Right) ── */}
                    <div className="col-span-2 lg:col-span-4 space-y-3 sm:space-y-4">
                        <button
                            type="button"
                            onClick={() => {
                                supabase.from('ghost_bridge').insert({
                                    command: 'sys:diagnose',
                                    source: 'nexus_dashboard',
                                    status: 'pending'
                                }).then(() => alert('Diagnostics Triggered'));
                            }}
                            className="w-full p-4 squircle bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20 hover:border-teal-500/40 text-left transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 squircle bg-teal-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Zap className="w-4 h-4 text-teal-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-white/90">Run Diagnostics</div>
                                        <div className="text-[10px] text-white/30 mt-0.5">Full system scan</div>
                                    </div>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-teal-400 transition-colors" />
                            </div>
                        </button>

                        <a
                            href="/diagnostics"
                            className="block w-full p-4 squircle bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] text-left transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 squircle bg-blue-500/15 flex items-center justify-center">
                                        <Globe className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-white/90">Network Map</div>
                                        <div className="text-[10px] text-white/30 mt-0.5">Service topology</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                            </div>
                        </a>

                        <a
                            href="/analytics"
                            className="block w-full p-4 squircle bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] text-left transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 squircle bg-violet-500/15 flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4 text-violet-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-white/90">Deep Analytics</div>
                                        <div className="text-[10px] text-white/30 mt-0.5">Trends & patterns</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                            </div>
                        </a>
                    </div>
                </div>

                {/* Pipeline Status */}
                <PipelineStatus />
            </div>
        </div>
    );
}
