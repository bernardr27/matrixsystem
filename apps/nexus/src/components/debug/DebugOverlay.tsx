'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, RefreshCw, Database, Trash2, X, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTelemetry } from '@/components/providers/TelemetryProvider';
import { cn } from '@/lib/utils';

export function DebugOverlay() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [health, setHealth] = useState<Array<{ name: string; ok: boolean; status: number | null }>>([]);
    const { refreshTelemetry } = useTelemetry();

    const runAction = async (action: string, label: string) => {
        setIsLoading(true);
        setStatus(`Running: ${label}...`);
        try {
            if (action === 'scan') {
                await refreshTelemetry();
                setStatus('Telemetry Scan Complete');
            } else if (action === 'cert_scan') {
                const host = window.location.hostname;
                const probes = [
                    { name: 'reflect', url: process.env.NEXT_PUBLIC_REFLECT_URL ? `${process.env.NEXT_PUBLIC_REFLECT_URL}/api/health` : `http://${host}:3000/api/health` },
                    { name: 'nexus', url: process.env.NEXT_PUBLIC_NEXUS_URL ? `${process.env.NEXT_PUBLIC_NEXUS_URL}/api/health` : `http://${host}:3001/api/health` },
                    { name: 'ghost', url: process.env.NEXT_PUBLIC_GHOST_URL ? `${process.env.NEXT_PUBLIC_GHOST_URL}/api/health` : `http://${host}:5173/api/health` },
                    { name: 'citadel', url: process.env.NEXT_PUBLIC_CITADEL_URL ? `${process.env.NEXT_PUBLIC_CITADEL_URL}/api/health` : `http://${host}:3005/api/health` },
                    { name: 'rocket', url: process.env.NEXT_PUBLIC_ROCKET_URL ? `${process.env.NEXT_PUBLIC_ROCKET_URL}/api/health` : `http://${host}:4000/api/health` }
                ];
                const results = await Promise.all(probes.map(async (p) => {
                    try {
                        const res = await fetch(p.url);
                        return { name: p.name, ok: res.ok, status: res.status };
                    } catch {
                        return { name: p.name, ok: false, status: null };
                    }
                }));
                setHealth(results);
                const up = results.filter((r) => r.ok).length;
                setStatus(`Certification Scan: ${up}/${results.length} healthy`);
            } else if (action === 'insert_test') {
                await supabase.from('matrix_diagnostics').insert({
                    app: 'manual_debug',
                    category: 'performance',
                    severity: 'warning',
                    action: 'Manual Test Injection',
                    duration: Math.floor(Math.random() * 500)
                });
                setStatus('Test Data Injected');
            } else if (action === 'flush') {
                // Actually triggering a soft reset in component state if we could, but for now just log
                setStatus('System Flushed (Simulated)');
            }
        } catch (e: unknown) {
            setStatus(`Error: ${(e instanceof Error ? e.message : String(e))}`);
        } finally {
            setIsLoading(false);
            setTimeout(() => setStatus(''), 3000);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-12 right-0 mb-2 glass-card p-4 w-64 border border-white/10 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase text-white tracking-widest">System Debugger</h3>
                            <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={14} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => runAction('scan', 'Scan Connectivity')}
                                className="w-full flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left group"
                            >
                                <RefreshCw size={14} className={cn("text-cyan-400", isLoading && "animate-spin")} />
                                <span className="text-[10px] font-bold text-slate-300 group-hover:text-white uppercase">Scan Connectivity</span>
                            </button>

                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => runAction('cert_scan', 'Certification Scan')}
                                className="w-full flex items-center gap-3 p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 transition-all text-left group border border-cyan-500/20"
                            >
                                <RefreshCw size={14} className={cn("text-cyan-300", isLoading && "animate-spin")} />
                                <span className="text-[10px] font-bold text-cyan-200 group-hover:text-white uppercase">Certification Scan</span>
                            </button>

                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => runAction('insert_test', 'Inject Test Data')}
                                className="w-full flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left group"
                            >
                                <Database size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-bold text-slate-300 group-hover:text-white uppercase">Inject Test Data</span>
                            </button>

                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => runAction('flush', 'Flush Cache')}
                                className="w-full flex items-center gap-3 p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 transition-all text-left group border border-rose-500/20"
                            >
                                <Trash2 size={14} className="text-rose-400" />
                                <span className="text-[10px] font-bold text-rose-300 group-hover:text-slate-200 uppercase">Flush Cache</span>
                            </button>

                            <div className="h-px bg-white/10 my-2" />

                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={async () => {
                                    await supabase.from('ghost_bridge').insert({ command: 'sys:ignite', source: 'debug_overlay', status: 'pending' });
                                    runAction('ignite', 'System Ignition');
                                }}
                                className="w-full flex items-center gap-3 p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-all text-left group border border-emerald-500/20"
                            >
                                <Zap size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-bold text-emerald-300 group-hover:text-white uppercase">IGNITE ALL</span>
                            </button>

                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={async () => {
                                    if (confirm('WARNING: This will kill all services including this dashboard. Continue?')) {
                                        await supabase.from('ghost_bridge').insert({ command: 'sys:kill_all', source: 'debug_overlay', status: 'pending' });
                                        runAction('kill', 'System Purge');
                                    }
                                }}
                                className="w-full flex items-center gap-3 p-2 rounded-lg bg-red-900/20 hover:bg-red-900/40 transition-all text-left group border border-red-900/40"
                            >
                                <X size={14} className="text-red-500" />
                                <span className="text-[10px] font-bold text-red-500 group-hover:text-red-400 uppercase">KILL SYSTEM</span>
                            </button>
                        </div>

                        {health.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                                {health.map((h) => (
                                    <div key={h.name} className="flex items-center justify-between text-[9px] font-mono">
                                        <span className="text-slate-400 uppercase">{h.name}</span>
                                        <span className={cn(h.ok ? 'text-emerald-400' : 'text-rose-400')}>
                                            {h.ok ? `OK ${h.status ?? ''}`.trim() : 'DOWN'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {status && (
                            <div className="mt-3 pt-3 border-t border-white/5 text-[9px] font-mono text-center text-slate-400 animate-pulse">
                                {status}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "p-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95",
                    isOpen ? "bg-white text-black" : "bg-black/80 text-white border border-white/20 backdrop-blur-md"
                )}
            >
                <Bug size={18} />
            </button>
        </div>
    );
}
