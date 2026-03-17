'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Send, Shield, Zap, Database, Clock, Terminal, AlertTriangle, Activity, Wifi, ChevronRight, MoreHorizontal, Radar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useSage } from '@/context/SageContext';
import { ProgressBar, Badge } from '@/components/ui/DesignTokens';

export default function MissionBoard() {
    const { sendCommand, systemHealth } = useSage();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const hasSupabase = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder';
    const [missions, setMissions] = useState<any[]>([]);
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeCount, setActiveCount] = useState(0);
    const [lastSync, setLastSync] = useState<string>('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchMissions = useCallback(async () => {
        if (!hasSupabase) {
            setMissions([]);
            setLastSync('');
            return;
        }
        const { data } = await supabase
            .from('matrix_missions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        if (data) {
            setMissions(data);
            setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
    }, [hasSupabase]);

    useEffect(() => {
        fetchMissions();
        if (!hasSupabase) return;
        const fetchCount = async () => {
            const { count } = await supabase
                .from('matrix_missions')
                .select('*', { count: 'exact', head: true })
                .neq('status', 'completed')
                .neq('status', 'failed');
            setActiveCount(count || 0);
        };
        fetchCount();

        const channel = supabase
            .channel('mission_board_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matrix_missions' }, (): any => {
                fetchCount();
                fetchMissions();
                setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchMissions, hasSupabase]);

    const dispatchMission = async (customTitle?: string, type: string = 'custom') => {
        if (!hasSupabase) return;
        const finalTitle = customTitle || title;
        if (!finalTitle) return;

        setIsSubmitting(true);
        const { error } = await supabase.from('matrix_missions').insert({
            title: finalTitle,
            description: type === 'custom' ? 'User-defined tactical operation.' : 'Automated system protocol.',
            priority,
            payload: { type },
            status: 'queued'
        });

        if (!error) {
            setTitle('');
            await sendCommand(`mission:${finalTitle}`, { silent: true });
        }
        setIsSubmitting(false);
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'completed': return 'emerald';
            case 'executing': return 'blue';
            case 'failed': return 'red';
            case 'queued': return 'amber';
            default: return 'slate';
        }
    };

    const handleRetryMission = async (missionId: string) => {
        if (!hasSupabase) return;
        await supabase.from('matrix_missions').update({ status: 'queued' }).eq('id', missionId);
    };

    const handleCancelMission = async (missionId: string) => {
        if (!hasSupabase) return;
        await supabase.from('matrix_missions').update({ status: 'cancelled' }).eq('id', missionId);
    };

    const handlePauseMission = async (missionId: string) => {
        if (!hasSupabase) return;
        await supabase.from('matrix_missions').update({ status: 'paused' }).eq('id', missionId);
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0f1a] overflow-hidden">
            {/* HEADER */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-slate-700/20 flex items-center justify-between shrink-0 flex-wrap gap-3">
                <div className="flex items-center gap-2 sm:gap-5 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Target size={20} className="text-blue-400 sm:block hidden" />
                        <Target size={16} className="text-blue-400 sm:hidden" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <h2 className="text-lg sm:text-2xl font-bold text-slate-100 truncate">Missions</h2>
                            <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-slate-800/60 border border-slate-700/20">
                                <span className={cn("w-1.5 h-1.5 rounded-full", hasSupabase ? "bg-emerald-500" : "bg-amber-400")} />
                                <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 whitespace-nowrap">{hasSupabase ? `${activeCount} active` : 'Offline'}</span>
                            </div>
                        </div>
                        <p className="text-[11px] sm:text-[12px] text-slate-500 mt-0.5 sm:mt-1">
                            {systemHealth.online ? 'Connected' : 'Offline'} · Last sync {hasSupabase ? (mounted ? (lastSync || '...') : '...') : '—'}
                        </p>
                    </div>
                </div>

                <div className="hidden 2xl:flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-[11px] text-slate-500">Uptime</div>
                        <div className="text-[13px] font-semibold text-slate-300 mt-0.5">{systemHealth.uptime ? `${Math.floor(systemHealth.uptime / 3600)}h ${Math.floor((systemHealth.uptime % 3600) / 60)}m` : '--'}</div>
                    </div>
                    <div className="h-8 w-px bg-slate-700/20" />
                    <div className="text-right">
                        <div className="text-[11px] text-slate-500">Latency</div>
                        <div className={cn("text-[13px] font-semibold mt-0.5", systemHealth.online ? "text-blue-400" : "text-red-400")}>{systemHealth.online ? `${systemHealth.networkLatency}ms` : 'Off'}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* PROTOCOL SELECTOR */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                    <section>
                        <header className="flex items-center gap-3 mb-5">
                            <span className="text-[12px] font-semibold text-slate-400">Quick Actions</span>
                            <div className="h-px flex-1 bg-slate-700/20" />
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[
                                { title: 'Infrastructure Audit', type: 'audit', icon: Shield, color: 'blue', desc: 'Verify gateways and RLS policies.' },
                                { title: 'Memory Snapshot', type: 'snapshot', icon: Database, color: 'emerald', desc: 'Archive current state to cold vault.' },
                                { title: 'Security Hardening', type: 'secure', icon: Zap, color: 'amber', desc: 'Rotate session keys and invalidate orphans.' }
                            ].map((p) => (
                                <button type="button"
                                    key={p.type}
                                    onClick={() => dispatchMission(p.title, p.type)}
                                    className="group relative p-6 bg-slate-800/30 border border-slate-700/20 rounded-2xl text-left hover:bg-slate-800/40 hover:border-slate-600/25 transition-all duration-300 overflow-hidden"
                                >
                                    <div className="relative z-10">
                                        <div className={cn(
                                            "w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-300",
                                            p.color === 'blue' ? "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20" :
                                                p.color === 'emerald' ? "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20" :
                                                    "bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20"
                                        )}>
                                            <p.icon size={22} />
                                        </div>
                                        <h3 className="text-[15px] font-semibold text-slate-200 leading-tight mb-2 group-hover:text-white transition-colors">{p.title}</h3>
                                        <p className="text-[12px] text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors">{p.desc}</p>

                                        <div className="mt-5 flex items-center justify-between">
                                            <span className="text-[10px] text-slate-600">Ready</span>
                                            <div className="p-1.5 rounded-lg bg-slate-700/30 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                <Send size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section>
                        <header className="flex items-center gap-3 mb-5">
                            <span className="text-[12px] font-semibold text-slate-400">Custom Mission</span>
                            <div className="h-px flex-1 bg-slate-700/20" />
                        </header>

                        <div className="p-6 bg-slate-800/30 border border-slate-700/20 rounded-2xl relative overflow-hidden">
                            <div className="relative z-10 max-w-4xl">
                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-700/30 flex items-center justify-center">
                                                <Terminal size={16} className="text-slate-400" />
                                            </div>
                                            <span className="text-[12px] font-medium text-slate-400">Define mission parameters</span>
                                        </div>
                                        <input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Enter mission title..."
                                            className="w-full bg-slate-900/50 border border-slate-700/30 rounded-xl py-3.5 px-4 text-[15px] font-medium text-slate-200 placeholder:text-slate-600 outline-none focus:border-blue-500/40 transition-all"
                                        />
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {['low', 'normal', 'high', 'critical'].map((p) => (
                                                <button type="button"
                                                    key={p}
                                                    onClick={() => setPriority(p as any)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-[11px] font-semibold capitalize border transition-all duration-200",
                                                        priority === p
                                                            ? "bg-blue-500 text-white border-blue-500"
                                                            : "bg-slate-800/40 border-slate-700/20 text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
                                                    )}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button type="button"
                                        disabled={isSubmitting || !title}
                                        onClick={() => dispatchMission()}
                                        className="h-12 px-8 bg-blue-500 text-white rounded-xl font-semibold text-[13px] hover:bg-blue-400 transition-all duration-200 active:scale-95 shadow-md shadow-blue-500/20 flex items-center gap-3 disabled:opacity-30"
                                    >
                                        <span>Create Mission</span>
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* REALTIME MONITOR */}
                <div className="w-[420px] border-l border-slate-700/20 flex flex-col bg-[#070b14] shrink-0 overflow-hidden hidden xl:flex">
                    <div className="px-6 py-5 border-b border-slate-700/20 flex items-center justify-between">
                        <div>
                            <span className="text-[11px] text-slate-500">Live Feed</span>
                            <h3 className="text-[15px] font-semibold text-slate-200 mt-0.5">Mission Monitor</h3>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <span className={cn("w-1.5 h-1.5 rounded-full", hasSupabase ? "bg-emerald-500 animate-pulse" : "bg-amber-400")} />
                            <span className={cn("text-[10px] font-medium", hasSupabase ? "text-emerald-400" : "text-amber-300")}>{hasSupabase ? 'Live' : 'Offline'}</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {missions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-20">
                                    <div className="w-14 h-14 rounded-2xl border border-dashed border-slate-700 flex items-center justify-center">
                                        <Clock size={24} className="text-slate-600" />
                                    </div>
                                    <div>
                                        <span className="block text-[13px] font-medium text-slate-500">No active missions</span>
                                        <p className="text-[11px] text-slate-600 mt-1">Create a mission to get started</p>
                                    </div>
                                </div>
                            ) : (
                                missions.map((m) => {
                                    const variant = getStatusVariant(m.status);
                                    return (
                                        <motion.div
                                            key={m.id}
                                            layout
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group p-4 bg-slate-800/30 border border-slate-700/20 rounded-xl hover:bg-slate-800/40 hover:border-slate-600/25 transition-all duration-200"
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <div className={cn(
                                                            "w-1.5 h-1.5 rounded-full",
                                                            variant === 'emerald' ? "bg-emerald-500" :
                                                                variant === 'blue' ? "bg-blue-500 animate-pulse" :
                                                                    variant === 'red' ? "bg-red-500" : "bg-amber-500"
                                                        )} />
                                                        <span className="text-[10px] text-slate-600 font-mono">#{m.id.substring(0, 6)}</span>
                                                    </div>
                                                    <h4 className="text-[13px] font-semibold text-slate-200 truncate group-hover:text-white transition-colors">{m.title}</h4>
                                                    <div className="mt-2.5 flex items-center gap-3">
                                                        <span className="text-[10px] text-slate-600">
                                                            {new Date(m.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className={cn(
                                                            "text-[10px] font-medium capitalize",
                                                            m.priority === 'critical' ? "text-red-400" : "text-slate-500"
                                                        )}>{m.priority}</span>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize border shrink-0",
                                                    variant === 'emerald' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                                        variant === 'blue' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                                                            variant === 'red' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                                                "bg-slate-800/40 border-slate-700/20 text-slate-400"
                                                )}>
                                                    {m.status}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mb-2">
                                                {m.status === 'executing' && (
                                                    <button type="button"
                                                        onClick={() => handlePauseMission(m.id)}
                                                        className="flex-1 py-1.5 px-2 text-[10px] font-medium rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all"
                                                    >
                                                        Pause
                                                    </button>
                                                )}
                                                {m.status === 'failed' && (
                                                    <button type="button"
                                                        onClick={() => handleRetryMission(m.id)}
                                                        className="flex-1 py-1.5 px-2 text-[10px] font-medium rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all"
                                                    >
                                                        Retry
                                                    </button>
                                                )}
                                                <button type="button"
                                                    onClick={() => handleCancelMission(m.id)}
                                                    className="flex-1 py-1.5 px-2 text-[10px] font-medium rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                            {m.status === 'executing' && (
                                                <div className="mt-3">
                                                    <ExecutingProgress createdAt={m.created_at} />
                                                </div>
                                            )}
                                            {m.status === 'completed' && (
                                                <div className="mt-3">
                                                    <ProgressBar value={100} max={100} color="emerald" size="xs" animated={false} />
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="px-5 py-3 border-t border-slate-700/20">
                        <div className="flex items-center justify-between text-[10px] text-slate-600">
                            <span>{systemHealth.online ? 'Connected' : 'Offline'}</span>
                            <span>AES-256</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Time-based progress for executing missions (estimates based on elapsed time) */
function ExecutingProgress({ createdAt }: { createdAt: string }) {
    const [progress, setProgress] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const update = () => {
            const elapsed = (Date.now() - new Date(createdAt).getTime()) / 1000;
            // Asymptotic curve: fast start, slows toward 95% (never reaches 100 until status changes)
            const pct = Math.min(95, Math.round((1 - Math.exp(-elapsed / 120)) * 100));
            setProgress(pct);
        };
        update();
        const id = setInterval(update, 2000);
        return () => clearInterval(id);
    }, [createdAt, mounted]);

    return <ProgressBar value={progress} max={100} color="cyan" size="sm" showLabel animated />;
}
