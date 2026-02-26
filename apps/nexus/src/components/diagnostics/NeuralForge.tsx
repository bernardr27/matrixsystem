'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Sparkles, Code, Cpu, ChevronRight, X, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export function NeuralForge() {
    const [specification, setSpecification] = useState('');
    const [componentName, setComponentName] = useState('');
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup poll on unmount
    React.useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    const synthesize = async () => {
        if (!specification || !componentName) return;

        setIsSynthesizing(true);
        setStatus('Initializing Neural Forge...');
        setLogs(prev => [...prev, `[FORGE] Initiating synthesis for ${componentName}...`]);

        try {
            const { data, error } = await supabase.from('ghost_bridge').insert({
                command: `sage:component ${componentName} | ${specification}`,
                source: 'nexus_neural_forge',
                status: 'pending'
            }).select().single();

            if (error) throw error;

            // Poll for completion (max 60 retries = 2 minutes)
            let retries = 0;
            if (pollRef.current) clearInterval(pollRef.current);
            const checkStatus = setInterval(async () => {
                retries++;
                if (retries > 60) {
                    clearInterval(checkStatus);
                    pollRef.current = null;
                    setIsSynthesizing(false);
                    setStatus('Synthesis Timed Out');
                    setLogs(prev => [...prev, '[TIMEOUT] No response after 2 minutes.']);
                    return;
                }

                const { data: cmd } = await supabase
                    .from('ghost_bridge')
                    .select('status, output')
                    .eq('id', data.id)
                    .single();

                if (cmd?.status === 'executed') {
                    clearInterval(checkStatus);
                    pollRef.current = null;
                    setIsSynthesizing(false);
                    setStatus('Synthesis Complete');
                    setLogs(prev => [...prev, `[SUCCESS] ${cmd.output}`]);
                    setSpecification('');
                    setComponentName('');
                } else if (cmd?.status === 'failed') {
                    clearInterval(checkStatus);
                    pollRef.current = null;
                    setIsSynthesizing(false);
                    setStatus('Synthesis Failed');
                    setLogs(prev => [...prev, `[ERROR] ${cmd.output}`]);
                }
            }, 2000);
            pollRef.current = checkStatus;

        } catch (err: unknown) {
            setIsSynthesizing(false);
            setStatus('Hardware Error');
            setLogs(prev => [...prev, `[CRITICAL] ${(err instanceof Error ? err.message : String(err))}`]);
        }
    };

    return (
        <div className="glass-card overflow-hidden flex flex-col h-[500px]">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
                        <Hammer size={18} />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-white">Neural Forge</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Architectural Evolution Interface</p>
                    </div>
                </div>
                {isSynthesizing && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="text-orange-500/50"
                    >
                        <Cpu size={16} />
                    </motion.div>
                )}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Input Area */}
                <div className="w-1/2 p-6 border-r border-white/5 flex flex-col gap-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider ml-1">Component Name</label>
                            <input
                                value={componentName}
                                onChange={e => setComponentName(e.target.value)}
                                placeholder="e.g. MemoryMonitor"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white placeholder:text-slate-700 focus:border-orange-500/50 outline-none transition-all font-mono"
                                disabled={isSynthesizing}
                            />
                        </div>

                        <div className="space-y-1.5 flex-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider ml-1">Specification</label>
                            <textarea
                                value={specification}
                                onChange={e => setSpecification(e.target.value)}
                                placeholder="Describe the UI module, its purpose, and behavior..."
                                className="w-full h-40 bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder:text-slate-700 focus:border-orange-500/50 outline-none transition-all resize-none custom-scrollbar"
                                disabled={isSynthesizing}
                            />
                        </div>
                    </div>

                    <button type="button"
                        onClick={synthesize}
                        disabled={isSynthesizing || !specification || !componentName}
                        className={cn(
                            "group relative w-full py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all overflow-hidden",
                            isSynthesizing
                                ? "bg-orange-500/10 text-orange-500/50 cursor-not-allowed"
                                : "bg-orange-500 text-black hover:bg-orange-400 active:scale-[0.98]"
                        )}
                    >
                        <div className="relative z-10 flex items-center justify-center gap-2">
                            {isSynthesizing ? (
                                <>
                                    <Sparkles size={14} className="animate-pulse" />
                                    Synthesizing...
                                </>
                            ) : (
                                <>
                                    Ignite the Forge
                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </div>
                        {!isSynthesizing && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
                        )}
                    </button>
                </div>

                {/* Right: Diagnostic Logs */}
                <div className="w-1/2 flex flex-col bg-black/40">
                    <div className="p-3 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Synthesis Output</span>
                        {status && (
                            <span className={cn(
                                "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                                status.includes('Failed') ? "text-rose-400 bg-rose-500/10" : "text-orange-400 bg-orange-500/10"
                            )}>
                                {status}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 p-4 font-mono text-[9px] overflow-y-auto custom-scrollbar space-y-2">
                        {logs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20">
                                <Code size={24} className="mb-2" />
                                <p>Forge on standby</p>
                            </div>
                        ) : (
                            logs.map((log, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={i}
                                    className={cn(
                                        "leading-relaxed",
                                        log.includes('[SUCCESS]') ? "text-emerald-400" :
                                            log.includes('[ERROR]') ? "text-rose-400" :
                                                log.includes('[FORGE]') ? "text-orange-400" : "text-slate-400"
                                    )}
                                >
                                    {log}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
