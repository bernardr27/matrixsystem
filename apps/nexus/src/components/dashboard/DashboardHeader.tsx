'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity, Cpu, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelemetry } from '@/components/providers/TelemetryProvider';

export function DashboardHeader() {
    const { services, coherence } = useTelemetry();
    const onlineCount = Object.values(services || {}).filter(s => s === 'online').length;
    const totalServices = Math.max(Object.keys(services || {}).length, 1);
    const systemStatus = onlineCount === totalServices ? 'NOMINAL' : 'DEGRADED';

    return (
        <div className="relative w-full overflow-hidden rounded-3xl m-glass p-8 border border-white/5 group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-violet-500/5 opacity-50" />

            {/* Ambient Glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full animate-pulse-slow" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

                {/* Title Section */}
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-inner">
                        <Shield className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" size={32} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-white uppercase tracking-widest italic">Matrix_Hub</h1>
                            <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-white/60">v4.2.0</span>
                        </div>
                        <p className="text-xs font-medium text-cyan-500/60 uppercase tracking-[0.2em]">System_Oversight_Protocol_Active</p>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="flex items-center gap-4 md:gap-8">

                    {/* Status Check */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">System_Integrity</span>
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "w-2 h-2 rounded-full animate-pulse",
                                systemStatus === 'NOMINAL' ? "bg-emerald-500 shadow-glow-emerald" : "bg-amber-500 shadow-glow-amber"
                            )} />
                            <span className={cn(
                                "text-sm font-black italic tracking-wide",
                                systemStatus === 'NOMINAL' ? "text-emerald-400" : "text-amber-400"
                            )}>
                                {systemStatus}
                            </span>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-white/10" />

                    {/* Coherence */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Neural_Coherence</span>
                        <div className="flex items-center gap-2">
                            <Activity size={14} className="text-violet-400" />
                            <span className="text-sm font-black text-violet-100 italic">{coherence}%</span>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-white/10" />

                    {/* Services */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Active_Nodes</span>
                        <div className="flex items-center gap-2">
                            <Cpu size={14} className="text-cyan-400" />
                            <span className="text-sm font-black text-cyan-100 italic">{onlineCount}/{totalServices}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Deco Line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        </div>
    );
}
