'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Cpu, Zap, Activity, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AutoAction {
    id: string;
    type: string;
    timestamp: number;
    metrics: {
        ramPercent?: string;
        cpuLoad?: string;
    };
    status: 'pending' | 'executed' | 'failed';
}

export function AutomationPanel() {
    const [actions, setActions] = useState<AutoAction[]>([]);
    const [enabled, setEnabled] = useState(true);

    useEffect(() => {
        if (!enabled) return;
        loadRecentActions();

        // Listen for new optimization broadcasts
        const channel = supabase
            .channel('automation_panel')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'ghost_bridge', filter: 'source=eq.optimization_cortex' },
                (payload) => {
                    if (payload.new.command === 'sys:broadcast' && payload.new.output) {
                        try {
                            const data = JSON.parse(payload.new.output as string);
                            if (data.type === 'optimization') {
                                loadRecentActions();
                            }
                        } catch (e) { }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [enabled]);

    async function loadRecentActions() {
        const { data } = await supabase
            .from('ghost_bridge')
            .select('id, command, output, status, created_at')
            .eq('source', 'optimization_cortex')
            .order('created_at', { ascending: false })
            .limit(5);

        if (data) {
            const parsed = data.map(item => {
                try {
                    const output = JSON.parse(item.output || '{}');
                    return {
                        id: item.id,
                        type: output.title?.includes('CPU') ? 'cpu' : 'memory',
                        timestamp: new Date(item.created_at).getTime(),
                        metrics: {
                            ramPercent: output.ramPercent ?? output.ram ?? '0',
                            cpuLoad: output.cpuLoad ?? output.cpu ?? '0'
                        },
                        status: item.status
                    } as AutoAction;
                } catch {
                    return null;
                }
            }).filter(Boolean) as AutoAction[];

            setActions(parsed);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <Activity className="text-violet-400" size={20} />
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-white">
                            Autonomous Intelligence
                        </h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                            Self-Optimization Engine
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setEnabled(!enabled)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${enabled
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-slate-700/20 text-slate-500 border border-slate-600/30'
                        }`}
                >
                    {enabled ? 'ACTIVE' : 'PAUSED'}
                </button>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={14} className="text-cyan-400" />
                        <span className="text-[9px] uppercase tracking-wider text-slate-400">Total Actions</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{actions.length}</p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Cpu size={14} className="text-amber-400" />
                        <span className="text-[9px] uppercase tracking-wider text-slate-400">CPU Opts</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {actions.filter(a => a.type === 'cpu').length}
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity size={14} className="text-fuchsia-400" />
                        <span className="text-[9px] uppercase tracking-wider text-slate-400">RAM Opts</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {actions.filter(a => a.type === 'memory').length}
                    </p>
                </div>
            </div>

            {/* Recent Actions */}
            <div className="space-y-2">
                <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Clock size={12} />
                    Recent Optimizations
                </h5>

                {actions.length === 0 ? (
                    <div className="text-center py-8 text-slate-600">
                        <AlertTriangle size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-xs">No autonomous actions yet.</p>
                        <p className="text-[10px] mt-1">System is running smoothly.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {actions.map((action, idx) => (
                            <motion.div
                                key={action.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    {action.type === 'cpu' ? (
                                        <Cpu size={16} className="text-amber-400" />
                                    ) : (
                                        <Activity size={16} className="text-fuchsia-400" />
                                    )}
                                    <div>
                                        <p className="text-xs text-white font-medium capitalize">
                                            {action.type} Optimization
                                        </p>
                                        <p className="text-[10px] text-slate-500">
                                            {new Date(action.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>

                                <span className={`text-[9px] px-2 py-1 rounded-full font-black uppercase ${action.status === 'executed'
                                    ? 'bg-green-500/20 text-green-400'
                                    : action.status === 'failed'
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                    {action.status}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
