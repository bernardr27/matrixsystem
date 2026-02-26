'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Copy, Trash2, Cpu, Activity, Play, Zap } from 'lucide-react';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { cn } from '@/lib/utils';
import { useSage } from '@/context/SageContext';

interface TerminalInstance {
    id: string;
    label: string;
    type: 'sage' | 'system' | 'net';
    logs: string[];
    active: boolean;
}

export function DebugConsole() {
    const { messages, systemHealth } = useSage();
    const [instances, setInstances] = useState<TerminalInstance[]>([
        { id: 'term-01', label: 'Sage Core', type: 'sage', logs: [], active: true },
        { id: 'term-02', label: 'Sys.Monitor', type: 'system', logs: [], active: true },
        { id: 'term-03', label: 'Net.Uplink', type: 'net', logs: [], active: false },
    ]);
    const [activeInstanceId, setActiveInstanceId] = useState('term-01');
    const [termInput, setTermInput] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Sync Real Data
    useEffect(() => {
        if (!messages.length) return;

        const latest = messages[messages.length - 1];
        const time = mounted ? new Date(latest.timestamp).toLocaleTimeString() : '';
        const content = latest.content.length > 60 ? latest.content.substring(0, 60) + '...' : latest.content;

        setInstances(prev => prev.map(inst => {
            if (inst.type === 'sage') {
                const logEntry = time ? `[${time}] ${latest.role.toUpperCase()}: ${content}` : `[SYSTEM] ${latest.role.toUpperCase()}: ${content}`;
                // Avoid duplicate logs if re-rendering
                if (inst.logs[inst.logs.length - 1] === logEntry) return inst;
                return { ...inst, logs: [...inst.logs.slice(-49), logEntry] };
            }
            return inst;
        }));
    }, [messages]);

    // Sync System Telemetry
    useEffect(() => {
        if (!mounted) return;
        const time = new Date().toLocaleTimeString();
        const sysLog = `[${time}] CPU: ${systemHealth?.cpu || '0%'} | RAM: ${systemHealth?.ram || '0'} | LATENCY: ${systemHealth?.networkLatency || 0}ms`;

        setInstances(prev => prev.map(inst => {
            if (inst.type === 'system') {
                return { ...inst, logs: [...inst.logs.slice(-49), sysLog] };
            }
            if (inst.type === 'net' && systemHealth?.networkLatency > 100) {
                return { ...inst, logs: [...inst.logs.slice(-49), `[${time}] WARN: High Latency detected (${systemHealth.networkLatency}ms)`] };
            }
            return inst;
        }));
    }, [systemHealth]);

    const activeTerminal = instances.find(i => i.id === activeInstanceId);

    if (!mounted) return null;

    return (
        <div className="flex flex-col h-full bg-[#0B0E14] p-6 text-xs font-mono relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* CONTROL BAR */}
            <div className="flex items-center justify-between mb-6 z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.3)] backdrop-blur-md">
                        <Terminal size={24} className="text-green-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-widest text-white uppercase">Terminal Array</h1>
                        <p className="text-[10px] text-green-500/60 uppercase tracking-[0.2em]">System Diagnostics</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {instances.map(inst => (
                        <button type="button"
                            key={inst.id}
                            onClick={() => setActiveInstanceId(inst.id)}
                            className={cn(
                                "px-3 py-1.5 rounded-full border text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-2",
                                activeInstanceId === inst.id
                                    ? "bg-green-500/20 border-green-500/50 text-green-300"
                                    : "bg-black/40 border-white/10 text-white/40 hover:text-white"
                            )}
                        >
                            <span className={cn("w-1.5 h-1.5 rounded-full", inst.active ? "bg-green-500 animate-pulse" : "bg-white/20")} />
                            {inst.label}
                        </button>
                    ))}
                    <button type="button"
                        onClick={() => setInstances(prev => [...prev, { id: `term-${Date.now()}`, label: 'New Term', type: 'system', logs: [], active: true }])}
                        className="p-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 ml-2 shadow-sm backdrop-blur-sm"
                    >
                        <Zap size={14} />
                    </button>
                </div>
            </div>

            {/* TERMINAL WINDOW */}
            <NeuralSurface className="flex-1 bg-[#0B0E14]/70 backdrop-blur-2xl border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)] overflow-hidden flex flex-col relative z-20 squircle">
                {activeTerminal && (
                    <>
                        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <Terminal size={14} className="text-green-500/60" />
                                <span className="text-xs text-green-400 font-bold uppercase tracking-wider">{activeTerminal.label}</span>
                                <span className="text-[10px] text-white/30">{activeTerminal.id}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/30" />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar font-mono text-green-100/80">
                            {activeTerminal.logs.length === 0 && (
                                <div className="opacity-30 flex flex-col items-center justify-center h-full">
                                    <Activity size={48} className="mb-4 text-green-500" />
                                    <p>NO ACTIVE DATA STREAM</p>
                                </div>
                            )}
                            {activeTerminal.logs.map((log, i) => (
                                <div key={i} className="hover:bg-white/5 px-2 py-0.5 rounded -mx-2 transition-colors break-all">
                                    <span className="text-green-500/50 mr-3">{i}</span>
                                    {log}
                                </div>
                            ))}
                            {/* Blinking Cursor */}
                            <div className="px-2 py-0.5 animate-pulse text-green-500">_</div>
                        </div>

                        <div className="p-3 border-t border-white/5 bg-black/40 flex items-center gap-2">
                            <span className="text-green-500 font-bold">$</span>
                            <input
                                type="text"
                                value={termInput}
                                onChange={(e) => setTermInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && termInput.trim()) {
                                        const time = new Date().toLocaleTimeString();
                                        const entry = `[${time}] CMD: ${termInput}`;
                                        setInstances(prev => prev.map(inst =>
                                            inst.id === activeInstanceId
                                                ? { ...inst, logs: [...inst.logs.slice(-49), entry] }
                                                : inst
                                        ));
                                        setTermInput('');
                                    }
                                }}
                                placeholder="Execute command..."
                                className="bg-transparent border-none outline-none text-green-300 w-full placeholder:text-green-500/20"
                            />
                        </div>
                    </>
                )}
            </NeuralSurface>
        </div>
    );
}
