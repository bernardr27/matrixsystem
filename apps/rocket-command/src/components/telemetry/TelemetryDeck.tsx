'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Radio, Activity, Cpu, HardDrive, Clock, Wifi, Server,
    Shield, Zap, AlertTriangle, BarChart3, TrendingUp, Globe, Flame,
    Download, TrendingDown, RefreshCw, Loader2, Eye, Database
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
    ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { supabase } from '@/lib/supabase';
import { useRocket, useGlobalUptime } from '@/components/providers/RocketProvider';
import { RocketSurface, RocketButton } from '@/components/ui/RocketSurface';
import { cn, getStatusColor, getStatusDot } from '@/lib/utils';
import { Tooltip as InfoTooltip } from '@/components/ui/Tooltip';

// Accumulate real performance history from live polling
function usePerformanceHistory(cpu: number, memory: number, maxPoints = 30) {
    const histRef = useRef<{ time: string; cpu: number; memory: number }[]>([]);
    useEffect(() => {
        if (cpu === 0 && memory === 0) return;
        const now = new Date();
        histRef.current = [
            ...histRef.current.slice(-(maxPoints - 1)),
            { time: now.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }), cpu, memory },
        ];
    }, [cpu, memory, maxPoints]);
    return histRef;
}

interface SystemEvent {
    id: string;
    event_type: string;
    message: string;
    severity: string;
    created_at: string;
}

export default function TelemetryDeck() {
    const { services, cpu, memory, isConnected, broadcasts } = useRocket();
    const uptime = useGlobalUptime();
    const toast = useToast();
    const perfHistory = usePerformanceHistory(cpu, memory);

    /* ── Delta tracking for trend indicators ── */
    const prevRef = useRef({ cpu: 0, memory: 0 });
    const [cpuDelta, setCpuDelta] = useState(0);
    const [memDelta, setMemDelta] = useState(0);
    useEffect(() => {
        if (prevRef.current.cpu > 0) {
            setCpuDelta(cpu - prevRef.current.cpu);
            setMemDelta(memory - prevRef.current.memory);
        }
        prevRef.current = { cpu, memory };
    }, [cpu, memory]);

    /* ── Data Export ── */
    const exportTelemetry = () => {
        const data = {
            exportedAt: new Date().toISOString(),
            uptime,
            cpu, memory,
            services: Object.entries(services).map(([k, v]) => ({ name: k, status: v })),
            latency,
            serviceHealth,
            performanceHistory: perfHistory.current,
            events: events.slice(0, 50),
            broadcasts: broadcasts.slice(-50).map(b => ({ event: b.event || b.type, source: b.source, timestamp: b.timestamp })),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `telemetry-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Exported', 'Telemetry data saved to file');
    };
    const [events, setEvents] = useState<SystemEvent[]>([]);
    const [latency, setLatency] = useState<Record<string, number>>({});
    const [activeTab, setActiveTab] = useState<'overview' | 'diagnostics' | 'events'>('overview');
    const [serviceHealth, setServiceHealth] = useState<{ service: string; score: number }[]>([]);
    const [eventsError, setEventsError] = useState(false);
    const [latencyError, setLatencyError] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch system events
    const fetchEvents = useCallback(async () => {
        try {
            const { data } = await supabase
                .from('system_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(30);
            if (data) setEvents(data as SystemEvent[]);
            setEventsError(false);
        } catch {
            setEventsError(true);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Latency probes — via our own API (works from any device, not just localhost)
    useEffect(() => {
        const probe = async () => {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                const res = await fetch('/api/services', { signal: controller.signal });
                clearTimeout(timeout);
                if (!res.ok) return;
                const data = await res.json();
                const results: Record<string, number> = {};
                const healthScores: { service: string; score: number }[] = [];
                for (const [key, svc] of Object.entries(data.services || {}) as [string, any][]) {
                    const label = key.charAt(0).toUpperCase() + key.slice(1);
                    if (['ghost', 'reflect', 'nexus'].includes(key)) {
                        results[label] = svc.latency ?? -1;
                    }
                    // Compute real health score: online + low latency = high score
                    let score = 0;
                    if (svc.status === 'online') {
                        score = 100;
                        if (svc.latency != null) {
                            if (svc.latency > 300) score = 60;
                            else if (svc.latency > 100) score = 80;
                            else score = 95 + Math.min(5, Math.round(5 * (1 - svc.latency / 100)));
                        }
                    }
                    healthScores.push({ service: label, score });
                }
                setLatency(results);
                setServiceHealth(healthScores);
                setLatencyError(false);
            } catch {
                setLatencyError(true);
            }
        };
        probe();
        const timer = setInterval(probe, 30000);
        return () => clearInterval(timer);
    }, []);

    const onlineCount = Object.values(services).filter(s => s === 'online').length;
    const totalCount = Object.keys(services).length;

    const tabs = [
        { key: 'overview', label: 'Overview', icon: BarChart3 },
        { key: 'diagnostics', label: 'Diagnostics', icon: Activity },
        { key: 'events', label: 'Events', icon: Zap },
    ] as const;

    return (
        <div className="p-4 md:p-6 xl:p-8 max-w-[1920px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/15 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.1)]">
                        <Radio className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-display font-bold text-white">Telemetry Deck</h1>
                            <span className="text-[9px] font-mono text-violet-400/50 bg-violet-500/5 px-1.5 py-0.5 rounded-md border border-violet-500/10">LIVE</span>
                        </div>
                        <p className="text-sm text-white/40">Real-time system metrics & analytics</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <InfoTooltip content="Refresh all telemetry data">
                        <button onClick={async () => {
                            setRefreshing(true);
                            await fetchEvents();
                            setTimeout(() => setRefreshing(false), 500);
                            toast.success('Refreshed', 'Telemetry data updated');
                        }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/25 hover:bg-white/[0.04] transition-all">
                            <RefreshCw className={cn('w-3.5 h-3.5 text-violet-400/60', refreshing && 'animate-spin')} />
                            <span className="text-xs font-mono text-white/50">Refresh</span>
                        </button>
                    </InfoTooltip>
                    <InfoTooltip content="Export all telemetry data as JSON">
                        <button onClick={exportTelemetry} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/25 hover:bg-white/[0.04] transition-all">
                            <Download className="w-3.5 h-3.5 text-violet-400/60" />
                            <span className="text-xs font-mono text-white/50">Export</span>
                        </button>
                    </InfoTooltip>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <Clock className="w-3.5 h-3.5 text-orange-400/60" />
                        <span className="text-xs font-mono text-white/50">{uptime}</span>
                    </div>
                    <InfoTooltip content={isConnected ? 'Supabase realtime channel is active — receiving live broadcasts' : 'WebSocket disconnected — data may be stale'} side="bottom">
                        <div className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-help',
                            isConnected ? 'bg-emerald-500/5 border border-emerald-500/15' : 'bg-red-500/5 border border-red-500/15'
                        )}>
                            <div className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-emerald-400' : 'bg-red-400')} />
                            <span className={cn('text-xs font-mono', isConnected ? 'text-emerald-400' : 'text-red-400')}>
                                {isConnected ? 'LIVE' : 'DISCONNECTED'}
                            </span>
                        </div>
                    </InfoTooltip>
                </div>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/[0.04]">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                activeTab === tab.key
                                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                                    : 'text-white/40 hover:text-white/60'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="space-y-4">
                    {/* Error Alerts */}
                    {(eventsError || latencyError) && (
                        <RocketSurface variant="flame" className="p-3 flex items-center gap-3">
                            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-xs text-white/60">
                                    {eventsError && latencyError
                                        ? 'Unable to fetch events and latency data'
                                        : eventsError
                                            ? 'Unable to fetch system events — Supabase may be unavailable'
                                            : 'Unable to probe service latency — API may be unreachable'}
                                </p>
                            </div>
                            <button onClick={() => { fetchEvents(); }} className="text-[10px] text-amber-400 hover:text-amber-300">
                                Retry
                            </button>
                        </RocketSurface>
                    )}

                    {/* Top metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
                        <RocketSurface variant="neon" className="p-3 holo-card">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                                </div>
                                <span className="text-[11px] text-white/40 uppercase">CPU Load</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-display font-bold text-white animate-count-up">{cpu || 0}%</span>
                                {cpuDelta !== 0 && (
                                    <span className={cn('text-[10px] font-mono flex items-center gap-0.5', cpuDelta > 0 ? 'text-red-400/70' : 'text-emerald-400/70')}>
                                        {cpuDelta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {Math.abs(cpuDelta)}%
                                    </span>
                                )}
                            </div>
                            <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                <div className={cn('h-full rounded-full transition-all', cpu > 80 ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-cyan-400 to-cyan-500')} style={{ width: `${cpu || 0}%` }} />
                            </div>
                        </RocketSurface>

                        <RocketSurface className="p-3 holo-card">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                    <HardDrive className="w-3.5 h-3.5 text-violet-400" />
                                </div>
                                <span className="text-[11px] text-white/40 uppercase">Memory</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-display font-bold text-white animate-count-up">{memory || 0}%</span>
                                {memDelta !== 0 && (
                                    <span className={cn('text-[10px] font-mono flex items-center gap-0.5', memDelta > 0 ? 'text-red-400/70' : 'text-emerald-400/70')}>
                                        {memDelta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {Math.abs(memDelta)}%
                                    </span>
                                )}
                            </div>
                            <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                <div className={cn('h-full rounded-full transition-all', memory > 80 ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-violet-400 to-violet-500')} style={{ width: `${memory || 0}%` }} />
                            </div>
                        </RocketSurface>

                        <RocketSurface className="p-3 holo-card">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                </div>
                                <span className="text-[11px] text-white/40 uppercase">Fleet Health</span>
                            </div>
                            <span className="text-2xl font-display font-bold text-white animate-count-up">{onlineCount}/{totalCount}</span>
                            <span className="text-[11px] text-white/30 block mt-1">services online</span>
                        </RocketSurface>

                        <RocketSurface className="p-3 holo-card">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                    <Radio className="w-3.5 h-3.5 text-orange-400" />
                                </div>
                                <span className="text-[11px] text-white/40 uppercase">Broadcasts</span>
                            </div>
                            <span className="text-2xl font-display font-bold text-white animate-count-up">{broadcasts.length}</span>
                            <span className="text-[11px] text-white/30 block mt-1">received this session</span>
                        </RocketSurface>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <RocketSurface className="p-4 holo-card">
                            <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2 mb-4">
                                <TrendingUp className="w-4 h-4 text-orange-400" />
                                Performance History
                            </h3>
                            {perfHistory.current.length < 2 ? (
                                <div className="h-[220px] flex items-center justify-center">
                                    <p className="text-xs text-white/25">Collecting performance data...</p>
                                </div>
                            ) : (
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={perfHistory.current} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                                        <defs>
                                            <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Tooltip contentStyle={{ background: '#0c0c1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                                        <Area type="monotone" dataKey="cpu" stroke="#22d3ee" fill="url(#cpuGrad)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="memory" stroke="#8b5cf6" fill="url(#memGrad)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-cyan-400" /><span className="text-[11px] text-white/40">CPU</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-violet-400" /><span className="text-[11px] text-white/40">Memory</span></div>
                            </div>
                        </RocketSurface>

                        <RocketSurface className="p-4 holo-card">
                            <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2 mb-4">
                                <Server className="w-4 h-4 text-orange-400" />
                                Service Health Radar
                            </h3>
                            <div className="h-[220px]">
                                {serviceHealth.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={serviceHealth} cx="50%" cy="50%" outerRadius="70%">
                                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                        <PolarAngleAxis dataKey="service" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                                        <Radar name="Health" dataKey="score" stroke="#ff6b35" fill="#ff6b35" fillOpacity={0.15} strokeWidth={2} />
                                    </RadarChart>
                                </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-xs text-white/25">Probing services...</p>
                                    </div>
                                )}
                            </div>
                        </RocketSurface>
                    </div>

                    {/* Latency Bar Chart */}
                    {Object.keys(latency).length > 0 && (
                        <RocketSurface className="p-4">
                            <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2 mb-4">
                                <BarChart3 className="w-4 h-4 text-orange-400" />
                                Service Response Times
                            </h3>
                            <div className="h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={Object.entries(latency).map(([name, ms]) => ({ name, ms: ms === -1 ? 0 : ms }))}>
                                        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} />
                                        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} unit="ms" />
                                        <Tooltip contentStyle={{ background: '#0c0c1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                                        <Bar dataKey="ms" fill="#ff6b35" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </RocketSurface>
                    )}
                </div>
            )}

            {/* DIAGNOSTICS TAB */}
            {activeTab === 'diagnostics' && (
                <div className="space-y-4">
                    {/* Latency Error */}
                    {latencyError && (
                        <RocketSurface variant="flame" className="p-3 flex items-center gap-3">
                            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <p className="text-xs text-white/60 flex-1">Latency probes failed — service API may be unreachable</p>
                        </RocketSurface>
                    )}

                    {/* Latency Table */}
                    <RocketSurface className="p-4 holo-card">
                        <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2 mb-4">
                            <Wifi className="w-4 h-4 text-orange-400" />
                            Service Latency Probes
                        </h3>
                        <div className="space-y-2 stagger-children">
                            {Object.entries(latency).map(([name, ms]) => (
                                <div key={name} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-white/30" />
                                        <span className="text-sm text-white/70">{name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {ms === -1 ? (
                                            <>
                                                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                                <span className="text-xs font-mono text-red-400">TIMEOUT</span>
                                            </>
                                        ) : (
                                            <InfoTooltip content={ms < 100 ? 'Excellent — under 100ms' : ms < 300 ? 'Acceptable — under 300ms' : 'Slow — over 300ms, may affect performance'} side="left">
                                                <div className="flex items-center gap-2 cursor-help">
                                                    <div className={cn(
                                                        'w-1.5 h-1.5 rounded-full',
                                                        ms < 100 ? 'bg-emerald-400' : ms < 300 ? 'bg-amber-400' : 'bg-red-400'
                                                    )} />
                                                    <span className={cn(
                                                        'text-xs font-mono',
                                                        ms < 100 ? 'text-emerald-400' : ms < 300 ? 'text-amber-400' : 'text-red-400'
                                                    )}>
                                                        {ms}ms
                                                    </span>
                                                </div>
                                            </InfoTooltip>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </RocketSurface>

                    {/* Service Status Grid */}
                    <RocketSurface className="p-4">
                        <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2 mb-4">
                            <Server className="w-4 h-4 text-orange-400" />
                            Fleet Diagnostic Matrix
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3 stagger-children">
                            {Object.entries(services).map(([key, status]) => (
                                <div key={key} className={cn(
                                    'p-3 rounded-xl border flex flex-col items-center gap-2 holo-card',
                                    status === 'online' ? 'bg-emerald-500/5 border-emerald-500/15'
                                        : status === 'connecting' ? 'bg-cyan-500/5 border-cyan-500/15'
                                            : 'bg-red-500/5 border-red-500/15'
                                )}>
                                    <div className={cn('w-3 h-3 rounded-full', getStatusDot(status))} />
                                    <span className="text-sm text-white/70 capitalize font-medium">{key}</span>
                                    <span className={cn('text-xs font-mono', getStatusColor(status))}>{status}</span>
                                </div>
                            ))}
                        </div>
                    </RocketSurface>

                    {/* System Info */}
                    <RocketSurface className="p-4">
                        <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2 mb-4">
                            <Flame className="w-4 h-4 text-orange-400" />
                            RocketCommand Pro — System Info
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-8 gap-4">
                            {[
                                { label: 'Version', value: '3.0.0' },
                                { label: 'Port', value: '4000' },
                                { label: 'Framework', value: 'Next.js 16' },
                                { label: 'Uptime', value: uptime },
                                { label: 'AI Engine', value: 'Groq LLaMA3' },
                                { label: 'Backend', value: 'Supabase' },
                                { label: 'OS', value: 'Windows' },
                                { label: 'Runtime', value: 'Node.js' },
                            ].map(item => (
                                <div key={item.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] holo-card">
                                    <span className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">{item.label}</span>
                                    <span className="text-sm text-white/70 font-mono">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </RocketSurface>
                </div>
            )}

            {/* EVENTS TAB */}
            {activeTab === 'events' && (
                <div className="space-y-4">
                    <RocketSurface className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-orange-400" />
                                System Event Stream
                                <span className="text-[10px] text-white/25 font-mono ml-2">{events.length} events</span>
                            </h3>
                            <button onClick={fetchEvents} className="text-[10px] text-white/30 hover:text-white/60 flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" /> Refresh
                            </button>
                        </div>
                        {eventsError ? (
                            <RocketSurface variant="flame" className="p-4 text-center">
                                <AlertTriangle className="w-8 h-8 text-amber-400/50 mx-auto mb-2" />
                                <p className="text-sm text-white/50">Unable to load events</p>
                                <p className="text-xs text-white/25 mt-1">Supabase connection may be unavailable</p>
                                <button onClick={fetchEvents} className="mt-3 text-xs text-orange-400 hover:text-orange-300">Retry →</button>
                            </RocketSurface>
                        ) : events.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/10 mx-auto mb-4 flex items-center justify-center animate-float">
                                    <Radio className="w-6 h-6 text-white/15" />
                                </div>
                                <p className="text-sm text-white/30">No system events recorded yet.</p>
                                <p className="text-xs text-white/15 mt-1">Events will appear here as they are emitted.</p>
                            </div>
                        ) : (
                            <div className="space-y-1 max-h-[500px] overflow-y-auto">
                                {events.map(evt => (
                                    <div key={evt.id} className="flex items-start gap-3 py-2 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.03] transition-colors">
                                        <div className={cn(
                                            'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                                            evt.severity === 'critical' || evt.severity === 'error' ? 'bg-red-400' :
                                                evt.severity === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-white/60">{evt.event_type}</span>
                                                <span className="text-[10px] text-white/20 font-mono">
                                                    {new Date(evt.created_at).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-white/40 truncate mt-0.5">{evt.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </RocketSurface>

                    {/* Live Broadcasts */}
                    <RocketSurface className="p-4">
                        <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2 mb-4">
                            <Radio className="w-4 h-4 text-violet-400" />
                            Live Broadcast Feed
                        </h3>
                        {broadcasts.length === 0 ? (
                            <div className="text-center py-8">
                                <span className="text-sm text-white/30">Waiting for broadcasts...</span>
                            </div>
                        ) : (
                            <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                {broadcasts.slice(-20).reverse().map(bc => (
                                    <div key={bc.id} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-white/[0.02] text-xs">
                                        <span className="text-white/20 font-mono flex-shrink-0">
                                            {new Date(bc.timestamp).toLocaleTimeString()}
                                        </span>
                                        <span className="text-orange-400/60 font-mono flex-shrink-0">
                                            {bc.event || bc.type || 'pulse'}
                                        </span>
                                        <span className="text-white/40 truncate">
                                            {bc.source || 'system'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </RocketSurface>
                </div>
            )}
        </div>
    );
}
