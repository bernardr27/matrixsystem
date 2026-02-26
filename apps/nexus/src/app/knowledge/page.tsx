'use client';

import React, { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Shield, Ghost, Zap, Activity, Book, Search, ChevronRight, FileText, Settings, Database, Cpu, Globe, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { NeuralButton } from '@/components/ui/NeuralButton';

const GUIDES = [
    {
        id: 'instructions',
        name: 'Matrix Instructions',
        icon: Zap,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        description: 'Foundational protocols for human-AI interaction and governance.',
        content: 'Matrix Instructions provide the foundational protocols for human-AI interaction. This live library tracks governance, operational safety, and neural handshake procedures. Key directives include: 1. Ensure absolute signal clarity before ignition. 2. Maintain resonance coherence above 80%. 3. Monitor Ghost telemetry for autonomous drift.'
    },
    {
        id: 'sentinel',
        name: 'Sentinel',
        icon: Shield,
        color: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
        description: 'System watchdog and process guardian.',
        content: 'Sentinel monitors all system threads, ensuring that the Ghost-Runner processes stay within their memory bounds. It intercepts unauthorized memory access and provides a real-time heartbeat to the Matrix Hub.'
    },
    {
        id: 'ghost',
        name: 'Ghost Runner',
        icon: Ghost,
        color: 'text-violet-400',
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/20',
        description: 'Process executor and task engine.',
        content: 'Ghost Runner is the primary execution engine. It handles asynchronous job scheduling, process isolation, and dynamic scaling of background workers based on CPU availability.'
    },
    {
        id: 'nexus',
        name: 'Matrix Hub',
        icon: Activity,
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20',
        description: 'The neural interface and central hub.',
        content: 'Matrix Hub is the central orchestration layer. It bridges the telemetry from all nodes into the unified Constellation visualization, managing the global "System State" and routing commands to specific nodes.'
    },
    {
        id: 'protocol',
        name: 'Extraction Protocol',
        icon: Database,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        description: 'Standardized skill extraction methodology.',
        content: 'The Extraction Protocol defines the rigorous process of converting raw conversation logs and agent actions into reusable "Skills". This involves: 1. Pattern Recognition. 2. Abstraction of Logic. 3. Documentation generation. 4. Integration into the Skill Library.'
    }
];

export default function KnowledgeBase() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050510]" />}>
            <KnowledgeBaseContent />
        </Suspense>
    );
}

function KnowledgeBaseContent() {
    const [selectedGuide, setSelectedGuide] = useState<typeof GUIDES[0] | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredGuides = GUIDES.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className="min-h-screen bg-[#020205] text-white overflow-x-hidden relative selection:bg-cyan-500/30">
            <div className="fixed inset-0 industrial-grid opacity-[0.03] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-cyan-500/[0.05] to-transparent pointer-events-none" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-12 relative z-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-16">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                                <Book className="text-cyan-400" size={24} />
                            </div>
                            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter italic text-white break-all sm:break-normal">
                                Aetheric<span className="text-cyan-500">_Archive</span>
                            </h1>
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] pl-1 max-w-xl leading-relaxed">
                            Neural Knowledge Repository // Access_Level: UNESTRICTED
                        </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative group flex-1 md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search Neural Indices..."
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-500/[0.02] transition-all"
                            />
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Navigation Grid */}
                    <div className={cn("col-span-1 lg:col-span-4 space-y-6", selectedGuide ? "hidden lg:block" : "block")}>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 pl-2">Data_Nodes</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {filteredGuides.map((guide) => (
                                <button
                                    key={guide.id}
                                    type="button"
                                    onClick={() => setSelectedGuide(guide)}
                                    className={cn(
                                        "group relative w-full text-left p-6 rounded-[2rem] border transition-all duration-300 overflow-hidden",
                                        selectedGuide?.id === guide.id
                                            ? "bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.1)]"
                                            : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                                    )}
                                >
                                    <div className="flex items-start gap-5 relative z-10">
                                        <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", guide.bg, guide.border, "border")}>
                                            <guide.icon size={20} className={guide.color} />
                                        </div>
                                        <div>
                                            <h4 className={cn("text-sm font-black uppercase tracking-widest italic mb-2", selectedGuide?.id === guide.id ? "text-white" : "text-slate-400 group-hover:text-slate-200")}>
                                                {guide.name}
                                            </h4>
                                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                                                {guide.description}
                                            </p>
                                        </div>
                                    </div>
                                    {selectedGuide?.id === guide.id && (
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                            <ChevronRight className="text-cyan-400 animate-pulse" size={20} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Viewer */}
                    <div className={cn("col-span-1 lg:col-span-8", !selectedGuide ? "hidden lg:block" : "block")}>
                        <AnimatePresence mode="wait">
                            {selectedGuide ? (
                                <motion.div
                                    key={selectedGuide.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="h-full"
                                >
                                    <NeuralSurface className="h-full min-h-[600px] p-8 md:p-12 relative overflow-hidden group">
                                        {/* Background Effects */}
                                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
                                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/5 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

                                        {/* Mobile Back Button */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedGuide(null)}
                                            className="lg:hidden mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500"
                                        >
                                            <ChevronRight className="rotate-180" size={14} /> Back to Index
                                        </button>

                                        <div className="flex items-start justify-between mb-12">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("p-4 rounded-3xl border", selectedGuide.bg, selectedGuide.border)}>
                                                    <selectedGuide.icon size={32} className={selectedGuide.color} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-white">
                                                            {selectedGuide.name}
                                                        </h2>
                                                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            Read_Only
                                                        </div>
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                                                        ID: 0x{selectedGuide.id.toUpperCase()}_{new Date().getFullYear()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="prose prose-invert prose-lg max-w-none">
                                            <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 mb-8">
                                                <p className="text-lg text-slate-300 leading-loose italic font-medium">
                                                    "{selectedGuide.content}"
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-6 rounded-3xl bg-cyan-500/[0.02] border border-cyan-500/10 hover:border-cyan-500/30 transition-colors">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <Cpu size={18} className="text-cyan-400" />
                                                        <h4 className="text-xs font-black uppercase tracking-widest text-white">Processing_Logic</h4>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                                        Standard execution requires Level 3 clearance. Logic gates are monitored by Sentinel processes to prevent recursion loops.
                                                    </p>
                                                </div>
                                                <div className="p-6 rounded-3xl bg-violet-500/[0.02] border border-violet-500/10 hover:border-violet-500/30 transition-colors">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <Lock size={18} className="text-violet-400" />
                                                        <h4 className="text-xs font-black uppercase tracking-widest text-white">Security_Protocol</h4>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                                        Immutable record. Changes must be signed by the Matrix Overseer keypair.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                                            <NeuralButton variant="ghost" className="text-[10px] tracking-widest">
                                                <Settings size={14} className="mr-2" /> config_v1.json
                                            </NeuralButton>
                                            <span className="text-[9px] font-mono text-slate-600">
                                                LAST_MODIFIED: {new Date().toLocaleDateString()}
                                            </span>
                                        </div>
                                    </NeuralSurface>
                                </motion.div>
                            ) : (
                                <div className="h-full min-h-[600px] flex flex-col items-center justify-center p-12 text-center opacity-40 border-2 border-dashed border-white/5 rounded-[3rem]">
                                    <Database size={64} className="text-slate-700 mb-6" />
                                    <h3 className="text-xl font-black uppercase tracking-widest text-slate-600 mb-2">
                                        No_Data_Selected
                                    </h3>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-700">
                                        Select a data node from the index to view contents
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </main>
    );
}
