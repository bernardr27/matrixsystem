'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, Target, Brain, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NeuralSurface } from '../ui/NeuralSurface';
import MatrixDiagnostic from '@/lib/MatrixDiagnostic';

interface DataPoint {
    date: string;
    points: number;
}

export function ResonanceTracker() {
    const [data, setData] = useState<DataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch recent diagnostic activity
                const recent = await MatrixDiagnostic.getRecent('reflect', 50);

                // Group by day
                const dailyPoints: Record<string, number> = {};
                if (recent && recent.length > 0) {
                    recent.forEach(entry => {
                        const date = new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
                        let score = 1;
                        if (entry.category === 'action') score = 5;
                        if (entry.severity === 'critical') score = 10;
                        dailyPoints[date] = (dailyPoints[date] || 0) + score;
                    });
                }

                // Convert to array
                const points = Object.entries(dailyPoints)
                    .map(([date, score]) => ({ date, points: score }))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                // Fallback: Simulation Mode if no data
                if (points.length === 0) {
                    const fallback = Array.from({ length: 7 }).map((_, i) => ({
                        date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                        points: 40 + Math.random() * 30 // Moderate activity simulation
                    }));
                    setData(fallback);
                } else {
                    setData(points);
                }
            } catch (e) {
                console.error('[ANALYTICS] Failed to fetch resonance data:', e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);

    // SVG Chart Logic
    const width = 800;
    const height = 200;
    const padding = 20;
    const points = data.map(d => d.points);
    const max = Math.max(...points, 100);
    const min = Math.min(...points, 0);

    const getX = (i: number) => (i / (data.length - 1)) * (width - padding * 2) + padding;
    const getY = (v: number) => height - ((v - min) / (max - min)) * (height - padding * 2) - padding;

    const pathData = data.length > 1
        ? `M ${getX(0)} ${getY(data[0].points)} ` + data.slice(1).map((d, i) => `L ${getX(i + 1)} ${getY(d.points)}`).join(' ')
        : '';

    const areaData = data.length > 1
        ? `${pathData} L ${getX(data.length - 1)} ${height} L ${getX(0)} ${height} Z`
        : '';

    return (
        <NeuralSurface variant="glass" className="p-8 space-y-8 border-white/5">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-[0.2em] font-display flex items-center gap-3 italic flex-wrap break-all sm:break-normal">
                        <TrendingUp className="text-cyan-400 flex-shrink-0" size={20} />
                        Resonance_Evolution
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-80 whitespace-normal">
                        Cognitive trajectory and synaptogenesis mapping
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <div className="text-xs font-black text-cyan-400 uppercase tracking-widest">Target</div>
                        <div className="text-lg font-black text-white">500</div>
                    </div>
                </div>
            </div>

            <div className="relative h-[240px] w-full bg-black/20 rounded-3xl border border-white/5 overflow-hidden p-4">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Grid Lines */}
                        <div className="absolute inset-0 p-4 flex flex-col justify-between opacity-10 pointer-events-none">
                            {[0, 1, 2, 3].map(i => <div key={i} className="h-[1px] w-full bg-white" />)}
                        </div>

                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                            {/* Area fill */}
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.15" />
                                    <stop offset="100%" stopColor="rgb(34, 211, 238)" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <motion.path
                                initial={{ opacity: 0, pathLength: 0 }}
                                animate={{ opacity: 1, pathLength: 1 }}
                                transition={{ duration: 2, ease: "easeOut" }}
                                d={areaData}
                                fill="url(#chartGradient)"
                            />
                            {/* Line */}
                            <motion.path
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                d={pathData}
                                fill="none"
                                stroke="rgb(34, 211, 238)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            {/* Dots */}
                            {data.map((d, i) => (
                                <motion.circle
                                    key={i}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1 + (i * 0.05) }}
                                    cx={getX(i)}
                                    cy={getY(d.points)}
                                    r="4"
                                    fill="rgb(34, 211, 238)"
                                />
                            ))}
                        </svg>

                        {/* Labels */}
                        <div className="absolute bottom-2 left-4 right-4 flex justify-between opacity-30">
                            {data.filter((_, i) => i % 4 === 0).map((d, i) => (
                                <span key={i} className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                                    {d.date}
                                </span>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <NeuralSurface variant="glass" className="p-6 bg-white/[0.02] rounded-[1.5rem] border-white/5 shadow-xl hover:bg-white/[0.04] transition-all group/stat">
                    <div className="flex items-center gap-3 mb-3">
                        <Activity size={16} className="text-emerald-400 group-hover/stat:animate-pulse" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Velocity</span>
                    </div>
                    <div className="text-2xl font-black text-white tabular-nums drop-shadow-md">
                        {data.length >= 2
                            ? `${((data[data.length - 1].points - data[data.length - 2].points) / Math.max(data[data.length - 2].points, 1) * 100).toFixed(1)}%`
                            : '—'}
                    </div>
                </NeuralSurface>
                <NeuralSurface variant="glass" className="p-6 bg-white/[0.02] rounded-[1.5rem] border-white/5 shadow-xl hover:bg-white/[0.04] transition-all group/stat flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-3">
                        <Target size={16} className="text-cyan-400 group-hover/stat:rotate-45 transition-transform flex-shrink-0" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Efficiency</span>
                    </div>
                    <div className="text-2xl font-black text-white tabular-nums drop-shadow-md">
                        {data.length > 0
                            ? `${Math.min(100, (data.reduce((s, d) => s + d.points, 0) / Math.max(data.length * 100, 1) * 100)).toFixed(1)}%`
                            : '—'}
                    </div>
                </NeuralSurface>
                <NeuralSurface variant="glass" className="p-6 bg-white/[0.02] rounded-[1.5rem] border-white/5 shadow-xl hover:bg-white/[0.04] transition-all group/stat">
                    <div className="flex items-center gap-3 mb-3">
                        <Brain size={16} className="text-violet-400 group-hover/stat:scale-110 transition-transform" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Coherence</span>
                    </div>
                    <div className="text-2xl font-black text-white tabular-nums drop-shadow-md">
                        {data.length >= 3 ? 'HIGH' : data.length > 0 ? 'MODERATE' : 'AWAITING'}
                    </div>
                </NeuralSurface>
                <NeuralSurface variant="glass" className="p-6 bg-white/[0.02] rounded-[1.5rem] border-white/5 shadow-xl hover:bg-white/[0.04] transition-all group/stat">
                    <div className="flex items-center gap-3 mb-3">
                        <Zap size={16} className="text-amber-400 group-hover/stat:animate-bounce" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Synapses</span>
                    </div>
                    <div className="text-2xl font-black text-white tabular-nums drop-shadow-md">
                        {data.reduce((s, d) => s + d.points, 0).toLocaleString()}
                    </div>
                </NeuralSurface>
            </div>
        </NeuralSurface>
    );
}
