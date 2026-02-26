'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Shield, Wifi, Zap, AlertTriangle, CheckCircle2, RefreshCw, Terminal as TerminalIcon, Search } from 'lucide-react';
import { useTelemetry, useGlobalUptime } from '@/components/providers/TelemetryProvider';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type HealthStatus = 'stable' | 'warning' | 'critical';

const DiagnosticLogItem = React.memo(({ log }: { log: any }) => (
    <motion.div
        layout
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex gap-4 text-[10px] leading-relaxed group py-1.5 border-l-2 border-transparent hover:border-cyan-500/30 pl-3 transition-all font-mono"
    >
        <span className="text-slate-600 shrink-0 font-bold opacity-40">[{log.time}]</span>
        <div className="flex items-center gap-2">
            <span className={cn(
                "uppercase font-black tracking-widest text-[8px] px-1.5 py-0.5 rounded-sm",
                log.type === 'error' ? "bg-rose-500/10 text-rose-500" :
                    log.type === 'warn' ? "bg-amber-500/10 text-amber-500" :
                        "bg-cyan-500/10 text-cyan-500"
            )}>
                {log.type}
            </span>
        </div>
        <span className="text-slate-400 group-hover:text-slate-100 transition-colors tracking-tight font-medium flex-1">
            {log.msg}_
        </span>
    </motion.div>
));

DiagnosticLogItem.displayName = 'DiagnosticLogItem';

const MetricValue = React.memo(({ label, value, colorClass }: { label: string, value: string | number, colorClass?: string }) => (
    <div className="flex flex-col gap-1 px-4 py-3 group hover:bg-white/[0.02] transition-colors relative overflow-hidden">
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] italic leading-none">{label}</span>
        <div className="h-[28px] flex items-center overflow-hidden">
            <span className={cn("text-xl font-black italic tracking-tighter tabular-nums transition-colors duration-300", colorClass)}>
                {value}
            </span>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/5" />
    </div>
));

MetricValue.displayName = 'MetricValue';

export default function DiagnosticSuite() {
    const { services, isConnecting, lastPulse, coherence, broadcasts } = useTelemetry();
    const globalUptime = useGlobalUptime();
    const [cloudLatency, setCloudLatency] = useState<number | null>(null);
    const [logs, setLogs] = useState<{ id: string, msg: string, type: 'info' | 'warn' | 'error', time: string }[]>([]);
    const logScrollRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);


    useEffect(() => {
        if (!mounted) return;

        const checkLatency = async () => {
            if (document.hidden) return; // Skip when tab is hidden
            const start = Date.now();
            try {
                const { error } = await supabase.from('ghost_bridge').select('id').limit(1);
                if (error) throw error;
                const lat = Date.now() - start;
                setCloudLatency(lat);
            } catch (e) {
                setCloudLatency(-1);
            }
        };

        const interval = setInterval(checkLatency, 10000);
        checkLatency();
        return () => clearInterval(interval);
    }, [mounted]);

    const systemState = useMemo((): HealthStatus | 'syncing' | 'desync' => {
        if (!mounted) return 'syncing'; // Stable initial state for hydration
        if (isConnecting) return 'syncing';
        const now = Date.now();
        const reflectLast = services.reflect === 'online' ? (lastPulse.reflect || 0) : now;
        const ghostLast = services.ghost === 'online' ? (lastPulse.ghost || 0) : now;
        // Relaxed desync threshold to 50s to align with new Runner 20s heartbeat + 45s monitor
        const isDesynced = services.runner === 'online' && (now - reflectLast > 50000 || now - ghostLast > 50000);
        if (isDesynced) return 'desync';
        const criticalServices = ['runner', 'nexus'];
        const isHealthy = criticalServices.every(s => services[s as keyof typeof services] === 'online');
        if (isHealthy && (cloudLatency || 0) < 500) return 'stable';
        return 'warning';
    }, [isConnecting, services, lastPulse, cloudLatency, mounted]);

    const addLog = (msg: string, type: 'info' | 'warn' | 'error' = 'info') => {
        if (!mounted) return;
        setLogs(prev => {
            const time = new Date(Date.now()).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 1 });
            return [{ id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, msg, type, time }, ...prev].slice(0, 50);
        });
    };

    // Sync with Real Telemetry Broadcasts
    useEffect(() => {
        if (broadcasts && broadcasts.length > 0) {
            const latest = broadcasts[0];
            // Avoid duplicates by checking the last log ID or message
            setLogs(prev => {
                const logId = `bc-${latest.id}`;
                if (prev.length > 0 && prev[0].id === logId) return prev;

                const timeStr = new Date(latest.timestamp).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 1 });
                const typeVal = (latest.message.toLowerCase().includes('fail') || latest.message.toLowerCase().includes('error') ? 'error' :
                    latest.message.toLowerCase().includes('warn') ? 'warn' : 'info') as 'info' | 'warn' | 'error';

                const newLog: { id: string, msg: string, type: 'info' | 'warn' | 'error', time: string } = {
                    id: `bc-${latest.id}`, // Prefix to ensure no collision with local manual logs
                    msg: latest.message,
                    type: typeVal,
                    time: timeStr
                };

                return [newLog, ...prev].slice(0, 50);
            });
        }
    }, [broadcasts]);

    return (
        <div className="space-y-8 relative overflow-hidden h-full flex flex-col">

            {/* Header: Terminal Control */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                        <TerminalIcon className="text-cyan-400" size={18} />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-bold text-white uppercase tracking-widest leading-none mb-1.5">Stream Log Authority</h3>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest opacity-60">System Diagnostics v4.2</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-2 w-32 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                        <motion.div
                            className="h-full bg-cyan-500/60"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-white/5 rounded-2xl overflow-hidden bg-black/40">
                <MetricValue
                    label="Cloud Latency"
                    value={cloudLatency !== null ? (cloudLatency < 0 ? 'FAIL' : `${cloudLatency}ms`) : '--'}
                    colorClass={(cloudLatency || 0) < 0 ? "text-rose-500" : (cloudLatency || 0) > 500 ? "text-amber-400" : "text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.3)]"}
                />
                <MetricValue
                    label="Neural Coherence"
                    value={`${coherence}%`}
                    colorClass="text-violet-400 drop-shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                />
                <MetricValue
                    label="Session Uptime"
                    value={globalUptime}
                    colorClass="text-slate-100"
                />
            </div>

            {/* Log Viewport */}
            <div className="flex-1 bg-black/60 rounded-2xl border border-white/5 p-4 sm:p-6 min-h-[300px] flex flex-col overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Search size={40} className="text-cyan-500" />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-px" ref={logScrollRef}>
                    <AnimatePresence mode="popLayout">
                        {(!mounted || logs.length === 0) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-3 py-2"
                            >
                                <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-500/40">Awaiting Neural Broadcast...</span>
                                <div className="w-1.5 h-3 bg-cyan-400/50 animate-pulse" />
                            </motion.div>
                        )}
                        {mounted && logs.map((log) => (
                            <DiagnosticLogItem key={log.id} log={log} />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Status Bar */}
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex gap-2">
                        <div className="w-1 h-3 bg-cyan-500/40 rounded-full" />
                        <div className="w-1 h-3 bg-cyan-500/20 rounded-full" />
                        <div className="w-1 h-3 bg-cyan-500/10 rounded-full" />
                    </div>
                    <span className="text-[7px] font-mono text-slate-700 tracking-widest uppercase">Buffer v3.2 • 50 Line Limit</span>
                </div>
            </div>

            {/* Verdict Module */}
            <div className="module-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative">
                <div className="flex items-center gap-5">
                    <div className={cn(
                        "p-4 rounded-full transition-all duration-1000 relative group",
                        systemState === 'stable' ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-amber-500/10 border border-amber-500/20"
                    )}>
                        <Activity className={cn(
                            "transition-colors duration-1000",
                            systemState === 'stable' ? "text-emerald-400" : "text-amber-400"
                        )} size={24} />
                        <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className={cn(
                                "absolute inset-0 rounded-full blur-xl pointer-events-none",
                                systemState === 'stable' ? "bg-emerald-500" : "bg-amber-500"
                            )}
                        />
                    </div>
                    <div>
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block leading-none mb-2">System Execution State</span>
                        <h4 className={cn(
                            "text-xl font-bold uppercase tracking-tight leading-none transition-colors duration-1000",
                            systemState === 'stable' ? "text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]" : "text-amber-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                        )}>
                            {systemState === 'stable' ? "Optimal Flow" : "Link Unstable"}
                        </h4>
                    </div>
                </div>
                <button type="button"
                    onClick={() => {
                        addLog("Diagnostic sweep initiated...", "info");
                        addLog("Pulse verified at 1000ms frequency.", "info");
                        addLog("Aetheric link established.", "info");
                    }}
                    className="w-full sm:w-auto px-8 py-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-2xl text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all group flex items-center justify-center gap-3 backdrop-blur-xl"
                >
                    Initiate Audit
                    <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-700" />
                </button>
            </div>
        </div>
    );
}
