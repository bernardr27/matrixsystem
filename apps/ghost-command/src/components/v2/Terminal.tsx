'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TerminalIcon, Shield, AlertTriangle, Cpu } from 'lucide-react';
import { useSage } from '@/context/SageContext';
import { cn } from '@/lib/utils';

// Mock logs for v2 aesthetic demo (would be connected to telemetry)
// Real logs flow through MatrixDevHUD / Sentinel

export function Terminal() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { messages, systemHealth } = useSage();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const hasSupabase = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder';

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="relative group flex flex-col h-[500px] bg-[#0B0E14]/70 backdrop-blur-2xl squircle overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] border border-emerald-500/10">

            {/* CRT OVERLAY EFFECTS */}
            <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] contrast-125 brightness-110 saturate-120 opacity-40 mix-blend-overlay" />
            <div className="absolute inset-0 pointer-events-none z-10 scanline opacity-10" />
            <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]" style={{ backgroundSize: '100% 2px, 3px 100%' }} />

            {/* HEADER */}
            <div className="relative z-30 flex items-center justify-between px-4 py-2 bg-emerald-950/20 border-b border-emerald-500/10 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <TerminalIcon size={12} className="text-emerald-400 opacity-70" />
                    <span className="text-[9px] font-black tracking-[0.2em] text-emerald-400 uppercase drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">System_Terminal</span>
                </div>
                {!hasSupabase && (
                    <span className="text-[8px] font-black tracking-[0.3em] uppercase text-amber-300/80 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        SIMULATED
                    </span>
                )}
                <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                </div>
            </div>

            {/* LOG FEED */}
            <div
                ref={scrollRef}
                className="relative z-30 flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[10px] scrollbar-none"
            >
                <AnimatePresence initial={false}>
                    {messages.map((msg: any, idx: number) => (
                        <motion.div
                            key={msg.id || idx}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.1 }}
                            className="flex items-start gap-4 py-0.5 border-b border-emerald-500/5 last:border-none group/line hover:bg-emerald-500/5 transition-colors"
                        >
                            <span className="text-emerald-700/60 shrink-0 font-mono">{new Date(msg.timestamp || Date.now()).toLocaleTimeString()}</span>
                            <span className={cn(
                                "shrink-0 font-bold",
                                msg.role === 'user' ? 'text-cyan-400' : 'text-emerald-400'
                            )}>
                                [{msg.role === 'user' ? 'CMD' : 'SYS'}]
                            </span>
                            <span className="text-emerald-200/80 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">{msg.content}</span>
                            <span className="ml-auto text-[8px] text-emerald-800 tracking-tighter uppercase opacity-0 group-hover/line:opacity-100 transition-opacity">
                                {msg.role === 'user' ? 'Operator' : 'Ghost_Core'}
                            </span>
                        </motion.div>
                    ))}
                    {/* CURSOR BLINK */}
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-emerald-500">{'>'}</span>
                        <motion.div
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-2 h-4 bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                        />
                    </div>
                </AnimatePresence>
            </div>

            {/* STATUS BAR */}
            <div className="relative z-30 px-4 py-1.5 bg-black border-t border-emerald-500/10 flex items-center justify-between text-[8px] font-mono text-emerald-600/60 uppercase tracking-widest">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                        <Cpu size={10} />
                        MEM: {systemHealth?.ram ?? '—'}%
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Shield size={10} />
                        SECURE
                    </span>
                </div>
                <div className="flex items-center gap-1 text-emerald-500/40">
                    <div className={cn("w-1 h-1 rounded-full", hasSupabase ? "bg-emerald-500" : "bg-amber-400")} />
                    {hasSupabase ? 'CONNECTED' : 'OFFLINE'}
                </div>
            </div>
        </div>
    );
}
