'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Server, Database, GitBranch, Terminal, Shield, Zap, Clock, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn exists, else I'll inline it or generic utility



interface AnalyticsData {
    source: 'cloud' | 'local';
    health: Record<string, { timestamp: string; score: number }[]>;
    events: { timestamp: string; category: string; action: string; data: any }[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function MatrixAnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/analytics')
            .then(res => res.json())
            .then(setData)
            .catch(err => console.error("Analytics fetch failed", err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-full w-full">
            <div className="flex flex-col items-center gap-4 text-emerald-500/50">
                <Activity className="animate-pulse" size={48} />
                <span className="text-sm font-mono tracking-widest uppercase">Initializing Telemetry...</span>
            </div>
        </div>
    );

    if (!data) return (
        <div className="p-8 text-red-400 border border-red-500/20 bg-red-500/5 rounded-xl flex items-center gap-4">
            <Shield size={24} />
            <div>
                <h3 className="font-bold">Telemetry Offline</h3>
                <p className="text-sm opacity-70">Could not establish connection to Matrix Core.</p>
            </div>
        </div>
    );

    const apps = Object.keys(data.health);
    const systemHealth = apps.reduce((acc, app) => {
        const points = data.health[app];
        const last = points[points.length - 1];
        return acc + (last?.score || 0);
    }, 0) / (apps.length || 1);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full h-full p-6 lg:p-10 overflow-y-auto space-y-8 max-w-7xl mx-auto"
        >
            {/* HEADER */}
            <motion.header variants={itemVariants} className="flex justify-between items-end border-b border-white/5 pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Terminal className="text-emerald-400" size={24} />
                        <h1 className="text-3xl font-display font-bold text-white tracking-tight">System Telemetry</h1>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-white/40">
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                            <Database size={10} />
                            SOURCE: {data.source.toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <Wifi size={10} />
                            LIVE
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
                        </span>
                    </div>
                </div>

                <div className="text-right hidden sm:block">
                    <div className="text-4xl font-bold text-white mb-1">{Math.round(systemHealth)}%</div>
                    <div className="text-xs text-white/40 uppercase tracking-widest">Global Health</div>
                </div>
            </motion.header>

            {/* HEALTH GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {apps.map(app => {
                    const healthPoints = data.health[app];
                    const latest = healthPoints[healthPoints.length - 1];
                    const score = latest?.score || 0;
                    const statusColor = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';
                    const borderColor = score >= 80 ? 'border-emerald-500/20' : score >= 50 ? 'border-amber-500/20' : 'border-red-500/20';
                    const glowColor = score >= 80 ? 'shadow-emerald-900/20' : score >= 50 ? 'shadow-amber-900/20' : 'shadow-red-900/20';

                    return (
                        <motion.div
                            variants={itemVariants}
                            key={app}
                            className={`relative bg-[#0a0a0a] border ${borderColor} rounded-2xl p-6 overflow-hidden group shadow-lg ${glowColor}`}
                        >
                            {/* Background Noise/Grid */}
                            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

                            <div className="relative z-10 flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest mb-1">{app}</h3>
                                    <div className="flex items-center gap-2 text-[10px] text-white/30">
                                        <Clock size={10} />
                                        LAST SCAN: {new Date(latest?.timestamp || Date.now()).toLocaleTimeString()}
                                    </div>
                                </div>
                                <div className={`p-2 rounded-lg bg-white/5 ${statusColor}`}>
                                    <Activity size={20} />
                                </div>
                            </div>

                            <div className="relative z-10 flex items-baseline gap-2 mb-6">
                                <span className={`text-5xl font-display font-bold ${statusColor} tracking-tighter`}>
                                    {score}
                                </span>
                                <span className="text-sm text-white/30 font-medium">/ 100</span>
                            </div>

                            {/* Chart Visualization */}
                            <div className="relative z-10 h-24 w-full flex items-end justify-between gap-1 pt-4 border-t border-white/5">
                                {healthPoints.slice(-20).map((p, i) => {
                                    const height = `${Math.max(10, p.score)}%`;
                                    const opacity = 0.3 + (i / 20) * 0.7; // Fade in from left
                                    return (
                                        <div
                                            key={i}
                                            className={`w-full rounded-t-sm transition-all duration-500 ${p.score >= 80 ? 'bg-emerald-500' : p.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                }`}
                                            style={{ height, opacity }}
                                        />
                                    );
                                })}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* EVENT STREAM */}
            <motion.div variants={itemVariants} className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                        <GitBranch size={14} />
                        Event Stream
                    </h3>
                    <div className="text-[10px] text-white/30 font-mono">LIVE FEED</div>
                </div>

                <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                    {data.events.slice(0, 20).map((event, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors group">
                            <div className={`p-2 rounded-lg shrink-0 ${event.category === 'deploy' ? 'bg-blue-500/10 text-blue-400' :
                                event.category === 'backup' ? 'bg-purple-500/10 text-purple-400' :
                                    'bg-emerald-500/10 text-emerald-400'
                                }`}>
                                {event.category === 'deploy' ? <Server size={14} /> :
                                    event.category === 'backup' ? <Database size={14} /> :
                                        <Zap size={14} />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-0.5">
                                    <span className="text-white/90 font-medium text-sm">{event.action}</span>
                                    <span className="text-[10px] text-white/30 font-mono px-1.5 py-0.5 rounded bg-white/5">
                                        {new Date(event.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                {event.data && (
                                    <div className="text-xs text-white/40 font-mono truncate group-hover:text-white/60 transition-colors">
                                        {Object.entries(event.data).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {data.events.length === 0 && (
                        <div className="p-8 text-center text-white/20 text-sm font-mono">
                            NO EVENTS RECORDED
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
