'use client';

import React, { ErrorInfo } from 'react';
import { supabase, GHOST_BRIDGE_TABLE } from '@/lib/supabase';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalNeuralErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Neural Reflex: Auto-reporting error...", error);
        this.reportFault(error, errorInfo);
    }

    private async reportFault(error: Error, info: ErrorInfo) {
        try {
            // 0. Trigger Matrix Capture (Visual Evidence)
            fetch('/api/debug/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target: 'ghost_triage' }) // Self-capture
            }).catch(console.error);

            // 1. Alert Ghost Runner (Immediate Reaction)
            const faultPayload = {
                command: `[NEURAL_REFLEX] EXOGENOUS FAULT: ${error.message}`,
                status: 'alert',
                output: JSON.stringify({
                    stack: error.stack?.substring(0, 500),
                    componentStack: info.componentStack?.substring(0, 500),
                    timestamp: new Date().toISOString()
                })
            };
            await supabase.from(GHOST_BRIDGE_TABLE).insert(faultPayload);

            // 2. Log to Diagnostics (Historical / Triage)
            await supabase.from('matrix_diagnostics').insert({
                app: 'ghost-command',
                category: 'error',
                severity: 'critical',
                action: 'unhandled_exception',
                error: error.message,
                metadata: {
                    stack: error.stack,
                    componentStack: info.componentStack
                },
                timestamp: new Date().toISOString()
            });

        } catch (err) {
            console.error("Critical Failure: Could not report fault.", err);
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden font-sans">
                    {/* AMBIENT BACKGROUND */}
                    <div className="absolute inset-0 scanline opacity-10 pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,107,107,0.05)_0%,transparent_70%)] pointer-events-none" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10 max-w-lg w-full space-y-8"
                    >
                        {/* ERROR IDENTITY */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                                <AlertTriangle size={32} />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-[12px] font-black tracking-[0.6em] uppercase text-red-500/80">Neural_Severance_Detected</h1>
                                <div className="flex items-center justify-center gap-2 text-[9px] font-mono text-white/30 tracking-widest uppercase">
                                    <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                                    <span>Signal_Lost // Core_Panic</span>
                                </div>
                            </div>
                        </div>

                        {/* DESCRIPTIVE LOG */}
                        <div className="space-y-4">
                            <p className="text-[14px] leading-relaxed text-slate-400 font-medium px-4">
                                The interface has sustained direct damage. A neuro-audit has been transmitted to the Ghost Runner for autonomous triage.
                            </p>

                            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 text-left font-mono relative group mx-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[8px] text-red-500/50 uppercase tracking-widest">Fault_Dump</span>
                                    <div className="flex items-center gap-2 p-1 rounded bg-red-500/10 border border-red-500/20">
                                        <span className="text-[7px] text-red-500/80 font-bold tracking-tighter uppercase px-1">Critical</span>
                                    </div>
                                </div>
                                <div className="text-[11px] text-red-400/90 break-all leading-snug">
                                    {this.state.error?.message || "Unknown exogenous error pattern detected."}
                                </div>
                                <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[3px] h-3/4 bg-red-500/30 rounded-full" />
                            </div>
                        </div>

                        {/* RECOVERY ACTIONS */}
                        <div className="flex flex-col gap-4 px-4">
                            <button
                                type="button"
                                onClick={() => {
                                    localStorage.clear();
                                    window.location.reload();
                                }}
                                className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-bold tracking-[0.3em] uppercase text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3 group"
                            >
                                <span className="group-hover:translate-x-1 transition-transform inline-block">🚀</span>
                                Re-initiate_Interface_Sync
                            </button>

                            <div className="flex items-center justify-center gap-4 text-[7px] font-mono text-white/10 uppercase tracking-[0.4em] pt-4">
                                <span>Ref_Id: {Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                                <span className="w-1 h-1 rounded-full bg-white/5" />
                                <span>Auth: Matrix_Root</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}
