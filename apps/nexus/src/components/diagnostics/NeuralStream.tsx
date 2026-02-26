'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Maximize2, RefreshCw, AlertCircle, Brain, Sparkles, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export function NeuralStream() {
    const [latestUrl, setLatestUrl] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSnap, setLastSnap] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showGlow, setShowGlow] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const triggerGlow = useCallback(() => {
        setShowGlow(true);
        setTimeout(() => setShowGlow(false), 2000);
    }, []);

    const fetchLatestSnap = useCallback(async () => {
        setIsSyncing(true);
        try {
            const { data, error } = await supabase
                .from('ghost_bridge')
                .select('output, created_at')
                .eq('status', 'executed')
                .like('output', 'FILE_READY:%')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            if (data && data.length > 0) {
                const url = data[0].output.replace('FILE_READY: ', '').trim();
                setLatestUrl(prev => {
                    if (prev !== url) {
                        setLastSnap(new Date(data[0].created_at));
                        triggerGlow();
                        return url;
                    }
                    return prev;
                });
            }
        } catch (err: unknown) {
            setError((err instanceof Error ? err.message : String(err)));
        } finally {
            setIsSyncing(false);
        }
    }, [triggerGlow]);

    useEffect(() => {
        fetchLatestSnap();

        // Subscribe to real-time updates for new snaps
        const channel = supabase.channel('neural_stream_sync')
            .on('postgres_changes', {
                event: '*', // Listen to ALL events (INSERT and UPDATE)
                schema: 'public',
                table: 'ghost_bridge'
            }, (payload) => {
                const { status, output, created_at } = payload.new as any;
                if (status === 'executed' && output?.startsWith('FILE_READY:')) {
                    const url = output.replace('FILE_READY: ', '').trim();
                    

                    // Add cache buster if it's the same base URL to force refresh
                    setLatestUrl(prev => {
                        if (prev?.split('?')[0] === url) {
                            return `${url}?t=${Date.now()}`;
                        }
                        return url;
                    });
                    setLastSnap(new Date(created_at));
                    triggerGlow();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchLatestSnap, triggerGlow]);

    const analyzeWithSage = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!latestUrl) return;
        setIsAnalyzing(true);
        try {
            const { error } = await supabase.from('ghost_bridge').insert({
                command: 'sage:see',
                source: 'nexus_neural_stream',
                status: 'pending'
            });
            if (error) throw error;
        } catch (err: unknown) {
            setError((err instanceof Error ? err.message : String(err)));
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <>
            <div className={cn(
                "glass-card overflow-hidden flex flex-col h-[300px] transition-all duration-1000",
                showGlow && "shadow-[0_0_50px_rgba(34,211,238,0.2)] border-cyan-500/30"
            )}>
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Eye size={14} className="text-violet-400" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic text-white flex items-center gap-2">Neural_Stream</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {lastSnap && (
                            <span className="text-[8px] text-slate-500 uppercase font-bold">
                                T-{Math.floor((Date.now() - lastSnap.getTime()) / 1000)}s
                            </span>
                        )}
                        <button type="button"
                            onClick={analyzeWithSage}
                            disabled={isAnalyzing || !latestUrl}
                            className="p-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 transition-all flex items-center gap-1.5 px-2.5 disabled:opacity-50"
                            title="Analyze with Sage"
                        >
                            <Brain size={12} className={isAnalyzing ? "animate-pulse" : ""} />
                            <span className="text-[9px] font-bold uppercase tracking-tight">Analyze</span>
                        </button>
                        <button type="button"
                            onClick={fetchLatestSnap}
                            disabled={isSyncing}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                        >
                            <RefreshCw size={12} className={cn("text-slate-400", isSyncing && "animate-spin")} />
                        </button>
                    </div>
                </div>

                {/* Viewport */}
                <div
                    className="flex-1 bg-black/40 relative group cursor-pointer overflow-hidden"
                    onClick={() => latestUrl && setIsExpanded(true)}
                >
                    {/* Interaction Hint Overlay */}
                    {latestUrl && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                            <div className="px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                <Maximize2 size={12} className="text-cyan-400" />
                                <span className="text-[9px] font-black uppercase text-white tracking-widest">Tap to Expand</span>
                            </div>
                        </div>
                    )}
                    <AnimatePresence mode="wait">
                        {latestUrl ? (
                            <motion.div
                                key={latestUrl}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center p-4"
                            >
                                <Image
                                    src={latestUrl}
                                    alt="System Vision"
                                    width={1280}
                                    height={720}
                                    className="max-w-full max-h-full object-contain rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/10"
                                    loader={({ src }) => src}
                                    unoptimized
                                />
                                {showGlow && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-4 pointer-events-none border-2 border-cyan-400/50 rounded-xl shadow-[inset_0_0_40px_rgba(34,211,238,0.4)] z-10"
                                    />
                                )}
                                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
                                </div>
                            </motion.div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-600/40">
                                <div className="relative">
                                    <Eye size={48} className="opacity-20 translate-y-2" />
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full"
                                    />
                                </div>
                                <div className="flex flex-col items-center gap-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">System_Vision_Offline</span>
                                    <span className="text-[7px] font-bold uppercase tracking-[0.4em] opacity-40">Awaiting_Neural_Sync_Init</span>
                                </div>
                                <button type="button"
                                    onClick={fetchLatestSnap}
                                    className="mt-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-cyan-400 transition-all active:scale-95"
                                >
                                    Initiate_Pulse_Link
                                </button>
                            </div>
                        )}
                    </AnimatePresence>


                </div>

                {error && (
                    <div className="absolute bottom-4 left-4 right-4 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg flex items-center gap-2">
                        <AlertCircle size={12} className="text-rose-400" />
                        <span className="text-[8px] font-bold text-rose-300 uppercase truncate">{error}</span>
                    </div>
                )}

                {/* Footer Bar */}
                <div className="p-2 px-4 bg-black/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] text-emerald-400 font-black uppercase">Live</span>
                        </div>
                    </div>
                    <span className="text-[8px] text-slate-500 font-mono tracking-tighter">
                        {latestUrl ? latestUrl.split('/').pop()?.substring(0, 16) + '...' : 'IDLE'}
                    </span>
                </div>
            </div>

            {/* EXPANDED MODAL */}
            <AnimatePresence>
                {isExpanded && latestUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsExpanded(false)}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 cursor-zoom-out"
                    >
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={latestUrl}
                            className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10"
                        />
                        <div className="absolute top-8 right-8 flex gap-4">
                            <button type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    analyzeWithSage();
                                }}
                                className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-all shadow-[0_0_30px_rgba(124,58,237,0.3)] flex items-center gap-2"
                            >
                                <Brain size={16} />
                                Analyze
                            </button>
                            <button type="button"
                                onClick={() => setIsExpanded(false)}
                                className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
