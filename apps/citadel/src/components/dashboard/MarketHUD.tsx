'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Zap, Globe, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@matrix-lib/utils';

interface MarketTask {
    id: string;
    task_title: string;
    task_type: string;
    reward_points: number;
    status: 'open' | 'claimed' | 'active' | 'completed' | 'failed';
    created_at: string;
    region?: string;
}

export function MarketHUD() {
    const [tasks, setTasks] = useState<MarketTask[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMarket = async () => {
            try {
                const res = await fetch('/api/market/status');
                if (res.ok) {
                    const json = await res.json();
                    setTasks(json.tasks || []);
                }
            } catch { /* ignore */ }
            setLoading(false);
        };

        fetchMarket();
        const timer = setInterval(fetchMarket, 15000);
        return () => clearInterval(timer);
    }, []);

    if (loading) return null;

    const openTasks = tasks.filter(t => t.status === 'open');
    const activeTasks = tasks.filter(t => t.status === 'claimed' || t.status === 'active');

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">Autonomous Market</span>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                        <Zap className="w-2.5 h-2.5 text-amber-400" />
                        <span className="text-[8px] font-mono text-amber-400 uppercase tracking-widest">{openTasks.length} Open Orders</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Active Order Book */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-3 h-3 text-white/30" />
                        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Active Processing</span>
                    </div>
                    <div className="space-y-2">
                        {activeTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-medium text-white/80">{task.task_title}</span>
                                    <span className="text-[8px] font-mono text-white/20 uppercase">{task.task_type}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-amber-400">+{task.reward_points}P</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                </div>
                            </div>
                        ))}
                        {activeTasks.length === 0 && (
                            <div className="py-4 text-center text-[10px] text-white/10 font-mono italic">
                                No active task claims at this localized node.
                            </div>
                        )}
                    </div>
                </div>

                {/* Decentralized Heatmap (Simplified) */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Globe className="w-3 h-3 text-white/30" />
                        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Global Resource Supply</span>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-white/60">Hive Throughput</span>
                            <span className="text-[10px] font-mono text-emerald-400">Optimal</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ width: ['40%', '65%', '45%'] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="h-full bg-emerald-500/50"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <div className="p-2 bg-white/5 rounded-lg text-center">
                                <span className="block text-lg font-mono text-white/90">{openTasks.length}</span>
                                <span className="text-[8px] font-mono text-white/30 uppercase">Unclaimed</span>
                            </div>
                            <div className="p-2 bg-white/5 rounded-lg text-center">
                                <span className="block text-lg font-mono text-emerald-400">92%</span>
                                <span className="text-[8px] font-mono text-white/30 uppercase">Efficiency</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Marketplace Signal */}
            <div className="mt-4 p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <ArrowUpRight className="w-3 h-3 text-amber-400 animate-bounce" />
                    <span className="text-[8px] font-mono text-amber-400/60 uppercase tracking-widest">Autonomous Resource Marketplace Synchronization Active</span>
                </div>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-0.5 h-2 bg-amber-400/20 rounded-full" />
                    ))}
                </div>
            </div>
        </div>
    );
}

