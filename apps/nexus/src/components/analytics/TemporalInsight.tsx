'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Sparkles, Zap, ChevronRight, Brain } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uuidv4 } from '@/lib/uuid';
import { NeuralSurface } from '@/components/ui/NeuralSurface';

interface Resonance {
    id: string;
    initial_input: string;
    created_at: string;
    similarity: number;
}

export function TemporalInsight() {
    const [insight, setInsight] = useState<Resonance | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsight = async () => {
            try {
                // In a real scenario, we'd generate an embedding for the "current state"
                // For this demo, we'll ask Sage to find "the most significant lesson from the past"
                // via a semantic query

                const cmdId = uuidv4();

                // 1. Dispatch query
                await supabase.from('ghost_bridge').insert({
                    id: cmdId,
                    command: 'sage:query significant personal growth lesson',
                    status: 'pending'
                });

                // 2. Subscribe to Realtime updates
                const channel = supabase
                    .channel(`insight-${cmdId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'ghost_bridge',
                            filter: `id=eq.${cmdId}`
                        },
                        (payload) => {
                            const newData = payload.new;
                            if (newData.status === 'executed' && newData.output) {
                                if (!newData.output.includes('NEURAL_VOID')) {
                                    setInsight({
                                        id: cmdId,
                                        initial_input: newData.output.split('\n')[0].replace(/\[.*?\] /, ''),
                                        created_at: new Date().toISOString(),
                                        similarity: 0.85
                                    });
                                }
                                setLoading(false);
                                supabase.removeChannel(channel);
                            }
                        }
                    )
                    .subscribe();

                // Fallback timeout if Realtime fails or takes too long (10s)
                setTimeout(() => {
                    setLoading(false);
                    supabase.removeChannel(channel);
                }, 10000);

            } catch (e) {
                console.error('[TEMPORAL_INSIGHT] Failed to fetch resonance:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchInsight();
    }, []);

    if (loading) return (
        <NeuralSurface variant="glass" className="p-6 border-white/5 animate-pulse">
            <div className="flex items-center gap-3 mb-4 opacity-50">
                <History size={16} />
                <div className="h-3 w-32 bg-white/20 rounded" />
            </div>
            <div className="space-y-2">
                <div className="h-4 w-full bg-white/10 rounded" />
                <div className="h-4 w-2/3 bg-white/10 rounded" />
            </div>
        </NeuralSurface>
    );

    return (
        <AnimatePresence>
            {insight && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                >
                    <NeuralSurface variant="glass" className="relative overflow-hidden border-white/5 p-6 group hover:border-cyan-500/30 transition-colors">
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[40px] rounded-full pointer-events-none" />

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                    <History size={16} className="text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                                        Temporal Resonance
                                    </h3>
                                    <p className="text-[7px] font-bold text-cyan-400/60 uppercase tracking-widest mt-0.5">
                                        Sage Memory Retrieval
                                    </p>
                                </div>
                            </div>
                            <div className="text-[9px] font-black text-white/20 tracking-tighter">
                                {Math.round(insight.similarity * 100)}% MATCH
                            </div>
                        </div>

                        <div className="relative mb-6">
                            <Sparkles size={12} className="absolute -top-4 -left-2 text-amber-400/30" />
                            <p className="text-sm font-light leading-relaxed text-slate-300 italic">
                                &quot;{insight.initial_input}&quot;
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <Brain size={12} className="text-cyan-400" />
                                    <span className="text-[8px] font-bold uppercase tracking-widest">Re-integrated</span>
                                </div>
                            </div>
                            <button type="button" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-cyan-400 opacity-60 hover:opacity-100 transition-all group/btn">
                                Explore Synapse
                                <ChevronRight size={10} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </NeuralSurface>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
