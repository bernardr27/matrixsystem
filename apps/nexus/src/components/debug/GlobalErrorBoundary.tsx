'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, RefreshCcw, ShieldAlert, Cpu } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Matrix Hub Critical Failure:', error, errorInfo);

        // 1. Log to Diagnostics (Historical / Triage)
        supabase.from('matrix_diagnostics').insert({
            app: 'nexus',
            category: 'error',
            severity: 'critical',
            action: 'unhandled_exception',
            error: error.message,
            metadata: {
                stack: error.stack,
                componentStack: errorInfo.componentStack
            },
            timestamp: new Date().toISOString()
        }).then(() => { /*  */ });
        // AUTO-RECOVERY for the persistent "E.border" crash only
        if (error.message.includes('border') && error.message.includes('undefined')) {
            try {
                localStorage.removeItem('nexus_theme');
                localStorage.removeItem('nexus_layout');
                sessionStorage.clear();
            } catch { }
        }
    }

    private handleReset = () => {
        // Only remove layout/theme keys — preserve auth state
        try {
            localStorage.removeItem('nexus_theme');
            localStorage.removeItem('nexus_layout');
            localStorage.removeItem('nexus_boot');
            sessionStorage.clear();
        } catch { }
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#050510] flex items-center justify-center p-6 font-sans antialiased text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 blur-[120px] rounded-full" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full max-w-xl glass-card p-12 text-center border-red-500/20"
                    >
                        <div className="inline-flex p-4 rounded-2xl bg-red-500/20 text-red-400 mb-8 border border-red-500/20">
                            <ShieldAlert size={48} />
                        </div>

                        <h1 className="text-3xl font-bold tracking-tighter mb-4 uppercase">Neural Core Failure</h1>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-md mx-auto italic">
                            &quot;The command node has encountered a critical recursive fault. State integrity has been compromised to prevent cascade failure.&quot;
                        </p>

                        <div className="bg-black/40 border border-white/5 rounded-2xl p-6 text-left mb-8 space-y-3 font-mono">
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                                <Cpu size={12} /> Fault Signature
                            </div>
                            <p className="text-red-400/80 text-xs break-all">
                                {this.state.error?.message || "Unknown State Inconsistency"}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCcw size={16} /> Hot Reload
                            </button>
                            <button
                                type="button"
                                onClick={this.handleReset}
                                className="px-8 py-3 bg-red-500 text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-400 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                            >
                                Failsafe Recovery
                            </button>
                        </div>

                        <p className="mt-8 text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
                            Matrix Hub Intelligent Resilience v1.0
                        </p>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}
