'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, HardDrive, Wifi, WifiOff, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NeuralSurface } from '../ui/NeuralSurface';

interface UptimeSnapshot {
    timestamp: string;
    cpu_load: number;
    ram_usage: number;
    uptime_hours: number;
    services: Record<string, boolean>;
    all_healthy: boolean;
}

export function SystemHealthWidget() {
    const [snapshots, setSnapshots] = useState<UptimeSnapshot[]>([]);
    const [latest, setLatest] = useState<UptimeSnapshot | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
                .from('uptime_log')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(24); // Last 6 hours at 15min intervals

            if (data && data.length > 0) {
                setSnapshots(data.reverse());
                setLatest(data[data.length - 1]);
            }
            setIsLoading(false);
        };

        fetchData();

        // Live subscription for new snapshots
        const channel = supabase.channel('uptime_live')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'uptime_log' },
                (payload) => {
                    const newSnap = payload.new as UptimeSnapshot;
                    setSnapshots(prev => [...prev.slice(-23), newSnap]);
                    setLatest(newSnap);
                }
            ).subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const maxRam = Math.max(...snapshots.map(s => s.ram_usage || 0), 100);

    if (isLoading) {
        return (
            <NeuralSurface variant="glass" className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <Activity className="text-cyan-400 animate-pulse" size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Health Data...</span>
                </div>
            </NeuralSurface>
        );
    }

    return (
        <NeuralSurface variant="glass" className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="text-cyan-400" size={18} />
                    <span className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">System Health</span>
                </div>
                {latest && (
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${latest.all_healthy
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}>
                        {latest.all_healthy ? '● ALL NOMINAL' : '● DEGRADED'}
                    </span>
                )}
            </div>

            {/* Mini RAM Chart */}
            {snapshots.length > 1 && (
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">RAM Usage (6h)</span>
                        <span className="text-[10px] text-slate-400 font-mono">{latest?.ram_usage || 0}%</span>
                    </div>
                    <div className="flex items-end gap-[2px] h-12">
                        {snapshots.map((snap, i) => {
                            const height = Math.max(4, (snap.ram_usage / maxRam) * 100);
                            const isHigh = snap.ram_usage > 85;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ delay: i * 0.02, duration: 0.3 }}
                                    className={`flex-1 rounded-sm min-w-[3px] ${isHigh ? 'bg-rose-500/60' : 'bg-cyan-500/40'
                                        }`}
                                    title={`${snap.ram_usage}% @ ${new Date(snap.timestamp).toLocaleTimeString()}`}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Vital Stats */}
            {latest && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1">
                            <Cpu size={10} className="text-violet-400" />
                            <span className="text-[9px] text-slate-500 uppercase">CPU</span>
                        </div>
                        <span className="text-sm font-bold text-white font-mono">{latest.cpu_load?.toFixed(1) || '—'}</span>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1">
                            <HardDrive size={10} className="text-amber-400" />
                            <span className="text-[9px] text-slate-500 uppercase">RAM</span>
                        </div>
                        <span className="text-sm font-bold text-white font-mono">{latest.ram_usage || '—'}%</span>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1">
                            <Clock size={10} className="text-emerald-400" />
                            <span className="text-[9px] text-slate-500 uppercase">Uptime</span>
                        </div>
                        <span className="text-sm font-bold text-white font-mono">{latest.uptime_hours?.toFixed(0) || '—'}h</span>
                    </div>
                </div>
            )}

            {/* Service Status */}
            {latest?.services && (
                <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(latest.services).map(([name, online]) => (
                        <div
                            key={name}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${online
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}
                        >
                            {online ? <Wifi size={8} /> : <WifiOff size={8} />}
                            {name}
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {snapshots.length === 0 && (
                <div className="text-center py-4">
                    <TrendingUp className="mx-auto text-slate-600 mb-2" size={24} />
                    <p className="text-xs text-slate-500">No health data yet. Ghost Brain will populate this.</p>
                </div>
            )}
        </NeuralSurface>
    );
}
