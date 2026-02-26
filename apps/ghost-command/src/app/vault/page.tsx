'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    Search, Filter, Database, Clock,
    Shield, Activity, Lock, Download,
    SearchX, AlertCircle, Terminal as TerminalIcon,
    HardDrive
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounceValue } from 'usehooks-ts';
import { Badge } from '@/components/ui/DesignTokens';

interface LogEntry {
    id: string;
    status: 'pending' | 'executing' | 'executed' | 'failed' | 'alert';
    output: string;
    created_at: string;
    command: string;
    user_id: string;
}

export default function VaultPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch] = useDebounceValue(searchTerm, 300);
    const [filter, setFilter] = useState<'ALL' | 'ERROR' | 'SYSTEM'>('ALL');
    const [isLoading, setIsLoading] = useState(true);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const hasSupabase = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder';

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        if (!hasSupabase) {
            setLogs([]);
            setIsLoading(false);
            return;
        }
        const { data } = await supabase
            .from('ghost_bridge')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
        if (data) setLogs(data);
        setIsLoading(false);
    }, [hasSupabase]);

    useEffect(() => {
        fetchLogs();
        if (!hasSupabase) return;

        const channel = supabase
            .channel('vault-logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ghost_bridge' }, (payload: any) => {
                const newLog = payload.new as LogEntry;
                setLogs(prev => [newLog, ...prev.slice(0, 99)]);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchLogs, hasSupabase]);

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.command?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            log.output?.toLowerCase().includes(debouncedSearch.toLowerCase());
        const matchesFilter =
            filter === 'ALL' ? true :
                filter === 'ERROR' ? log.status === 'failed' || log.status === 'alert' :
                    filter === 'SYSTEM' ? (log.command?.startsWith('sys:') || log.command?.startsWith('fs:')) : true;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="flex flex-col h-full bg-[#0a0f1a] overflow-hidden">
            {/* HEADER */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-slate-700/20 shrink-0 space-y-3 sm:space-y-4">
                {/* Title Row */}
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <Database size={20} className="text-indigo-400 sm:block hidden" />
                        <Database size={16} className="text-indigo-400 sm:hidden" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <h1 className="text-lg sm:text-2xl font-bold text-slate-100 truncate">System Vault</h1>
                            <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-slate-800/60 border border-slate-700/20 flex-shrink-0">
                                <span className={cn("w-1.5 h-1.5 rounded-full", hasSupabase ? "bg-emerald-500" : "bg-amber-400")} />
                                <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 whitespace-nowrap">{hasSupabase ? 'Live' : 'Offline'}</span>
                            </div>
                        </div>
                        <p className="text-[11px] sm:text-[12px] text-slate-500 mt-0.5 sm:mt-1">
                            Encrypted archive · AES-256
                        </p>
                    </div>
                </div>

                {/* Search Row */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-800/40 border border-slate-700/20 rounded-lg pl-9 pr-3 py-2 sm:py-2.5 w-full text-[11px] sm:text-[12px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
                    />
                </div>
                {/* Filter Row */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {['ALL', 'ERROR', 'SYSTEM'].map((f) => (
                        <button type="button"
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={cn(
                                "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-[11px] font-medium transition-all whitespace-nowrap",
                                filter === f
                                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                    : "bg-slate-800/40 border border-slate-700/20 text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
                            )}
                        >
                            {f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex overflow-hidden">
                {/* LOG FEED */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3">
                    <AnimatePresence mode="popLayout">
                        {filteredLogs.length === 0 && !isLoading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center text-center gap-4 py-20"
                            >
                                <SearchX size={40} className="text-slate-600" />
                                <div>
                                    <span className="block text-[15px] font-semibold text-slate-400">No logs found</span>
                                    <p className="text-[12px] text-slate-600 mt-1">Adjust your filters or search term</p>
                                </div>
                            </motion.div>
                        ) : (
                            filteredLogs.map((log) => (
                                <motion.div
                                    key={log.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="group relative bg-slate-800/30 border border-slate-700/20 rounded-xl p-5 hover:bg-slate-800/40 hover:border-slate-600/25 transition-all duration-200"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="shrink-0 pt-0.5">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-200",
                                                log.status === 'failed' || log.status === 'alert'
                                                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                                                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                            )}>
                                                {log.status === 'failed' || log.status === 'alert' ? <AlertCircle size={20} /> : <TerminalIcon size={20} />}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-mono text-slate-500">{new Date(log.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-md text-[10px] font-medium",
                                                        log.command?.startsWith('ralph:') ? "bg-amber-500/10 text-amber-400" :
                                                            log.command?.startsWith('sage:') ? "bg-blue-500/10 text-blue-400" :
                                                                "bg-slate-700/30 text-slate-500"
                                                    )}>
                                                        {log.command?.startsWith('ralph:') ? 'Ralph' : log.command?.startsWith('sage:') ? 'Sage' : 'System'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/40">
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        log.status === 'executed' ? "bg-emerald-500" :
                                                            log.status === 'executing' ? "bg-blue-500 animate-pulse" :
                                                                log.status === 'failed' ? "bg-red-500" : "bg-amber-500"
                                                    )} />
                                                    <span className="text-[10px] font-medium text-slate-500 capitalize">{log.status}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2 min-w-0">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-blue-400/50 text-xs shrink-0">$</span>
                                                    <code className="text-[12px] font-mono text-slate-300 group-hover:text-white transition-colors truncate">{log.command}</code>
                                                </div>
                                                <div className={cn(
                                                    "p-3.5 rounded-xl bg-slate-900/50 border border-slate-700/15 text-[13px] leading-relaxed font-mono group-hover:border-slate-600/20 transition-colors break-words max-h-24 overflow-y-auto",
                                                    log.status === 'failed' ? "text-red-300" : "text-slate-400"
                                                )}>
                                                    {log.output || <span className="text-slate-600 italic">No output recorded.</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <button type="button" className="hover:text-blue-400 transition-colors"><Shield size={13} /></button>
                                            <button type="button" className="hover:text-blue-400 transition-colors"><Download size={13} /></button>
                                        </div>
                                    </div>
                                    {log.status === 'executing' && (
                                        <div className="absolute bottom-0 left-6 right-6 h-px bg-blue-500/50" />
                                    )}
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {/* SIDE METRICS BAR */}
                <div className="w-[340px] border-l border-slate-700/20 flex flex-col bg-[#070b14] shrink-0 hidden xl:flex">
                    <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
                        <section>
                            <span className="text-[12px] font-semibold text-slate-400 block mb-4">Vault Health</span>
                            <div className="grid grid-cols-2 gap-3">
                                <MetricCard label="Uptime" value="99.99%" icon={Clock} color="emerald" />
                                <MetricCard label="Integrity" value="Verified" icon={Shield} color="blue" />
                                <MetricCard label="Storage" value="2.4 TB" icon={HardDrive} color="amber" />
                                <MetricCard label="Activity" value="High" icon={Activity} color="red" />
                            </div>
                        </section>

                        <section>
                            <span className="text-[12px] font-semibold text-slate-400 block mb-4">Active Nodes</span>
                            <div className="space-y-2">
                                <NodeStatus name="Matrix Runner" status="Stable" />
                                <NodeStatus name="Sage Inference" status="Stable" />
                                <NodeStatus name="Ralph Executor" status="Idle" />
                                <NodeStatus name="Vault Guardian" status="Stable" />
                            </div>
                        </section>

                        <div className="p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                            <div className="flex items-center gap-3 mb-3">
                                <Lock size={16} className="text-indigo-400" />
                                <span className="text-[12px] font-semibold text-indigo-400">Security</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                All logs are tamper-evident and protected by distributed ledger validation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, color }: any) {
    const variants: any = {
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/15",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/15",
        red: "bg-red-500/10 text-red-400 border-red-500/15",
    };

    return (
        <div className={cn("p-4 rounded-xl border transition-all hover:bg-slate-800/30", variants[color])}>
            <div className="flex items-center justify-between mb-2">
                <Icon size={16} />
                <span className="text-[10px] font-medium text-slate-500">{label}</span>
            </div>
            <div className="text-[15px] font-semibold text-slate-200">{value}</div>
        </div>
    );
}

function NodeStatus({ name, status }: any) {
    const isActive = status.toLowerCase() === 'stable';
    return (
        <div className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-700/20 rounded-xl">
            <span className="text-[12px] font-medium text-slate-400">{name}</span>
            <div className="flex items-center gap-1.5">
                <div className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-slate-600")} />
                <span className={cn("text-[10px] font-medium capitalize", isActive ? "text-emerald-400" : "text-slate-600")}>{status}</span>
            </div>
        </div>
    );
}
