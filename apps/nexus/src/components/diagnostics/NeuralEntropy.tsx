'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTelemetry } from '@/components/providers/TelemetryProvider';
import { cn } from '@/lib/utils';
import { Activity, ShieldCheck, Zap } from 'lucide-react';

export function NeuralEntropy() {
    const { performanceHistory } = useTelemetry();

    // Calculate Entropy (Composite volatility of RAM and CPU)
    const entropyData = useMemo(() => {
        if (performanceHistory.length < 3) return { value: 0, path: "" };

        const width = 200;
        const height = 40;
        const maxPoints = 20;

        // Use last 20 points
        const recent = performanceHistory.slice(-maxPoints);

        let path = "";
        let totalEntropy = 0;

        recent.forEach((point, i) => {
            if (i === 0) return;

            // Difference in RAM from previous point
            const prev = recent[i - 1];
            const ramDiff = Math.abs(point.ram - prev.ram);
            const cpuDiff = point.cpu === prev.cpu ? 0 : 20; // Binary diff for CPU status

            const volatility = (ramDiff + cpuDiff) / 2;
            totalEntropy += volatility;

            const x = (i / (maxPoints - 1)) * width;
            const y = height - (volatility / 50) * height; // Scale: 0-50 volatility range
            path += `${i === 1 ? 'M' : 'L'} ${x} ${Math.max(0, Math.min(height, y))}`;
        });

        return {
            value: Math.round(totalEntropy / recent.length),
            path
        };
    }, [performanceHistory]);

    const status = entropyData.value < 10 ? 'Quiet' : entropyData.value < 25 ? 'Stable' : 'Volatile';
    const color = status === 'Quiet' ? 'text-emerald-400' : status === 'Stable' ? 'text-cyan-400' : 'text-rose-400';
    const bgColor = status === 'Quiet' ? 'bg-emerald-500/20' : status === 'Stable' ? 'bg-cyan-500/20' : 'bg-rose-500/20';

    return (
        <div className="glass-card p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-fuchsia-400" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic text-white">Neural_Entropy</h3>
                </div>
                <div className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase flex items-center gap-1",
                    bgColor, color
                )}>
                    {status === 'Quiet' && <ShieldCheck size={8} />}
                    {status === 'Volatile' && <Zap size={8} className="animate-pulse" />}
                    {status}
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 uppercase font-bold tracking-tighter">System Drift</span>
                    <span className={cn("font-mono font-black", color)}>{entropyData.value}%</span>
                </div>

                <div className="h-10 w-full bg-white/5 rounded relative overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
                        <motion.path
                            d={entropyData.path}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className={color}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1 }}
                        />
                    </svg>
                    {/* Activity bars */}
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/5" />
                </div>

                <p className="text-[8px] text-slate-500 font-medium leading-tight">
                    Composite stability index based on resource volatility and neural load transitions.
                </p>
            </div>
        </div>
    );
}
