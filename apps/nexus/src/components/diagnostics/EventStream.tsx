'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Zap, AlertTriangle, Info, ShieldCheck, Server, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NeuralSurface } from '../ui/NeuralSurface';
import { cn } from '@/lib/utils';

interface SystemEvent {
    id: number;
    timestamp: string;
    source: string;
    event_type: string;
    message: string;
    severity: string;
    metadata?: any;
}

const SEVERITY_STYLES: Record<string, { dot: string; text: string; icon: React.ReactNode }> = {
    info: { dot: 'bg-cyan-400', text: 'text-cyan-400', icon: <Info size={12} /> },
    warning: { dot: 'bg-amber-400', text: 'text-amber-400', icon: <AlertTriangle size={12} /> },
    error: { dot: 'bg-rose-400', text: 'text-rose-400', icon: <Zap size={12} /> },
    critical: { dot: 'bg-red-500', text: 'text-red-400', icon: <Zap size={12} /> },
};

export function EventStream() {
    const [events, setEvents] = useState<SystemEvent[]>([]);
    const [isLive, setIsLive] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch recent events + bridge activity in parallel
        const fetchAll = async () => {
            const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

            const [eventsResult, bridgeResult] = await Promise.all([
                supabase
                    .from('system_events')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(50),
                supabase
                    .from('ghost_bridge')
                    .select('id, command, status, source, created_at')
                    .gte('created_at', tenMinAgo)
                    .order('created_at', { ascending: false })
                    .limit(20)
            ]);

            const sysEvents = eventsResult.data ? eventsResult.data.reverse() : [];
            const bridgeEvents: SystemEvent[] = (bridgeResult.data || []).map((b: any) => ({
                id: parseInt(b.id?.replace(/\D/g, '') || '0') || Math.floor(Math.random() * 1000000),
                timestamp: b.created_at,
                source: b.source || 'ghost_bridge',
                event_type: 'command',
                message: `${b.command} [${b.status}]`,
                severity: b.status === 'failed' ? 'error' : 'info'
            }));

            // Merge and sort once
            const merged = [...bridgeEvents, ...sysEvents].sort((a, b) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            ).slice(-50);
            setEvents(merged);
        };

        fetchAll();

        // Live subscription
        const channel = supabase.channel('event_stream_live')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'system_events' },
                (payload) => {
                    const evt = payload.new as SystemEvent;
                    setEvents(prev => [...prev.slice(-49), evt]);
                }
            ).subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current && isLive) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [events, isLive]);

    const displayEvents = expanded ? events : events.slice(-8);

    return (
        <NeuralSurface variant="neumorphic" className="h-full flex flex-col overflow-hidden border-none p-0 bg-black/40">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Radio size={16} className="text-cyan-400" />
                        <div className="absolute inset-0 bg-cyan-400 blur-sm opacity-40 animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Event_Stream</span>
                        <span className="text-[7px] font-mono text-cyan-400/60 uppercase">Realtime_Signal_Intercept</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[7px] font-bold text-cyan-400 tracking-widest uppercase">
                        {events.length} NODES
                    </div>
                    <button type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="p-1 hover:bg-white/5 rounded-lg transition-colors border border-white/10"
                    >
                        <ChevronDown
                            size={12}
                            className={cn(
                                "text-slate-400 transition-transform duration-500",
                                expanded && "rotate-180"
                            )}
                        />
                    </button>
                </div>
            </div>

            {/* Event List */}
            <div
                ref={scrollRef}
                className={cn(
                    "flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20",
                    expanded ? "max-h-[500px]" : "max-h-[300px]"
                )}
            >
                <div className="flex flex-col gap-3 relative">
                    {/* Visual Connection Wire */}
                    <div className="absolute left-[13px] top-4 bottom-4 w-[1px] bg-gradient-to-b from-cyan-500/20 via-transparent to-transparent" />

                    <AnimatePresence mode="popLayout">
                        {displayEvents.map((evt, index) => {
                            const style = SEVERITY_STYLES[evt.severity] || SEVERITY_STYLES.info;
                            const time = new Date(evt.timestamp).toLocaleTimeString('en-US', {
                                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                            });

                            return (
                                <motion.div
                                    key={`evt-${evt.id}-${evt.timestamp}-${index}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-start gap-4 group/event"
                                >
                                    {/* Event Node */}
                                    <div className="mt-1 relative shrink-0">
                                        <div className={cn("w-2 h-2 rounded-full relative z-10", style.dot)} />
                                        <div className={cn("absolute inset-0 rounded-full blur-sm opacity-0 group-hover/event:opacity-100 transition-opacity", style.dot)} />
                                    </div>

                                    {/* Event Content (Nova Card Style) */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className={cn("text-[9px] font-black uppercase tracking-widest", style.text)}>
                                                    {evt.source}
                                                </span>
                                                <span className="text-[8px] font-mono text-white/10">[{time}]</span>
                                            </div>
                                            <span className="text-[7px] font-mono text-white/5 uppercase select-none">
                                                {evt.event_type}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-relaxed font-light break-words">
                                            {evt.message}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {events.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20 filter grayscale">
                        <Server className="animate-pulse mb-4" size={24} />
                        <span className="text-[10px] font-black tracking-[0.5em] uppercase">No_Signal_Intercepted</span>
                    </div>
                )}
            </div>
        </NeuralSurface>
    );
}
