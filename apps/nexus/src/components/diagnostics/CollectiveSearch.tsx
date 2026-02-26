'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, X, ChevronRight, History, Sparkles, Brain, Radio, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface SearchResult {
    id: string;
    type: 'session' | 'broadcast' | 'cluster';
    title: string;
    content: string;
    timestamp: string;
    metadata?: any;
}

export function CollectiveSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Toggle with Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleResultKeyDown = (e: React.KeyboardEvent) => {
        if (results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const result = results[selectedIndex];
            if (!result) return;

            // Map results to Dashboard Tabs
            let tab = '';
            if (result.type === 'session') tab = 'terminal';
            else if (result.type === 'cluster') tab = 'evolution';
            else if (result.type === 'broadcast') tab = 'diag';

            if (tab) {
                router.push(`/?tab=${tab}`);
                setIsOpen(false);
            }
        }
    };

    // Scroll Lock Logic
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const performSearch = async (val: string) => {
        if (!val.trim()) {
            setResults([]);
            setSelectedIndex(0);
            return;
        }
        setIsSearching(true);
        setSelectedIndex(0);
        try {
            const [sessionsRes, broadcastsRes, clustersRes] = await Promise.all([
                // 1. Sessions Search (Keyword for now, vector would need embedding call which might be slow for real-time)
                supabase.from('sessions')
                    .select('id, initial_input, created_at')
                    .ilike('initial_input', `%${val}%`)
                    .limit(5),
                // 2. Broadcasts Search
                supabase.from('ghost_bridge')
                    .select('id, output, created_at')
                    .eq('command', 'sys:broadcast')
                    .ilike('output', `%${val}%`)
                    .limit(5),
                // 3. Clusters Search
                supabase.from('mind_clusters')
                    .select('id, title, summary, created_at')
                    .or(`title.ilike.%${val}%,summary.ilike.%${val}%`)
                    .limit(3)
            ]);

            const combined: SearchResult[] = [
                ...(sessionsRes.data || []).map(s => ({
                    id: String(s.id),
                    type: 'session' as const,
                    title: 'Neural Session',
                    content: s.initial_input,
                    timestamp: s.created_at
                })),
                ...(broadcastsRes.data || []).map(b => ({
                    id: String(b.id),
                    type: 'broadcast' as const,
                    title: 'System Broadcast',
                    content: b.output,
                    timestamp: b.created_at
                })),
                ...(clustersRes.data || []).map(c => ({
                    id: String(c.id),
                    type: 'cluster' as const,
                    title: c.title || 'Unknown Cluster',
                    content: c.summary || '',
                    timestamp: c.created_at
                }))
            ];

            // Sort by recency
            combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setResults(combined);
        } catch (err) {
            console.error('Search failure:', err);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="group flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:border-violet-500/30 shadow-lg"
            >
                <div className="flex items-center gap-2">
                    <Search size={14} className="text-violet-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">
                        Collective Search
                    </span>
                </div>
                <div className="flex items-center gap-1 opacity-40">
                    <Command size={10} />
                    <span className="text-[10px] font-bold">K</span>
                </div>
            </button>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[500] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-2xl bg-black/80"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            ref={searchRef}
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-2xl bg-[#0a0a0b] border border-white/10 rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[60vh]"
                        >
                            {/* Input Area */}
                            <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
                                <Search className="text-violet-400" size={20} />
                                <input
                                    autoFocus
                                    placeholder="Search the collective memory..."
                                    className="bg-transparent border-none outline-none text-lg text-white font-medium w-full placeholder:text-slate-600"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={handleResultKeyDown}
                                />
                                {isSearching && <Sparkles size={16} className="text-cyan-400 animate-pulse" />}
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => { setQuery(''); setResults([]); }}
                                        className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-500 hover:text-white"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                    ESC
                                </div>
                            </div>

                            {/* Results Area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {results.length > 0 ? (
                                    <div className="p-4 space-y-1">
                                        {results.map((res) => (
                                            <button
                                                type="button"
                                                key={`${res.type}-${res.id}`}
                                                className={cn(
                                                    "w-full text-left p-3 rounded-xl group transition-all flex items-start gap-4 border",
                                                    results.indexOf(res) === selectedIndex
                                                        ? "bg-white/10 border-white/10 ring-1 ring-violet-500/50"
                                                        : "hover:bg-white/5 border-transparent hover:border-white/5"
                                                )}
                                                onMouseEnter={() => setSelectedIndex(results.indexOf(res))}
                                                onClick={() => {
                                                    let tab = '';
                                                    if (res.type === 'session') tab = 'terminal';
                                                    else if (res.type === 'cluster') tab = 'evolution';
                                                    else if (res.type === 'broadcast') tab = 'diag';
                                                    if (tab) {
                                                        router.push(`/?tab=${tab}`);
                                                        setIsOpen(false);
                                                    }
                                                }}
                                            >
                                                <div className={cn(
                                                    "p-2 rounded-lg bg-black/40 border",
                                                    res.type === 'session' && "border-violet-500/20 text-violet-400",
                                                    res.type === 'broadcast' && "border-emerald-500/20 text-emerald-400",
                                                    res.type === 'cluster' && "border-cyan-500/20 text-cyan-400"
                                                )}>
                                                    {res.type === 'session' && <MessageSquare size={14} />}
                                                    {res.type === 'broadcast' && <Radio size={14} />}
                                                    {res.type === 'cluster' && <Brain size={14} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{res.title}</span>
                                                        <span className="text-[8px] font-mono text-slate-500">
                                                            <SafeDate timestamp={res.timestamp} />
                                                        </span>
                                                    </div>
                                                    <p className="text-[12px] text-white/80 font-medium truncate opacity-70 group-hover:opacity-100 transition-opacity">
                                                        {res.content}
                                                    </p>
                                                </div>
                                                <ChevronRight size={14} className="text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all self-center" />
                                            </button>
                                        ))}
                                    </div>
                                ) : query.length > 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500 select-none">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                                            <Search size={20} className="opacity-20" />
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">No resonance found</span>
                                            <span className="text-[9px] opacity-40 text-center">Neural keyword "{query}" returned no results</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 grid grid-cols-2 gap-4">
                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                                            <h4 className="text-[10px] font-black uppercase tracking-tighter text-violet-400">Pro Tip</h4>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                                Use <span className="bg-white/10 px-1 rounded text-white font-mono">Cmd+K</span> to search from anywhere in Matrix Hub.
                                            </p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                                            <h4 className="text-[10px] font-black uppercase tracking-tighter text-emerald-400">Context</h4>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                                Search includes deep-session logs, mind clusters, and Sentinel broadcasts.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 px-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Sessions</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Broadcasts</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Clusters</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-[9px] font-bold text-slate-600">
                                    <span>ESC to Close</span>
                                    <span>ENTER to Open</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
function SafeDate({ timestamp }: { timestamp: string }) {
    const [date, setDate] = React.useState<string | null>(null);
    React.useEffect(() => {
        setDate(new Date(timestamp).toLocaleDateString());
    }, [timestamp]);
    return <>{date || '--/--/----'}</>;
}
