"use client";

import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../providers/TelemetryProvider';
import { Activity, Cpu, Database, Server, Terminal, ShieldAlert, Zap, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const ProcessEntry = React.memo(({ name, data }: { name: string, data: any }) => (
    <div className="flex items-center justify-between py-2 group/proc border-b border-white/[0.02] last:border-0">
        <div className="flex items-center gap-3">
            <div className={cn(
                "w-1 h-3 rounded-full transition-colors duration-500",
                data === 'online' ? "bg-cyan-500" : "bg-rose-500"
            )} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover/proc:text-white/70 transition-colors italic">{name}</span>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-[8px] font-mono text-white/10 uppercase tracking-widest group-hover/proc:text-white/20">PID_AUTO</span>
            <div className="w-[70px] text-right">
                <AnimatePresence mode="wait">
                    <motion.span
                        key={String(data)}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                            "text-[10px] font-black uppercase tracking-widest inline-block px-1.5 py-0.5 rounded-sm",
                            data === 'online' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-rose-500/10 text-rose-500'
                        )}
                    >
                        {String(data)}
                    </motion.span>
                </AnimatePresence>
            </div>
        </div>
    </div>
));

ProcessEntry.displayName = 'ProcessEntry';

const LogItem = React.memo(({ log }: { log: any }) => (
    <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-[9px] font-mono flex gap-3 py-1 border-l border-white/5 pl-2 group/log hover:border-cyan-500/30 transition-colors"
    >
        <span className="text-white/10 group-hover/log:text-white/30 transition-colors">[{log.time}]</span>
        <span className={cn(
            "transition-colors",
            log.type === 'success' ? 'text-cyan-400/60' : 'text-amber-400/60'
        )}>
            {log.msg}_
        </span>
    </motion.div>
));

LogItem.displayName = 'LogItem';

export const DevHud = () => {
    const { services, broadcasts } = useTelemetry();
    const [isVisible, setIsVisible] = useState(false);
    const [logs, setLogs] = useState<{ msg: string, type: string, time: string }[]>([]);

    useEffect(() => {
        if (broadcasts.length === 0) {
            setLogs([{ msg: 'Awaiting_Neural_Stream', type: 'info', time: '--:--:--' }]);
            return;
        }

        const newLogs = broadcasts.map(b => ({
            msg: b.message,
            type: b.message.toLowerCase().includes('error') || b.message.toLowerCase().includes('fail') ? 'warning' : 'success',
            time: new Date(b.timestamp).toLocaleTimeString([], { hour12: false })
        }));
        setLogs(newLogs.reverse().slice(0, 50));
    }, [broadcasts]);

    return (
        <div className="space-y-6">
            <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-black/40 border border-white/5 group-hover:border-cyan-500/30 transition-colors">
                        <Database className={cn("w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors", isVisible && "text-cyan-400")} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 group-hover:text-white transition-colors">Infrastructure_Shield</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", isVisible ? "bg-cyan-500" : "bg-white/10")} />
                    <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{isVisible ? 'SECURED' : 'LOCKED'}</span>
                </div>
            </button>

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-6"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
                            {/* Process registry Module */}
                            <div className="module-card p-6 flex flex-col gap-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Radio size={40} className="text-cyan-500" />
                                </div>
                                <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-2 flex items-center gap-3">
                                    <Server size={10} className="text-cyan-500/50" />
                                    Process_Registry_Prime
                                </h3>
                                <div className="space-y-1">
                                    {Object.entries(services).map(([name, data]) => (
                                        <ProcessEntry key={name} name={name} data={data} />
                                    ))}
                                </div>
                            </div>

                            {/* Telemetry Module */}
                            <div className="module-card p-6 flex flex-col gap-4 overflow-hidden relative">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-2 flex items-center gap-3">
                                    <Terminal size={10} className="text-cyan-500/50" />
                                    Live_Telemetry_Stream
                                </h3>
                                <div className="flex-1 overflow-y-auto space-y-px max-h-[160px] custom-scrollbar pr-2">
                                    {logs.map((log, i) => (
                                        <LogItem key={i} log={log} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Shield Integrity HUD */}
                        <div className="module-card p-6 flex items-center justify-between border-l-4 border-l-cyan-500/40 relative overflow-hidden">
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-cyan-500/10" />
                            <motion.div
                                className="absolute inset-y-0 left-0 w-1 bg-cyan-400"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />

                            <div className="flex items-center gap-8 relative z-10">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[9px] font-black uppercase text-slate-600 tracking-[0.3em] leading-none mb-1">Shield_Integrity</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black italic tracking-tighter text-cyan-400">NOMINAL_v4</span>
                                        <Zap size={10} className="text-cyan-500/50 animate-pulse" />
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-white/5" />
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[9px] font-black uppercase text-slate-600 tracking-[0.3em] leading-none mb-1">Auto_Healing</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black italic tracking-tighter text-white opacity-80">ACTIVE_MODE</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 group hover:scale-110 transition-transform cursor-pointer">
                                <ShieldAlert size={24} className="text-cyan-400 group-hover:text-white transition-colors" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
