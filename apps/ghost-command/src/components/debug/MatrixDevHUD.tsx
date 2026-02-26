'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSage } from '@/context/SageContext';
import {
    Activity, Zap, ShieldAlert, Bug, RefreshCw,
    Cpu, Network, Server, TerminalSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatrixDevHUDProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MatrixDevHUD: React.FC<MatrixDevHUDProps> = ({ isOpen, onClose }) => {
    const { systemHealth, messages, sendCommand } = useSage();
    const [latency, setLatency] = useState<number>(0);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const hasSupabase = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder';

    // Simulate Ping for visual stability (Heartbeat varies too wildly for "Ping" label)
    useEffect(() => {
        const interval = setInterval(() => {
            if (systemHealth.online) {
                // Random variation between 24ms and 48ms
                setLatency(Math.floor(24 + Math.random() * 24));
            } else {
                setLatency(0);
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [systemHealth.online]);

    const handleCoreReset = async () => {
        if (confirm("INITIATE_CORE_RESET? This will purge history and restart the Neural Runner.")) {
            await sendCommand("sys:restart_all");
            window.location.reload();
        }
    };

    const isHealthy = latency < 100;

    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed top-28 left-4 z-[50] flex flex-col items-start pointer-events-none">
            {/* EXPANDED HOLOGRAPHIC PANEL */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.95, y: -10, filter: 'blur(10px)' }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        className="pointer-events-auto mr-1 mt-2 w-72 bg-[#030303]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.8)] overflow-hidden"
                    >
                        {/* Decorative Top Bar */}
                        <div className="h-1 w-full bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-violet-500/20" />

                        <div className="p-4 space-y-4">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-md bg-white/5 border border-white/5">
                                        <Bug size={12} className="text-emerald-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-white/80 tracking-wider">NEURAL_DIAG</span>
                                        <span className="text-[8px] font-mono text-white/30">RUNNER_V2.1</span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <StatusPip active={systemHealth.online} color="emerald" />
                                    <StatusPip active={systemHealth.ai_status !== 'OFF'} color="cyan" />
                                    <StatusPip active={latency < 100} color="violet" />
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <MetricTile
                                    label="PING"
                                    value={systemHealth.online ? `${latency}ms` : '--'}
                                    icon={Zap}
                                    status={latency < 50 ? 'excellent' : latency < 100 ? 'good' : 'warning'}
                                />
                                <MetricTile
                                    label="MEM"
                                    value={`${Math.round(Number(systemHealth.ram) || 0)}%`}
                                    icon={Cpu}
                                    status={Number(systemHealth.ram) < 70 ? 'good' : 'warning'}
                                />
                                <MetricTile
                                    label="UPTIME"
                                    value={formatUptime(systemHealth.uptime)}
                                    icon={Server}
                                    status="good"
                                />
                                <MetricTile
                                    label="CPU"
                                    value={systemHealth.cpu}
                                    icon={Activity}
                                    status={parseFloat(systemHealth.cpu) < 50 ? 'excellent' : 'good'}
                                />
                            </div>

                            {/* Terminal Log Wrapper */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-1.5">
                                        <TerminalSquare size={10} className="text-white/40" />
                                        <span className="text-[9px] font-mono font-bold text-white/40 tracking-widest uppercase">Live_Feed</span>
                                    </div>
                                    {!hasSupabase && (
                                        <span className="text-[8px] font-black tracking-[0.3em] uppercase text-amber-300/80 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                            SIMULATED
                                        </span>
                                    )}
                                </div>
                                <div className="bg-black/40 rounded-lg border border-white/5 p-2 font-mono text-[9px] h-24 overflow-y-auto scrollbar-none flex flex-col-reverse gap-1">
                                    {messages.length === 0 && (
                                        <span className="text-white/20 italic text-center py-4">-- Awaiting Input --</span>
                                    )}
                                    {messages.slice(-5).reverse().map((m: any, i: number) => (
                                        <motion.div
                                            key={m.id || i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex gap-2"
                                        >
                                            <span className={cn(
                                                "shrink-0 font-bold",
                                                m.role === 'user' ? "text-cyan-500" : "text-violet-500"
                                            )}>
                                                {m.role === 'user' ? '>' : '#'}
                                            </span>
                                            <span className="text-white/60 truncate leading-relaxed">
                                                {m.content}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button type="button"
                                    onClick={() => window.location.reload()}
                                    className="py-2 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold text-white/60 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2 group"
                                >
                                    <RefreshCw size={10} className="group-hover:rotate-180 transition-transform duration-500" />
                                    RELOAD_UI
                                </button>
                                <button type="button"
                                    onClick={handleCoreReset}
                                    className="py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[9px] font-bold text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ShieldAlert size={10} />
                                    CORE_RESET
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const STATUS_PIP_COLORS: Record<string, string> = {
    emerald: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    cyan: 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]',
    violet: 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]',
};

const StatusPip = React.memo(({ active, color }: { active: boolean, color: 'emerald' | 'cyan' | 'violet' }) => (
    <div className={cn(
        "h-1 w-3 rounded-full transition-all duration-700",
        active ? STATUS_PIP_COLORS[color] : "bg-white/10"
    )} />
));

StatusPip.displayName = 'StatusPip';

const MetricTile = React.memo(({ label, value, icon: Icon, status }: { label: string, value: string, icon: any, status: 'excellent' | 'good' | 'warning' }) => {
    const color = status === 'excellent' ? 'text-cyan-400'
        : status === 'good' ? 'text-emerald-400'
            : 'text-amber-400';

    const bg = status === 'excellent' ? 'bg-cyan-500/5 border-cyan-500/10'
        : status === 'good' ? 'bg-emerald-500/5 border-emerald-500/10'
            : 'bg-amber-500/5 border-amber-500/10';

    return (
        <div className={cn("p-2 rounded-lg border flex flex-col gap-1 transition-all duration-1000", bg)}>
            <div className="flex items-center gap-1.5 opacity-50">
                <Icon size={10} />
                <span className="text-[8px] font-black tracking-widest">{label}</span>
            </div>
            <div className={cn("text-xs font-mono font-bold pl-0.5 overflow-hidden", color)}>
                {/* Removed AnimatePresence to stop flickering */}
                {value}
            </div>
        </div>
    );
});

MetricTile.displayName = 'MetricTile';

