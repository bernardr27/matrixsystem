'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Radar, Search, Send, Terminal,
    CheckCircle2, Loader2, AlertCircle,
    ChevronRight, Save, Play, Beaker,
    BrainCircuit, Sparkles, FileText
} from 'lucide-react';
import { cn } from '@matrix-lib/utils';

interface ResearchStep {
    phase: string;
    message?: string;
    question?: string;
    preview?: string;
    report?: string;
    prd?: string;
    questions?: string[];
    count?: number;
    index?: number;
    total?: number;
    error?: string;
}

export const MissionControl: React.FC = () => {
    const [query, setQuery] = useState('');
    const [isResearching, setIsResearching] = useState(false);
    const [steps, setSteps] = useState<ResearchStep[]>([]);
    const [finalReport, setFinalReport] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [steps]);

    const runResearch = async () => {
        if (!query.trim() || isResearching) return;

        setIsResearching(true);
        setSteps([]);
        setFinalReport(null);

        const ROCKET_URL = process.env.NEXT_PUBLIC_ROCKET_URL || 'http://localhost:4000';

        try {
            const response = await fetch(`${ROCKET_URL}/api/deep-research`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, depth: 'standard' }),
            });

            if (!response.body) throw new Error('No readable stream');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.substring(6)) as ResearchStep;
                        setSteps(prev => [...prev, data]);

                        if (data.phase === 'complete' && data.report) {
                            setFinalReport(data.report);
                            setIsResearching(false);
                        }
                        if (data.phase === 'error') {
                            setIsResearching(false);
                        }
                    }
                }
            }
        } catch (err: any) {
            setSteps(prev => [...prev, { phase: 'error', error: err.message }]);
            setIsResearching(false);
        }
    };

    const exportToPRD = async () => {
        if (!finalReport || !steps.find(s => s.phase === 'complete')?.prd) return;

        const prdContent = steps.find(s => s.phase === 'complete')?.prd;
        const ROCKET_URL = process.env.NEXT_PUBLIC_ROCKET_URL || 'http://localhost:4000';

        try {
            const response = await fetch(`${ROCKET_URL}/api/research-export`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prd: prdContent,
                    title: query.substring(0, 30)
                }),
            });

            const data = await response.json();
            if (data.success) {
                setSteps(prev => [...prev, { phase: 'complete', message: `✅ PRD Exported: ${data.path}` }]);
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            setSteps(prev => [...prev, { phase: 'error', error: `Export failed: ${err.message}` }]);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a14] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
            {/* Header */}
            <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                        <Radar className="w-6 h-6 text-gold-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-display font-bold tracking-[0.2em] text-gold-400 uppercase">Mission Control</h2>
                        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">AGI Research Pipeline · v1.0</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-tighter">Swarms Active</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Input & Log */}
                <div className="w-[450px] border-r border-white/5 flex flex-col">
                    {/* Input Area */}
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest ml-1">Research Objective</label>
                            <div className="relative">
                                <textarea
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Enter research topic or mission objective..."
                                    className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-gold-500/50 outline-none transition-all resize-none font-mono"
                                    disabled={isResearching}
                                />
                                <button
                                    onClick={runResearch}
                                    disabled={isResearching || !query.trim()}
                                    className="absolute bottom-4 right-4 p-3 rounded-lg bg-gold-500 text-black hover:bg-gold-400 disabled:opacity-50 disabled:grayscale transition-all shadow-lg"
                                >
                                    {isResearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mission Log */}
                    <div className="flex-1 border-t border-white/5 flex flex-col overflow-hidden">
                        <div className="px-6 py-3 bg-white/[0.01] border-b border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Mission Context</span>
                            <span className="text-[9px] font-mono text-white/20">{steps.length} frames</span>
                        </div>
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                            <AnimatePresence initial={false}>
                                {steps.map((step, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={cn(
                                            "p-3 rounded-lg border font-mono text-[11px]",
                                            step.phase === 'error' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                                step.phase === 'complete' ? "bg-gold-500/10 border-gold-500/20 text-gold-400" :
                                                    "bg-white/[0.02] border-white/5 text-white/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            {step.phase === 'planning' && <BrainCircuit className="w-3.5 h-3.5" />}
                                            {step.phase === 'researching' && <Search className="w-3.5 h-3.5" />}
                                            {step.phase === 'synthesizing' && <Sparkles className="w-3.5 h-3.5" />}
                                            {step.phase === 'complete' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                            {step.phase === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
                                            <span className="uppercase tracking-widest text-[9px] opacity-60">{step.phase}</span>
                                        </div>
                                        {step.message && <div>{step.message}</div>}
                                        {step.question && <div className="text-white/80">{step.question}</div>}
                                        {step.preview && <div className="opacity-40 italic mt-1 truncate">{step.preview}</div>}
                                        {step.error && <div>{step.error}</div>}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {!isResearching && steps.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-10 text-center space-y-4">
                                    <Beaker className="w-12 h-12" />
                                    <p className="text-xs uppercase tracking-[0.2em]">Ready for Mission Launch</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Synthesis Results */}
                <div className="flex-1 flex flex-col bg-black/20">
                    <div className="h-12 px-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gold-400/50" />
                            <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">Research Synthesis</span>
                        </div>
                        {finalReport && (
                            <button
                                onClick={exportToPRD}
                                className="flex items-center gap-2 px-3 py-1 rounded-md bg-gold-500/10 border border-gold-500/20 text-[10px] font-mono text-gold-400 hover:bg-gold-500/20 transition-all"
                            >
                                <Save className="w-3 h-3" />
                                Generate PRD
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 prose prose-invert prose-sm max-w-none">
                        {finalReport ? (
                            <div className="animate-fade-in whitespace-pre-wrap font-sans text-white/80 leading-relaxed">
                                {finalReport}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-white/10 space-y-4 text-center">
                                {isResearching ? (
                                    <>
                                        <Loader2 className="w-12 h-12 animate-spin-slow opacity-20" />
                                        <p className="text-xs uppercase tracking-widest animate-pulse">Synthesizing Neural Signal...</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-24 h-px bg-white/5" />
                                        <p className="text-[10px] uppercase tracking-[0.3em]">Awaiting Knowledge Extraction</p>
                                        <div className="w-24 h-px bg-white/5" />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

