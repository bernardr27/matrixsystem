'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Database, Code, X, ChevronRight, Activity } from 'lucide-react';

interface IntelligenceDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

export const IntelligenceDashboard: React.FC<IntelligenceDashboardProps> = ({ isOpen, onClose }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);

    const startDeepResearch = () => {
        setIsAnalyzing(true);
        // Simulate progress
        let p = 0;
        const interval = setInterval(() => {
            p += 5;
            setProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                setIsAnalyzing(false);
            }
        }, 150);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
                >
                    <div className="w-full max-w-4xl h-[70vh] glass-panel border border-gold-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative">
                        {/* Background Neural Effect */}
                        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(212,168,67,0.1)_0%,transparent_70%)]" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-500 shadow-[0_0_20px_rgba(212,168,67,0.2)]">
                                    <Brain className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-display font-bold text-white tracking-widest uppercase">Deep Intelligence</h2>
                                    <p className="text-xs font-mono text-gold-500/60 tracking-widest uppercase">NotebookLM Grounded Synthesis // AntiGravity Bridge</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex overflow-hidden relative z-10">
                            {/* Actions Panel */}
                            <div className="w-72 border-r border-white/5 p-6 flex flex-col gap-4">
                                <button
                                    onClick={startDeepResearch}
                                    disabled={isAnalyzing}
                                    className="w-full py-4 px-4 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-black font-display font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(212,168,67,0.3)] hover:shadow-[0_15px_40px_rgba(212,168,67,0.4)] transition-all disabled:opacity-50"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    {isAnalyzing ? 'Analyzing...' : 'Execute Superpower'}
                                </button>

                                <div className="mt-6 flex flex-col gap-2">
                                    <span className="text-[10px] font-mono text-gold-500/40 uppercase tracking-widest ml-1">MCP Sources</span>
                                    <div className="space-y-2">
                                        {[
                                            { name: 'Core Architecture', status: 'mapped' },
                                            { name: 'Neural Mesh V2', status: 'mapped' },
                                            { name: 'Sovereign UI Patterns', status: 'active' }
                                        ].map((source, i) => (
                                            <div key={i} className="px-4 py-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-gold-500/30 transition-all cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <Database className="w-3.5 h-3.5 text-gold-500/60" />
                                                    <span className="text-xs text-white/70 font-mono tracking-tight">{source.name}</span>
                                                </div>
                                                <div className={`w-1.5 h-1.5 rounded-full ${source.status === 'active' ? 'bg-gold-500 animate-pulse' : 'bg-emerald-500'}`} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Main Reasoning View */}
                            <div className="flex-1 p-8 overflow-y-auto">
                                <div className="space-y-8">
                                    {isAnalyzing && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.2em] text-gold-500/80 uppercase">
                                                <span>Synthesizing Grounded Research</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-gold-500 shadow-[0_0_15px_rgba(212,168,67,0.5)]"
                                                    animate={{ width: `${progress}%` }}
                                                />
                                            </div>

                                            <div className="space-y-4 pt-4">
                                                {[
                                                    "Mapping Neural Mesh connections...",
                                                    "Extracting architectural patterns from NotebookLM sources...",
                                                    "Bridging research vectors to AntiGravity builder protocols...",
                                                    "Generating high-fidelity technical specifications..."
                                                ].map((step, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: i * 25 < progress ? 1 : 0.3, x: 0 }}
                                                        className="flex items-center gap-3 text-xs font-mono text-white/60"
                                                    >
                                                        <ChevronRight className={`w-3 h-3 ${i * 25 < progress ? 'text-gold-500' : 'text-white/20'}`} />
                                                        {step}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {!isAnalyzing && progress === 100 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="space-y-6"
                                        >
                                            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-4">
                                                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500">
                                                    <Code className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-emerald-500 font-bold text-sm tracking-wide">Synthesis Complete</h3>
                                                    <p className="text-xs text-white/50 mt-1">AntiGravity Specification v7.0 has been saved to the Collective Insights vault.</p>
                                                </div>
                                            </div>

                                            <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                                                <div className="flex items-center gap-2 text-[10px] font-mono text-gold-500/60 tracking-widest uppercase">
                                                    <Activity className="w-3 h-3" />
                                                    Insight Preview
                                                </div>
                                                <pre className="text-[11px] font-mono text-white/40 leading-relaxed whitespace-pre-wrap">
                                                    {`--- SOURCE GROUNDED SPECIFICATION ---
OBJECTIVE: Implement sovereign voice mesh integration
SOURCES: NotebookLM://id_8829, InternalDocs://mesh_v2
STATUS: READY FOR EXECUTION
ARCHITECT: AntiGravity Intelligence Bridge`}
                                                </pre>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
