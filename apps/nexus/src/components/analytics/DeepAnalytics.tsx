'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Activity, Database, Server, Share2, Shield, Zap, Code, Cpu } from 'lucide-react';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { supabase } from '@/lib/supabase';
import { useTelemetry, useGlobalUptime } from '@/components/providers/TelemetryProvider';

// Deep Data Vibe Tokens
const DEEP_BG = "bg-black/90";
const HOLO_GRADIENT = "bg-gradient-to-br from-cyan-900/20 via-blue-900/20 to-purple-900/20";
const NEUMORPHIC_INNER = "shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.05)]";
const GLASS_PANEL = "backdrop-blur-xl bg-white/5 border border-white/10";

export default function DeepAnalytics() {
    const { performanceHistory, services, coherence } = useTelemetry();
    const globalUptime = useGlobalUptime();
    const [ingestionLogs, setIngestionLogs] = useState<any[]>([]);
    const [eventCount, setEventCount] = useState(0);
    const [systemLoad, setSystemLoad] = useState(0);
    const [cpuLabel, setCpuLabel] = useState('—');

    // Derive chart data from real performance history
    const RESONANCE_DATA = useMemo(() => {
        if (performanceHistory.length > 1) {
            return performanceHistory.map((p, i) => ({
                time: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                resonance: p.ram || 0,
                stability: Math.min(100, 100 - (p.ram || 0) * 0.3),
                load: parseFloat(p.cpu) || 0,
            }));
        }
        return [];
    }, [performanceHistory]);

    // Derive skill matrix from real service statuses
    const SKILL_DATA = useMemo(() => {
        const svcScore = (s: string) => s === 'online' ? 130 : s === 'connecting' ? 80 : s === 'degraded' ? 60 : 20;
        return [
            { subject: 'Reflect', A: svcScore(services.reflect), fullMark: 150 },
            { subject: 'Ghost', A: svcScore(services.ghost), fullMark: 150 },
            { subject: 'Runner', A: svcScore(services.runner), fullMark: 150 },
            { subject: 'Sentinel', A: svcScore(services.sentinel), fullMark: 150 },
            { subject: 'Gate', A: svcScore(services.gate), fullMark: 150 },
            { subject: 'Nexus', A: svcScore(services.nexus), fullMark: 150 },
        ];
    }, [services]);

    // Update system metrics from latest performance data
    useEffect(() => {
        if (performanceHistory.length > 0) {
            const latest = performanceHistory[performanceHistory.length - 1];
            setSystemLoad(latest.ram || 0);
            setCpuLabel(latest.cpu || '—');
        }
    }, [performanceHistory]);

    // Initial Fetch & Realtime Subscription
    useEffect(() => {

        const fetchData = async () => {
            try {
                const { data, count, error } = await supabase
                    .from('system_events')
                    .select('*', { count: 'exact' })
                    .order('created_at', { ascending: false })
                    .limit(30);

                if (error) throw error;
                if (data) setIngestionLogs(data);
                if (count !== null) setEventCount(count);
            } catch (e) {
                console.warn("Matrix Hub DeepAnalytics: Supabase failed, engaging simulation mode", e);
                setEventCount(0);
            }
        };

        fetchData();

        try {
            const channel = supabase
                .channel('deep_analytics_events')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_events' }, (payload: any) => {
                    setIngestionLogs(prev => [payload.new, ...prev].slice(0, 30));
                    setEventCount(prev => prev + 1);
                })
                .subscribe((status) => {
                    if (status === 'CHANNEL_ERROR') {
                        console.warn("Matrix Hub Realtime: channel error — data will resume when connection recovers");
                    }
                });

            return () => {
                supabase.removeChannel(channel);
            };
        } catch (e) {
            console.warn("Matrix Hub Realtime Setup Exception", e);
        }
    }, []);

    return (
        <div className={`min-h-screen ${DEEP_BG} text-cyan-50 font-sans p-6 overflow-hidden relative`}>
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05),transparent_70%)]" />
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '50px 50px' }}
                />
            </div>

            {/* Header */}
            <header className="relative z-10 flex justify-between items-end mb-8 border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
                        DEEP_ANALYTICS
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-sm font-mono text-cyan-500/60">
                        <span>UPTIME: {globalUptime}</span>
                        <span>•</span>
                        <span>COHERENCE: {coherence}%</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> ONLINE</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <QuickStat icon={Cpu} label="CPU" value={cpuLabel} />
                    <QuickStat icon={Database} label="EVENTS" value={eventCount > 0 ? eventCount.toLocaleString() : "Syncing..."} />
                    <QuickStat icon={Activity} label="LOAD" value={`${systemLoad.toFixed(1)}%`} />
                </div>
            </header>

            {/* Main Grid */}
            <div className="relative z-10 grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">

                {/* LEFT COL: KPI Cards (3/12) */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <DeepCard title="System Load" className="flex-1">
                        <div className="flex flex-col gap-4 h-full justify-center items-center">
                            <div className="relative w-40 h-40 flex items-center justify-center">
                                <svg className="transform -rotate-90 w-full h-full">
                                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
                                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * (systemLoad / 100))} className="text-cyan-500" />
                                </svg>
                                <div className="absolute text-3xl font-bold">{systemLoad.toFixed(0)}%</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full text-xs text-center text-white/50">
                                <div>
                                    <div className="text-cyan-400 font-bold text-lg">{cpuLabel}</div>
                                    <div>CPU</div>
                                </div>
                                <div>
                                    <div className="text-blue-400 font-bold text-lg">{Object.values(services).filter(s => s === 'online').length}</div>
                                    <div>SERVICES</div>
                                </div>
                            </div>
                        </div>
                    </DeepCard>
                    <DeepCard title="Skill Matrix" className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={SKILL_DATA}>
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                <Radar name="Mike" dataKey="A" stroke="#06b6d4" strokeWidth={2} fill="#06b6d4" fillOpacity={0.3} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </DeepCard>
                </div>

                {/* CENTER COL: Main Viz (6/12) */}
                <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
                    <DeepCard title="Resonance Telemetry" className="flex-1 min-h-[300px]">
                        {RESONANCE_DATA.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={RESONANCE_DATA}>
                                <defs>
                                    <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorStab" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="resonance" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorRes)" />
                                <Area type="monotone" dataKey="stability" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorStab)" />
                            </AreaChart>
                        </ResponsiveContainer>
                        ) : (
                        <div className="flex items-center justify-center h-full text-white/20 text-sm font-mono">
                            Awaiting telemetry data...
                        </div>
                        )}
                    </DeepCard>

                    <div className="h-[200px] grid grid-cols-2 gap-6">
                        <DeepCard title="Active Nodes">
                            <div className="flex items-center justify-center h-full text-5xl font-black text-white/10 tracking-[1em] overflow-hidden">
                                <div className="flex gap-4 animate-pulse">
                                    <Server size={48} className="text-cyan-500" />
                                    <span className="text-cyan-200">{Object.values(services).filter(s => s === 'online').length}</span>
                                </div>
                            </div>
                        </DeepCard>
                        <DeepCard title="Security Layer">
                            <div className="flex flex-col items-center justify-center h-full gap-2">
                                <Shield size={48} className="text-emerald-500" />
                                <div className="text-emerald-400 font-bold tracking-widest">ACTIVE</div>
                            </div>
                        </DeepCard>
                    </div>
                </div>

                {/* RIGHT COL: Data Stream (3/12) */}
                <div className="col-span-12 lg:col-span-3">
                    <DeepCard title="Data Ingestion" className="h-full font-mono text-xs overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black pointer-events-none z-10" />
                        <div className="space-y-2 opacity-70">
                            {ingestionLogs.length === 0 && (
                                <div className="text-cyan-500/50 p-2 animate-pulse">Listening for data streams...</div>
                            )}
                            {ingestionLogs.map((log) => (
                                <div key={log.id} className="flex gap-2 border-b border-white/5 pb-1 animate-in fade-in slide-in-from-right-2 duration-300">
                                    <span className="text-white/30 truncate w-16 text-right">
                                        {new Date(log.created_at).toLocaleTimeString([], { hour12: false })}
                                    </span>
                                    <span className="text-cyan-400 truncate flex-1">
                                        {log.event_type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </DeepCard>
                </div>

            </div>
        </div>
    );
}

function DeepCard({ children, title, className = '' }: { children: React.ReactNode, title?: string, className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl ${GLASS_PANEL} p-1 relative overflow-hidden flex flex-col ${className}`}
        >
            <div className={`absolute inset-0 ${NEUMORPHIC_INNER} pointer-events-none rounded-2xl`} />
            {title && (
                <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <span className="text-xs font-bold uppercase tracking-widest text-cyan-100/70">{title}</span>
                    <div className="flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-cyan-500" />
                        <div className="w-1 h-1 rounded-full bg-white/30" />
                    </div>
                </div>
            )}
            <div className="p-4 flex-1 relative z-10">
                {children}
            </div>
        </motion.div>
    );
}

function QuickStat({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className={`px-4 py-2 rounded-lg ${GLASS_PANEL} flex items-center gap-3`}>
            {Icon && <Icon size={14} className="text-cyan-400/70" />}
            <span className="text-cyan-500/50 text-xs font-bold">{label}</span>
            <span className="text-cyan-100 font-mono text-sm">{value}</span>
        </div>
    );
}
