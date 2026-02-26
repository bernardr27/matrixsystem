'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Activity } from 'lucide-react';

interface SystemLog {
    id: string;
    created_at: string;
    event_type: string;
    details: any;
    level: string;
    source: string;
}

export default function LiveSystemLogs({ className }: { className?: string }) {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const hasSupabase = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder';
    const supabase = useMemo(() => createClient(), []);

    const safeFetch = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('system_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            if (data && data.length > 0) setLogs(data);
        } catch (e) {
            console.warn("Supabase Access Failed or No Logs Found", e);
        }
    }, [supabase]);

    useEffect(() => {
        if (!hasSupabase) return;
        safeFetch();

        // Realtime Subscription with Error Handling
        try {
            const channel = supabase
                .channel('system_events_logs')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_events' }, (payload: any) => {
                    setLogs(prev => [payload.new as SystemLog, ...prev].slice(0, 20));
                })
                .subscribe((status: any) => {
                    if (status === 'CHANNEL_ERROR') {
                        console.warn("Realtime subscription failed");
                    }
                });

            return () => {
                supabase.removeChannel(channel);
            };
        } catch (e) {
            console.warn("Realtime Setup Failed", e);
        }
    }, [hasSupabase, supabase, safeFetch]);

    return (
        <div className={`font-mono text-[10px] leading-tight overflow-hidden relative ${className}`}>
            {!hasSupabase && (
                <div className="px-3 py-2 text-[9px] uppercase tracking-[0.35em] text-amber-300/80 border-b border-amber-500/20 bg-amber-500/10">
                    Telemetry Offline — Configure Supabase
                </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
            <div className="h-full overflow-y-auto scrollbar-none flex flex-col-reverse"> {/* Reverse for "terminal" feel (new at bottom? No, usually new at bottom but here standard listing is new at top... let's stick to standard map order but style it) */}
                {logs.length === 0 && (
                    <div className="text-green-900 italic opacity-50 p-2">{'>'} NO_ACTIVE_SIGNALS...</div>
                )}
                {logs.map((log) => (
                    <div key={log.id} className="mb-1 border-b border-green-900/10 pb-0.5 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-green-500/40">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                        <span className={`ml-2 ${getLevelColor(log.level)}`}>{log.event_type.toUpperCase()}</span>
                        <span className="text-green-500/60 ml-2">{'>'} {log.source.toUpperCase()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function getLevelColor(level: string) {
    switch (level?.toLowerCase()) {
        case 'error': return 'text-red-500 font-bold';
        case 'warn': return 'text-yellow-500';
        case 'info': return 'text-blue-400';
        default: return 'text-green-400';
    }
}
