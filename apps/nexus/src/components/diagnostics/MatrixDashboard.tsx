'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, AlertTriangle, TrendingUp, RefreshCw, ChevronDown, ChevronUp, Gauge } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { TriageHealth } from './TriageHealth';

interface DiagnosticEntry {
    id: string;
    timestamp: string;
    app: string;
    category: string;
    severity: string;
    action: string;
    duration?: number;
    metadata?: Record<string, any>;
}

interface AppMetrics {
    app: string;
    totalActions: number;
    errors: number;
    avgDuration: number;
}

const formatAppLabel = (app: string) => {
    if (app === 'nexus') return 'Matrix Hub';
    return app.replace(/_/g, ' ');
};

const MetricGauge = React.memo(({ metric }: { metric: AppMetrics }) => (
    <div className="module-card p-5 group/gauge relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/[0.03] to-transparent opacity-0 group-hover/gauge:opacity-100 transition-opacity duration-700" />

        <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] truncate block">{formatAppLabel(metric.app)}</span>
                <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Active_Node_0x{metric.app.substring(0, 2).toUpperCase()}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover/gauge:border-cyan-500/30 transition-colors">
                <Gauge size={12} className="text-slate-500 group-hover/gauge:text-cyan-400 transition-colors" />
            </div>
        </div>

        <div className="flex items-end justify-between relative z-10">
            <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white tracking-tighter leading-none">{metric.totalActions}</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ops</span>
                </div>
                <div className="text-[7px] text-slate-600 font-black uppercase tracking-[0.4em]">Throughput_Metric</div>
            </div>

            <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-cyan-500/60 font-black italic">{metric.avgDuration}ms</span>
                    <div className="w-1 h-3 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.min(100, (metric.avgDuration / 500) * 100)}%` }}
                            className={cn("w-full transition-colors", metric.avgDuration > 300 ? "bg-amber-500" : "bg-cyan-500")}
                        />
                    </div>
                </div>

                {metric.errors > 0 ? (
                    <div className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                        <AlertTriangle size={10} className="animate-pulse" />
                        {metric.errors} FAILURE
                    </div>
                ) : (
                    <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest border-b-2">
                        NOMINAL
                    </div>
                )}
            </div>
        </div>

        {/* Backdrop Visual Detail */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5" />
        <motion.div
            className="absolute bottom-0 left-0 h-[2px] bg-cyan-500/30"
            animate={{ width: ['0%', '100%', '0%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
    </div>
));

MetricGauge.displayName = 'MetricGauge';

export function MatrixDashboard() {
    const [entries, setEntries] = useState<DiagnosticEntry[]>([]);
    const [metrics, setMetrics] = useState<AppMetrics[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const loadDiagnostics = async () => {
        setIsLoading(true);
        try {
            const { data: recentData } = await supabase
                .from('matrix_diagnostics')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(50);

            if (recentData) setEntries(recentData);

            const { data: allData } = await supabase
                .from('matrix_diagnostics')
                .select('*')
                .gte('timestamp', new Date(Date.now() - 3600000).toISOString())
                .limit(100);

            if (allData) {
                const calculatedMetrics = Object.entries(
                    allData.reduce((acc: Record<string, DiagnosticEntry[]>, entry) => {
                        if (!acc[entry.app]) acc[entry.app] = [];
                        acc[entry.app].push(entry);
                        return acc;
                    }, {})
                ).map(([app, appEntries]: any) => {
                    const durationEntries = appEntries.filter(e => e.duration);
                    const avgDuration = durationEntries.length > 0
                        ? durationEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / durationEntries.length
                        : 0;

                    return {
                        app,
                        totalActions: appEntries.length,
                        errors: appEntries.filter(e => e.category === 'error').length,
                        avgDuration: Math.round(avgDuration),
                    };
                });

                setMetrics(calculatedMetrics);
            }

            setLastRefresh(new Date());
        } catch (error) {
            console.error('Failed to load diagnostics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDiagnostics();
        const interval = setInterval(loadDiagnostics, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const channel = supabase
            .channel('matrix_diagnostics_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matrix_diagnostics' }, (payload) => {
                setEntries(prev => [payload.new as DiagnosticEntry, ...prev.slice(0, 49)]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="space-y-8 relative group">
            {/* Header: Industrial Telemetry */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 relative">
                        <TrendingUp size={18} className="text-white opacity-40" />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-white/20 blur-md rounded-full pointer-events-none"
                        />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic mb-1.5 leading-none">Diagnostic_Matrix_Grid</h3>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.6em] italic opacity-60">
                            Neural_Sync // {lastRefresh ? lastRefresh.toLocaleTimeString([], { hour12: false }) : 'RECOGNIZING...'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={loadDiagnostics}
                        disabled={isLoading}
                        className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 text-slate-500 hover:text-white transition-all transition-duration-500"
                    >
                        <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
                    </motion.button>
                </div>
            </div>

            {/* Triage Health Sub-section */}
            <div className="grid grid-cols-3 gap-4 px-1">
                <TriageHealth app="reflect" compact />
                <TriageHealth app="nexus" compact />
                <TriageHealth app="ghost-command" compact />
            </div>

            {/* Metrics Gauges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {metrics.length > 0 ? metrics.map(m => (
                    <MetricGauge key={m.app} metric={m} />
                )) : (
                    <div className="col-span-3 py-16 text-center module-card border-dashed">
                        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em] italic">No_Telemetry_Detected</p>
                    </div>
                )}
            </div>

            {/* Action Bar / Toggle */}
            <div className="pt-4 border-t border-white/5 flex justify-center">
                <button type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex flex-col items-center gap-2 group/expand"
                >
                    <span className="text-[9px] font-black text-slate-600 group-hover/expand:text-cyan-400/60 uppercase tracking-[0.4em] transition-colors italic">
                        {isExpanded ? 'Collapse_Full_Stack' : 'Expand_Neural_Stream'}
                    </span>
                    <div className="p-1.5 rounded-full bg-white/5 border border-white/5 group-hover/expand:border-cyan-500/30 transition-all">
                        {isExpanded ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
                    </div>
                </button>
            </div>

            {/* Expanded Stream View */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-black/20 rounded-2xl border border-white/5"
                    >
                        <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
                            {entries.map((entry, i) => (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="px-4 py-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.04] border border-transparent hover:border-white/5 transition-all flex items-center justify-between group/entry"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-1 h-6 rounded-full",
                                            entry.severity === 'critical' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' :
                                                entry.severity === 'warning' ? 'bg-amber-500' : 'bg-slate-700'
                                        )} />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-white uppercase tracking-wider group-hover/entry:text-cyan-400 transition-colors truncate max-w-[200px] block">
                                                {entry.action}
                                            </span>
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mt-1">
                                                {entry.app} // {entry.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-right">
                                        {entry.duration && (
                                            <span className="text-[9px] font-mono font-bold text-cyan-500/40 italic">
                                                {entry.duration}ms
                                            </span>
                                        )}
                                        <span className="text-[8px] font-mono font-bold text-slate-700 leading-none">
                                            {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 1 })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
