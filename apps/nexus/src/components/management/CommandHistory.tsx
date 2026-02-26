'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Search, Filter, RefreshCcw, ChevronDown, Clock, Terminal, CheckCircle, XCircle, Loader2, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NeuralSurface } from '../ui/NeuralSurface';
import { cn } from '@/lib/utils';

interface BridgeCommand {
    id: string;
    command: string;
    status: string;
    source: string;
    output: string | null;
    created_at: string;
}

const STATUS_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
    completed: { color: 'text-emerald-400', icon: <CheckCircle size={14} /> },
    done: { color: 'text-emerald-400', icon: <CheckCircle size={14} /> },
    pending: { color: 'text-amber-400', icon: <Loader2 size={14} className="animate-spin" /> },
    failed: { color: 'text-rose-400', icon: <XCircle size={14} /> },
    broadcast: { color: 'text-violet-400', icon: <ArrowUpRight size={14} /> },
};

export function CommandHistory() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const hasSupabase = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder';
    const [commands, setCommands] = useState<BridgeCommand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const pageSize = 25;

    const fetchCommands = useCallback(async () => {
        setIsLoading(true);
        if (!hasSupabase) {
            setCommands([]);
            setIsLoading(false);
            return;
        }
        let query = supabase
            .from('ghost_bridge')
            .select('id, command, status, source, output, created_at')
            .order('created_at', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        if (searchQuery.trim()) {
            query = query.ilike('command', `%${searchQuery.trim()}%`);
        }

        const { data } = await query;
        setCommands(data || []);
        setIsLoading(false);
    }, [page, statusFilter, searchQuery, hasSupabase]);

    useEffect(() => {
        fetchCommands();
    }, [fetchCommands]);

    // Live updates
    useEffect(() => {
        if (!hasSupabase) return;
        const channel = supabase.channel('cmd_history_live')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'ghost_bridge' },
                (payload) => {
                    if (page === 0) {
                        setCommands(prev => [payload.new as BridgeCommand, ...prev.slice(0, pageSize - 1)]);
                    }
                }
            )
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'ghost_bridge' },
                (payload) => {
                    setCommands(prev => prev.map(cmd =>
                        cmd.id === payload.new.id ? { ...cmd, ...payload.new } as BridgeCommand : cmd
                    ));
                }
            ).subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [page, hasSupabase]);

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const now = Date.now();
        const diff = now - d.getTime();
        if (diff < 60000) return 'just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return d.toLocaleDateString();
    };

    const formatSource = (source: string) => {
        return source.split(/[_-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <NeuralSurface variant="glass" className="space-y-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5">
                <div className="flex items-center gap-2">
                    <History className="text-cyan-400" size={18} />
                    <span className="text-[12px] font-black text-cyan-400 uppercase tracking-[0.4em] italic leading-none">Command History</span>
                </div>
                {!hasSupabase && (
                    <span className="text-[9px] font-black tracking-[0.35em] uppercase text-amber-300/80 border border-amber-500/30 bg-amber-500/10 px-3 py-1 rounded-full">
                        OFFLINE
                    </span>
                )}
                <button type="button"
                    onClick={() => { setPage(0); fetchCommands(); }}
                    className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                    title="Refresh"
                >
                    <RefreshCcw size={14} className={cn("text-slate-500", isLoading && "animate-spin")} />
                </button>
            </div>

            {/* Search + Filter Bar */}
            <div className="flex gap-2 px-5">
                <div className="flex-1 relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                        placeholder="Search commands..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/30"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/30 appearance-none cursor-pointer"
                >
                    <option value="all">All</option>
                    <option value="completed">Completed</option>
                    <option value="done">Done</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="broadcast">Broadcast</option>
                </select>
            </div>

            {/* Command List */}
            <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700 min-h-0">
                <AnimatePresence mode="popLayout">
                    {commands.map((cmd) => {
                        const style = STATUS_STYLES[cmd.status] || STATUS_STYLES.pending;
                        const isExpanded = expandedId === cmd.id;

                        return (
                            <motion.div
                                key={cmd.id}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                layout
                            >
                                <button type="button"
                                    onClick={() => setExpandedId(isExpanded ? null : cmd.id)}
                                    className="w-full text-left p-3 rounded-lg hover:bg-white/[0.03] transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={style.color}>{style.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-mono text-white truncate">
                                                    {cmd.command}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-xs text-slate-600">{cmd.source}</span>
                                                <span className="text-xs text-slate-600">•</span>
                                                <span className="text-xs text-slate-500">{formatTime(cmd.created_at)}</span>
                                            </div>
                                        </div>
                                        <ChevronDown
                                            size={12}
                                            className={cn(
                                                "text-slate-600 transition-transform",
                                                isExpanded && "rotate-180"
                                            )}
                                        />
                                    </div>
                                </button>

                                {/* Expanded Output */}
                                <AnimatePresence>
                                    {isExpanded && cmd.output && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mx-3 mb-2 p-3 rounded-lg bg-black/40 border border-white/5">
                                                <div className="flex items-center gap-1 mb-2">
                                                    <Terminal size={10} className="text-slate-500" />
                                                    <span className="text-[9px] text-slate-500 uppercase tracking-wider">Output</span>
                                                </div>
                                                <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">
                                                    {cmd.output.length > 1000 ? cmd.output.slice(0, 1000) + '...' : cmd.output}
                                                </pre>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {commands.length === 0 && !isLoading && (
                    <div className="text-center py-8">
                        <History className="mx-auto text-slate-600 mb-2" size={24} />
                        <p className="text-xs text-slate-500">No commands found</p>
                    </div>
                )}

                {isLoading && (
                    <div className="text-center py-8">
                        <Loader2 className="mx-auto text-cyan-400 animate-spin" size={20} />
                    </div>
                )}
            </div>

            {/* Pagination */}
            {commands.length > 0 && (
                <div className="flex items-center justify-between px-5 pb-4">
                    <button type="button"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="text-[10px] text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-1 rounded border border-white/10"
                    >
                        ← Newer
                    </button>
                    <span className="text-[10px] text-slate-600">Page {page + 1}</span>
                    <button type="button"
                        onClick={() => setPage(p => p + 1)}
                        disabled={commands.length < pageSize}
                        className="text-[10px] text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-1 rounded border border-white/10"
                    >
                        Older →
                    </button>
                </div>
            )}
        </NeuralSurface>
    );
}
