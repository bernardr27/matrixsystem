'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Cpu, Globe, Zap, ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSage } from '@/context/SageContext';

export function StatusHeader() {
    const { systemHealth, sageExecuting, ralphExecuting, currentProcess } = useSage();
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const isSystemOnline = systemHealth.online;
    const isBusy = sageExecuting || ralphExecuting;

    return (
        <div className="h-10 border-b border-white/5 bg-black/40 backdrop-blur-2xl flex items-center justify-between px-8 shrink-0 relative z-[55] overflow-hidden">
            {/* AMBIENT HUD ACCENTS */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/10 to-transparent" />

            {/* LEFT: MISSION STATUS */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            isSystemOnline ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-red-500 shadow-[0_0_10px_#ef4444]",
                            isBusy && "animate-pulse"
                        )} />
                        {isBusy && (
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-cyan-400/30 rounded-full"
                            />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className={cn(
                            "text-[9px] font-black uppercase tracking-[0.2em] leading-none",
                            isSystemOnline ? "text-emerald-500/80" : "text-red-500/80"
                        )}>
                            {isBusy ? 'PROCESSING' : isSystemOnline ? 'READY' : 'OFFLINE'}
                        </span>
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={currentProcess || 'IDLE'}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="text-[7px] font-bold text-white/20 uppercase tracking-widest mt-1"
                            >
                                {currentProcess || (isSystemOnline ? 'Uplink Stable' : 'Awaiting Connection')}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                </div>

                {/* ACTIVE PIPES (Visual fluff for "Industrial" feel) */}
                <div className="hidden xl:flex items-center gap-1.5 opacity-20 group cursor-help">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-4 h-[2px] bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ x: [-20, 20] }}
                                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.4 }}
                                className="w-1/2 h-full bg-cyan-500"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: REAL-TIME TELEMETRY */}
            <div className="flex items-center gap-8 h-full">
                <div className="flex items-center gap-6 h-full border-x border-white/5 px-6">
                    <TelemetryItem
                        icon={<Cpu size={11} />}
                        label="PROC"
                        value={systemHealth.cpu || "0%"}
                        active={isSystemOnline}
                        color="cyan"
                    />
                    <TelemetryItem
                        icon={<Activity size={11} />}
                        label="SYNC"
                        value={systemHealth.ram || "0%"}
                        active={isSystemOnline}
                        color="violet"
                    />
                    <TelemetryItem
                        icon={<Globe size={11} />}
                        label="LAT"
                        value={`${systemHealth.networkLatency || 0}MS`}
                        active={isSystemOnline}
                        color="emerald"
                    />
                </div>

                <div className="flex items-center gap-3 pr-2">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-white/90 tracking-tighter leading-none">{currentTime}</span>
                        <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest mt-1">GHOST_NODE_01</span>
                    </div>
                    <div className="w-8 h-8 squircle bg-white/[0.03] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group">
                        <Clock size={14} className="text-white/20 group-hover:text-cyan-400 transition-colors" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function TelemetryItem({ icon, label, value, active, color }: any) {
    const colorMap: any = {
        cyan: "text-cyan-400 bg-cyan-500/5 border-cyan-500/10",
        violet: "text-violet-400 bg-violet-500/5 border-violet-500/10",
        emerald: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10",
    };

    return (
        <div className={cn(
            "flex items-center gap-2.5 h-full opacity-40 transition-all duration-500 group cursor-default",
            active && "opacity-100 hover:scale-105"
        )}>
            <div className={cn(
                "w-6 h-6 squircle flex items-center justify-center border",
                active ? colorMap[color] : "bg-white/5 border-white/5 text-white/20"
            )}>
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em]">{label}</span>
                <span className="text-[10px] font-black text-white/80 tracking-tight">{value}</span>
            </div>
        </div>
    );
}
