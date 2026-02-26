'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, Clock, Cpu, HardDrive, Monitor, Globe } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ServiceStatus {
    status: string;
    latency?: number;
    data?: {
        uptime?: number;
        system?: {
            cpuLoad?: number;
            memoryPercent?: number;
        };
    };
}

interface StatusData {
    status: string;
    summary: string;
    timestamp: string;
    services: Record<string, ServiceStatus>;
    mesh?: {
        total_nodes: number;
        online_nodes: number;
        regional_distribution: Record<string, number>;
    };
}

interface TelemetryData {
    cpu: number;
    memory: number;
    totalMemoryGB: number;
    timestamp: number;
    timeLabel: string;
}

export function SystemStatus() {
    const [data, setData] = useState<StatusData | null>(null);
    const [telemetry, setTelemetry] = useState<TelemetryData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/status');
                if (res.ok) setData(await res.json());

                const telRes = await fetch('/api/telemetry');
                if (telRes.ok) {
                    const tel = await telRes.json();
                    const now = new Date();
                    const timeLabel = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
                    setTelemetry(prev => {
                        const next = [...prev, { ...tel, timeLabel }];
                        if (next.length > 20) return next.slice(next.length - 20); // Keep last 20 frames
                        return next;
                    });
                }
            } catch { /* ignore */ }
            setLoading(false);
        };
        fetchStatus();
        const timer = setInterval(fetchStatus, 3000);
        return () => clearInterval(timer);
    }, []);

    if (loading || !data) return null;

    const statusColor = data.status === 'all_online' ? 'emerald' : data.status === 'partial' ? 'amber' : 'red';

    return (
        <div className="mt-8 sm:mt-12 max-w-[700px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <Activity className={`w-3.5 h-3.5 text-${statusColor}-400`} />
                    <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">System Status</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full bg-${statusColor}-500/10 text-${statusColor}-400 border border-${statusColor}-500/20`}>
                    {data.summary}
                </span>
            </div>

            {/* Service Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(data.services).map(([name, svc]) => {
                    const isOnline = svc.status === 'online';
                    const uptime = svc.data?.uptime;
                    const uptimeStr = uptime ? `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m` : '—';
                    const cpu = svc.data?.system?.cpuLoad;
                    const ram = svc.data?.system?.memoryPercent;

                    return (
                        <div
                            key={name}
                            className={`relative rounded-xl p-3 border transition-all ${isOnline
                                ? 'bg-white/[0.03] border-white/[0.06] hover:border-emerald-500/20'
                                : 'bg-red-500/[0.03] border-red-500/10'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-mono text-white/70 capitalize">{name}</span>
                                {isOnline
                                    ? <Wifi className="w-3 h-3 text-emerald-400/60" />
                                    : <WifiOff className="w-3 h-3 text-red-400/60" />}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-white/30 font-mono">
                                {svc.latency !== undefined && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        {svc.latency}ms
                                    </span>
                                )}
                                {cpu !== undefined && (
                                    <span className="flex items-center gap-1">
                                        <Cpu className="w-2.5 h-2.5" />
                                        {cpu}%
                                    </span>
                                )}
                                {ram !== undefined && (
                                    <span className="flex items-center gap-1">
                                        <HardDrive className="w-2.5 h-2.5" />
                                        {ram}%
                                    </span>
                                )}
                            </div>
                            {isOnline && (
                                <div className="mt-1.5 text-[9px] text-white/15 font-mono">
                                    Up {uptimeStr}
                                </div>
                            )}
                            {/* Status dot */}
                            <div className={`absolute top-3 right-8 w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                                }`} />
                        </div>
                    );
                })}
            </div>

            {/* Live Hardware Telemetry */}
            {telemetry.length > 0 && (
                <div className="mt-8">
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Monitor className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">Hardware Telemetry</span>
                        <span className="ml-auto text-[10px] text-white/30 font-mono hidden sm:block">
                            {telemetry[telemetry.length - 1].totalMemoryGB} GB RAM
                        </span>
                    </div>
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={telemetry} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="timeLabel" stroke="#ffffff20" fontSize={10} tickMargin={8} minTickGap={20} />
                                <YAxis stroke="#ffffff20" fontSize={10} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#06060f', borderColor: '#ffffff10', fontSize: '11px', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '11px', color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="cpu" name="CPU Load %" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                                <Area type="monotone" dataKey="memory" name="Memory Load %" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRam)" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* AI Telemetry Quota Section */}
            <div className="mt-8">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">Antigravity Quota</span>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 flex flex-col md:flex-row gap-6">
                    {/* Token Usage */}
                    <div className="flex-1 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-mono text-white/40">Tokens Used (24h)</span>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-mono text-white">42,850</span>
                            <span className="text-xs font-mono text-indigo-400 mb-1">/ 1M Limit</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full w-[4.2%]" />
                        </div>
                    </div>

                    <div className="w-px bg-white/5 hidden md:block" />

                    {/* Active AIs */}
                    <div className="flex-1 flex flex-col gap-2 justify-center font-mono">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-white/40">Sage (Reflect)</span>
                            <span className="text-emerald-400">Active</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-white/40">Ralph (Ghost)</span>
                            <span className="text-emerald-400">Active</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-white/40">Nexus Analytics</span>
                            <span className="text-emerald-400">Active</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Planetary Mesh (Phase 47) */}
            {data.mesh && (
                <div className="mt-8">
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">Planetary Mesh</span>
                        <div className="ml-auto flex items-center gap-4">
                            <span className="text-[10px] text-white/30 font-mono">
                                {data.mesh.online_nodes} / {data.mesh.total_nodes} Nodes Global
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(data.mesh.regional_distribution).map(([region, count]) => (
                            <div key={region} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex flex-col gap-1 transition-all hover:border-cyan-500/20">
                                <span className="text-[9px] font-mono text-white/30 uppercase tracking-tighter truncate">{region}</span>
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-mono text-cyan-400">{count}</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-pulse" />
                                </div>
                            </div>
                        ))}
                        {Object.keys(data.mesh.regional_distribution).length === 0 && (
                            <div className="col-span-full py-6 text-center text-[10px] text-white/10 font-mono border border-dashed border-white/5 rounded-xl">
                                Synchronizing planetary coordinate mesh...
                            </div>
                        )}
                    </div>

                    <div className="mt-4 p-2 bg-cyan-500/5 border border-cyan-500/10 rounded-lg flex items-center justify-center gap-3">
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                            ))}
                        </div>
                        <span className="text-[8px] font-mono text-cyan-400/60 uppercase tracking-widest">Global Broadcast Synchronization Active</span>
                    </div>
                </div>
            )}
        </div>
    );
}
