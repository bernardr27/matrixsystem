'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Terminal, Shield, Zap, Activity, Cpu,
    RefreshCcw, Power, Trash2, Code2, Database,
    ChevronRight, AlertOctagon, Monitor
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTelemetry } from '@/components/providers/TelemetryProvider';
import { cn } from '@/lib/utils';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { NeuralButton } from '@/components/ui/NeuralButton';

interface DevSuiteProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DevSuite({ isOpen, onClose }: DevSuiteProps) {
    const { services, refreshTelemetry, isSyncing } = useTelemetry();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const hasSupabase = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder';
    const [activeTab, setActiveTab] = useState<'protocols' | 'metabolic' | 'logs'>('protocols');
    const [terminalOutput, setTerminalOutput] = useState<string[]>(['[SYSTEM] Matrix Hub Dev Suite Initialized...', '[AUTH] Neural Link Verified.']);
    const [isExecuting, setIsExecuting] = useState(false);

    const log = (msg: string) => {
        setTerminalOutput(prev => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const runProtocol = async (cmd: string, label: string) => {
        if (!hasSupabase) {
            log(`FAULT: Telemetry offline. Configure Supabase.`);
            return;
        }
        setIsExecuting(true);
        log(`Executing Protocol: ${label}...`);
        try {
            const { error } = await supabase.from('ghost_bridge').insert({
                command: cmd,
                source: 'nexus_dev_suite',
                status: 'pending'
            });
            if (error) throw error;
            log(`STABLE: ${label} Transmitted.`);
            setTimeout(refreshTelemetry, 500);
        } catch (e: unknown) {
            log(`FAULT: ${(e instanceof Error ? e.message : String(e))}`);
        } finally {
            setIsExecuting(false);
        }
    };

    const clearQueue = async () => {
        if (!hasSupabase) {
            log(`FAULT: Telemetry offline. Configure Supabase.`);
            return;
        }
        setIsExecuting(true);
        log(`PURGE: Clearing Neural Command Queue...`);
        try {
            const { error } = await supabase
                .from('ghost_bridge')
                .update({ status: 'executed', output: 'PROTOCOL_PURGE' })
                .eq('status', 'pending');

            if (error) throw error;
            log(`STABLE: Command Queue Purged.`);
        } catch (e: unknown) {
            log(`FAULT: ${(e instanceof Error ? e.message : String(e))}`);
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-7xl h-[85vh]"
                    >
                        <NeuralSurface className="h-full flex flex-col p-0 overflow-hidden relative" style={{ padding: 0 }}>
                            {/* Holographic Scanning Line */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.5)] z-50 animate-scan pointer-events-none" />

                            {/* Header */}
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.03] backdrop-blur-3xl flex-shrink-0 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                                        <Code2 size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Matrix Hub Dev Suite</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_currentColor]" />
                                            <span className="text-[10px] font-bold text-cyan-500/60 uppercase tracking-widest italic">Aesthetic Operational Override // v5.0</span>
                                        </div>
                                    </div>
                                </div>
                                <button type="button"
                                    onClick={onClose}
                                    className="p-3 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-white border border-white/5 shadow-2xl"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Layout */}
                            <div className="flex flex-1 overflow-hidden min-h-0 flex-col md:flex-row">
                                {/* Navigation Sidebar */}
                                <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-white/5 p-6 space-y-3 bg-black/20 flex flex-col overflow-y-auto">
                                    <NavButton
                                        active={activeTab === 'protocols'}
                                        onClick={() => setActiveTab('protocols')}
                                        icon={<Zap size={18} />}
                                        label="Protocol Deck"
                                    />
                                    <NavButton
                                        active={activeTab === 'metabolic'}
                                        onClick={() => setActiveTab('metabolic')}
                                        icon={<Activity size={18} />}
                                        label="Metabolic Inspector"
                                    />
                                    <NavButton
                                        active={activeTab === 'logs'}
                                        onClick={() => setActiveTab('logs')}
                                        icon={<Terminal size={18} />}
                                        label="System Logs"
                                    />

                                    <div className="mt-auto pt-6 hidden md:block">
                                        <div className="p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Core Load</div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                                                <div className="h-full bg-cyan-500 w-[45%] shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
                                            </div>
                                            <div className="flex justify-between text-[9px] font-bold text-slate-500 tracking-tighter">
                                                <span>STABLE</span>
                                                <span>45% UTIL</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Display Area */}
                                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-black/40">
                                    {activeTab === 'protocols' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <DevActionCard
                                                    title="Neural Force-Rebase"
                                                    desc="Force a global heartbeat sync across all metabolic channels."
                                                    icon={<RefreshCcw size={20} />}
                                                    onClick={() => runProtocol('sys:sync', 'Neural Sync')}
                                                    disabled={isExecuting}
                                                    color="cyan"
                                                />
                                                <DevActionCard
                                                    title="Meta-Ignition Pulse"
                                                    desc="Broadcast a global boot signal to re-ignite all offline infrastructure."
                                                    icon={<Power size={20} />}
                                                    onClick={() => runProtocol('sys:ignite', 'Global Ignition')}
                                                    disabled={isExecuting}
                                                    color="emerald"
                                                />
                                                <DevActionCard
                                                    title="Queue Emergency Purge"
                                                    desc="Flush and expire all pending commands in the neural bridge."
                                                    icon={<Trash2 size={20} />}
                                                    onClick={clearQueue}
                                                    disabled={isExecuting}
                                                    color="amber"
                                                />
                                                <DevActionCard
                                                    title="Total Metabolic Purge"
                                                    desc="EMERGENCY: Terminate all node processes on the host machine."
                                                    icon={<AlertOctagon size={20} />}
                                                    onClick={() => runProtocol('sys:kill_all', 'Total Purge')}
                                                    disabled={isExecuting}
                                                    color="rose"
                                                />
                                            </div>

                                            <NeuralSurface className="p-6 bg-violet-500/5 border-violet-500/10">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Database className="text-violet-400" size={16} />
                                                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest italic">Database Integrity</h3>
                                                </div>
                                                <p className="text-slate-500 text-[10px] leading-relaxed">
                                                    Matrix Hub Bridge leverages Supabase Postgres for command reflection. Use the purge action if commands are &quot;stuck&quot; in a pending loop.
                                                </p>
                                            </NeuralSurface>
                                        </div>
                                    )}

                                    {activeTab === 'metabolic' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-xs font-black text-white uppercase tracking-widest italic">{hasSupabase ? 'Live Telemetry Source' : 'Telemetry Offline'}</h3>
                                                <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500">
                                                    <span>REFRESH: 10s</span>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]", hasSupabase ? "bg-emerald-500 animate-pulse" : "bg-amber-400")}
                                                    />
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-white/5 bg-black/60 p-6 font-mono text-[10px] leading-relaxed overflow-hidden relative">
                                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                                    <Monitor size={100} />
                                                </div>
                                                <pre className="text-cyan-500/90 whitespace-pre-wrap">
                                                    {JSON.stringify({
                                                        services,
                                                        environment: "Production_Unified",
                                                        neural_link: "STABLE",
                                                        gate_uplink: "ACTIVE",
                                                        last_sync: new Date().toISOString()
                                                    }, null, 2)}
                                                </pre>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <StatBlock label="Session ID" value="#NXS_692" />
                                                <StatBlock label="Uplink Latency" value="4ms" color="text-emerald-400" />
                                                <StatBlock label="Neural Drift" value="0.002%" />
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'logs' && (
                                        <div className="space-y-4 h-full flex flex-col animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex-1 bg-black/60 rounded-2xl border border-white/5 p-6 font-mono text-[10px] overflow-y-auto custom-scrollbar flex flex-col gap-2">
                                                {terminalOutput.map((out, idx) => (
                                                    <div key={idx} className="flex gap-4">
                                                        <span className="text-slate-800 select-none font-black">[{idx.toString().padStart(2, '0')}]</span>
                                                        <span className={cn(
                                                            "tracking-tight",
                                                            out.includes('FAULT') ? "text-rose-400" :
                                                                out.includes('STABLE') ? "text-emerald-400" :
                                                                    "text-cyan-500/80"
                                                        )}>{out}</span>
                                                    </div>
                                                ))}
                                                <div className="w-1.5 h-4 bg-cyan-500/40 animate-pulse mt-1" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Overlay Status */}
                            <div className="p-3 bg-white/[0.01] border-t border-white/5 flex justify-center items-center">
                                <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.6em]">End of Transmission // Matrix Hub Operational Suite v1.0</span>
                            </div>
                        </NeuralSurface>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 border",
                active
                    ? "bg-cyan-500/10 border-cyan-500/20 text-white shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                    : "bg-transparent border-transparent text-slate-500 hover:text-white hover:bg-white/5"
            )}
        >
            <div className={cn("transition-colors", active ? "text-cyan-400" : "text-slate-600")}>
                {icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}

function DevActionCard({ title, desc, icon, onClick, disabled, color }: {
    title: string; desc: string; icon: React.ReactNode; onClick: () => void; disabled: boolean; color: string
}) {
    const colorMap: any = {
        cyan: "hover:border-cyan-500/30 hover:bg-cyan-500/5 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.02)]",
        emerald: "hover:border-emerald-500/30 hover:bg-emerald-500/5 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.02)]",
        amber: "hover:border-amber-500/30 hover:bg-amber-500/5 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.02)]",
        rose: "hover:border-rose-500/30 hover:bg-rose-500/5 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.02)]"
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "p-5 rounded-[1.5rem] border border-white/5 bg-white/[0.02] flex items-center gap-5 text-left transition-all duration-500 group relative overflow-hidden",
                disabled ? "opacity-30 cursor-not-allowed grayscale" : colorMap[color]
            )}
        >
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 group-hover:scale-110 transition-all duration-500 shadow-xl relative z-10">
                {icon}
            </div>
            <div className="flex-1 relative z-10">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-white mb-1 leading-none transition-colors">{title}</h4>
                <p className="text-[9px] text-slate-500 font-bold leading-snug tracking-tight">{desc}</p>
            </div>
            <ChevronRight size={14} className="text-slate-800 p-0.5 relative z-10" />

            {/* Minimal Inner Glow */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-1000",
                color === 'cyan' ? "bg-cyan-500" : color === 'emerald' ? "bg-emerald-500" : color === 'amber' ? "bg-amber-500" : "bg-rose-500"
            )} />
        </button>
    );
}

function StatBlock({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
    return (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 text-center group hover:border-white/10 transition-all duration-500">
            <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">{label}</div>
            <div className={cn("text-xs font-black uppercase tracking-tighter leading-none", color)}>{value}</div>
        </div>
    );
}
