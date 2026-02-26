'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Play, CheckCircle2, AlertCircle, Clock, Terminal, ChevronRight, Activity, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { SimulationToggle } from './SimulationToggle';

interface MissionLog {
    message: string;
    type?: string;
    timestamp: string;
}

interface Mission {
    id: string;
    title: string;
    description: string;
    status: 'queued' | 'active' | 'pending_review' | 'completed' | 'failed' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'critical';
    created_at: string;
    logs?: MissionLog[];
}

const MissionItem = React.memo(({ mission, isExpanded, onToggle }: {
    mission: Mission,
    isExpanded: boolean,
    onToggle: () => void
}) => {
    const isActive = mission.status === 'active';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "p-5 rounded-[20px] border transition-all duration-700 flex flex-col gap-4 group/item",
                isActive
                    ? "bg-violet-500/[0.04] border-violet-500/20 shadow-[0_0_40px_rgba(139,92,246,0.05)]"
                    : "bg-white/[0.01] border-white/5 opacity-60 hover:opacity-100 hover:border-white/10"
            )}
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 shrink-0 relative overflow-hidden",
                        isActive ? "bg-violet-400 text-black" : "bg-white/5 text-white/20"
                    )}>
                        {isActive && (
                            <motion.div
                                className="absolute inset-0 bg-white/40"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            />
                        )}
                        <div className="relative z-10">
                            {mission.status === 'completed' ? <CheckCircle2 size={18} /> :
                                mission.status === 'failed' ? <AlertCircle size={18} /> :
                                    <Target size={18} className={cn(isActive && "animate-pulse")} />}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[12px] font-black uppercase tracking-[0.1em] text-white/90 truncate group-hover/item:text-violet-300 transition-colors">
                            {mission.title}
                        </span>
                        <span className="text-[10px] font-mono text-white/20 truncate italic uppercase tracking-widest">
                            {mission.description}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex flex-col items-end gap-1">
                        <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest italic px-2 py-0.5 rounded-sm",
                            mission.priority === 'critical' ? "bg-rose-500/20 text-rose-400" :
                                mission.priority === 'high' ? "bg-amber-500/20 text-amber-400" :
                                    "bg-white/5 text-white/40"
                        )}>
                            {mission.priority}
                        </span>
                        <span className="text-[9px] font-mono opacity-20 uppercase tracking-tighter tabular-nums">
                            {new Date(mission.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    <button type="button"
                        onClick={onToggle}
                        className={cn(
                            "w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all",
                            isExpanded && "bg-white/10 border-white/20"
                        )}
                    >
                        <ChevronRight size={14} className={cn("opacity-40 transition-transform duration-500", isExpanded && "rotate-90 opacity-100")} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && mission.logs && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/5 pt-4 space-y-2"
                    >
                        {mission.logs.map((log, i) => (
                            <div key={i} className="flex gap-3 text-[10px] font-mono py-1.5 px-3 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5">
                                <span className="text-white/10 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                                <span className={cn(
                                    "uppercase font-black tracking-widest text-[9px]",
                                    log.type === 'error' ? "text-rose-500" : "text-violet-500/60"
                                )}>{log.type || 'PULSE'}::</span>
                                <span className="text-slate-400 group-hover/item:text-slate-200 transition-colors uppercase tracking-tight font-black">
                                    {log.message}
                                </span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

MissionItem.displayName = 'MissionItem';

export default function MissionControl() {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    const fetchMissions = async () => {
        const { data, error } = await supabase
            .from('matrix_missions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (!error && data) setMissions(data);
    };

    useEffect(() => {
        setMounted(true);
        fetchMissions();

        const channel = supabase
            .channel('mission_updates_redefined')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matrix_missions' }, fetchMissions)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const activeCount = useMemo(() => missions.filter(m => m.status === 'active').length, [missions]);

    const toggleExpanded = useCallback((id: string) => {
        setExpandedId(prev => prev === id ? null : id);
    }, []);

    return (
        <div className="space-y-8 relative">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
                            <Target className="text-violet-400" size={20} />
                        </div>
                        {activeCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-violet-400 rounded-full border-2 border-[#050505] animate-pulse" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-[12px] font-black text-white uppercase tracking-[0.4em] italic leading-none mb-1.5">Mission Authority Core</h3>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.6em] italic opacity-60">Objective Tracker // Active {activeCount}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <SimulationToggle />
                </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                <AnimatePresence mode="popLayout" initial={false}>
                    {missions.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center opacity-10 gap-4 border border-dashed border-white/20 rounded-3xl">
                            <Activity size={40} className="animate-spin-slow" />
                            <span className="text-[12px] font-black uppercase tracking-[0.5em] italic">No Terminal Orders</span>
                        </div>
                    ) : (
                        missions.map((mission) => (
                            <MissionItem
                                key={mission.id}
                                mission={mission}
                                isExpanded={expandedId === mission.id}
                                onToggle={() => toggleExpanded(mission.id)}
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>

            <button type="button"
                onClick={fetchMissions}
                className="w-full py-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-2xl flex items-center justify-center gap-3 group transition-all"
            >
                <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 group-hover:border-violet-500/30 transition-colors">
                    <Zap size={12} className="text-slate-500 group-hover:text-violet-400 transition-colors" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 group-hover:text-white transition-colors">Request Global Audit</span>
            </button>
        </div>
    );
}
