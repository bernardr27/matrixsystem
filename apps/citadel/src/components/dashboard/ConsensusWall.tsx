'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, MessageSquare, Award, Zap, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@matrix-lib/utils';

interface ConsensusInsight {
    id: string;
    title: string;
    description: string;
    insight_type: string;
    verification_status: 'unverified' | 'verified' | 'universal';
    endorsements_count: number;
    consensus_score: number;
    hive_consensus_votes?: {
        vote_type: string;
        rationale: string;
    }[];
}

interface MeshStats {
    total_nodes: number;
    online_nodes: number;
    resonance_factor: number;
}

export function ConsensusWall() {
    const [insights, setInsights] = useState<ConsensusInsight[]>([]);
    const [mesh, setMesh] = useState<MeshStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConsensus = async () => {
            try {
                const res = await fetch('/api/consensus');
                if (res.ok) {
                    const json = await res.json();
                    setInsights(json.insights || []);
                    setMesh(json.mesh || null);
                }
            } catch { /* ignore */ }
            setLoading(false);
        };

        fetchConsensus();
        const timer = setInterval(fetchConsensus, 30000);
        return () => clearInterval(timer);
    }, []);

    if (loading) return null;

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">Collective Consciousness</span>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                        <Users className="w-2.5 h-2.5 text-indigo-400" />
                        <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-widest">
                            {mesh ? `${mesh.online_nodes}/${mesh.total_nodes} Nodes Sync` : 'Hive Consensus Active'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {insights.map((insight, idx) => (
                    <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={cn(
                            "bg-white/[0.02] border rounded-xl p-4 flex flex-col gap-2 transition-all hover:bg-white/[0.04]",
                            insight.verification_status === 'verified' || insight.verification_status === 'universal'
                                ? "border-indigo-500/30"
                                : "border-white/5"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">{insight.insight_type}</span>
                            {insight.verification_status !== 'unverified' && (
                                <Award className="w-3 h-3 text-indigo-400" />
                            )}
                        </div>

                        <h4 className="text-[11px] font-display font-bold text-white/90 leading-tight">
                            {insight.title}
                        </h4>

                        <p className="text-[9px] text-white/40 leading-relaxed line-clamp-2">
                            {insight.description}
                        </p>

                        <div className="mt-auto pt-3 flex items-center justify-between border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                                <div className="flex -space-x-1">
                                    {[...Array(Math.min(3, insight.endorsements_count))].map((_, i) => (
                                        <div key={i} className="w-2.5 h-2.5 rounded-full bg-indigo-500/40 border border-[#06060f] flex items-center justify-center">
                                            <div className="w-1 h-1 bg-white/40 rounded-full" />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-[8px] font-mono text-white/30 truncate">
                                    {insight.endorsements_count} Endorsements
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[9px] font-mono text-indigo-400">{(insight.consensus_score * 100).toFixed(0)}%</span>
                            </div>
                        </div>

                        {/* Agreement Bar */}
                        <div className="w-full bg-white/5 h-0.5 rounded-full overflow-hidden mt-1">
                            <div
                                className="h-full bg-indigo-500/60"
                                style={{ width: `${insight.consensus_score * 100}%` }}
                            />
                        </div>
                    </motion.div>
                ))}

                {insights.length === 0 && (
                    <div className="col-span-full py-12 text-center border border-dashed border-white/5 rounded-xl">
                        <Zap className="w-5 h-5 text-white/5 mx-auto mb-2" />
                        <span className="text-[10px] font-mono text-white/10 uppercase tracking-widest block">No verified patterns identified yet.</span>
                        <span className="text-[8px] font-mono text-white/5 uppercase mt-1 block">Hive currently synthesizing environmental data...</span>
                    </div>
                )}
            </div>

            {/* Global Consensus Signal */}
            <div className="mt-4 p-2 bg-indigo-500/5 border border-indigo-500/10 rounded-lg flex items-center justify-center gap-3">
                <Globe className="w-3 h-3 text-indigo-400/60" />
                <span className="text-[8px] font-mono text-indigo-400/60 uppercase tracking-widest">
                    Planetary Mesh Pattern Synchronization: {insights.filter(i => i.verification_status !== 'unverified').length} Verified
                </span>
                <div className="flex gap-1 ml-auto">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-1 h-1 bg-indigo-500/30 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                </div>
            </div>
        </div>
    );
}

