'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X, ChevronDown, ChevronUp, ScrollText, RefreshCw, Terminal } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils'; // Assuming cn exists, else remove

interface LogEntry {
    id: string;
    command: string;
    status: string;
    created_at: string;
    output?: string;
    source?: string;
}

export const NeuralLog: React.FC = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const hasSupabase = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder';
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        if (!hasSupabase) {
            setLogs([]);
            setLoading(false);
            return;
        }
        const { data } = await supabase
            .from('ghost_bridge')
            .select('*')
            .neq('command', 'sys:heartbeat')
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) setLogs(data);
        setLoading(false);
    }, [hasSupabase]);

    useEffect(() => {
        if (isOpen) fetchLogs();
    }, [isOpen, fetchLogs]);

    return (
        <div className="relative flex flex-col w-full bg-[#050505] border border-white/10 rounded-sm overflow-hidden shadow-xl font-mono text-xs z-10 group">

            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 select-none cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] text-purple-400/80">
                    <Terminal size={12} />
                    <span>SYSTEM_EVENT_STREAM</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-white/30 uppercase">{hasSupabase ? 'LIVE_FEED' : 'OFFLINE'}</span>
                    <div className={cn("w-1.5 h-1.5 rounded-full", hasSupabase ? "bg-emerald-500 animate-pulse" : "bg-amber-400")} />
                    {isOpen ? <ChevronUp size={14} className="text-white/40" /> : <ChevronDown size={14} className="text-white/40" />}
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 300, opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        {/* Log Stream */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide font-mono h-full bg-[#050505]">
                            {logs.length === 0 && (
                                <div className="flex flex-col items-center justify-center opacity-20 h-full text-white">
                                    <Activity size={24} className="mb-2" />
                                    <span>NO_TELEMETRY</span>
                                </div>
                            )}

                            {logs.map((log) => (
                                <div key={log.id} className="flex gap-3 text-[10px] border-l border-white/10 pl-2 hover:bg-white/5 transition-colors group/item">
                                    <span className="text-white/30 whitespace-nowrap min-w-[60px]">
                                        {new Date(log.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                    <div className="flex flex-col gap-0.5 w-full">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "font-bold uppercase tracking-wider",
                                                log.status === 'executed' ? "text-emerald-500" :
                                                    log.status === 'pending' ? "text-cyan-500" :
                                                        log.status === 'failed' ? "text-red-500" : "text-white/50"
                                            )}>
                                                [{log.command}]
                                            </span>
                                            {log.source && <span className="text-white/20">via {log.source}</span>}
                                        </div>
                                        {log.output && (
                                            <span className="text-white/50 truncate max-w-[280px] group-hover/item:text-white/80 transition-colors">
                                                {log.output.replace(/["{}]/g, '')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Gradient */}
                        <div className="absolute bottom-0 w-full h-4 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};
