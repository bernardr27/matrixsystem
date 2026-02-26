'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Activity, ArrowRight, CheckCircle2, Circle, Clock,
    Database, Globe, Cpu, Flame, Rocket, Server, Wifi, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

/*  ═══════════════════════════════════════════════════════
    PIPELINE STATUS — Nexus Dashboard Widget
    Shows: service ports, deps, builds, Ollama, active PRDs
    Fetches from GET /api/pipeline
    ═══════════════════════════════════════════════════════ */

interface PipelineData {
    timestamp: string;
    healthy: boolean;
    services: Record<string, { port: number; status: string }>;
    ollama: string;
    dependencies: { name: string; installed: boolean }[];
    builds: { name: string; built: boolean }[];
    prds: { active: string[]; completed: string[] };
    autopilot?: {
        status: string;
        score: number | null;
        failedChecks: string[];
        lastRunAt: string | null;
        mode: string | null;
    };
    pipeline: {
        antigravity: string;
        ralph: string;
        sage: string;
        claudeCode: string;
    };
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
    'Reflect': <Globe className="w-3.5 h-3.5" />,
    'Nexus': <Cpu className="w-3.5 h-3.5" />,
    'Ghost Command': <Rocket className="w-3.5 h-3.5" />,
    'RocketCommand': <Flame className="w-3.5 h-3.5" />,
};

const GLASS_PANEL = "bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl";

export function PipelineStatus() {
    const [data, setData] = useState<PipelineData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<string>('');

    const fetchPipeline = useCallback(async () => {
        try {
            const res = await fetch('/api/pipeline');
            const json = await res.json();
            setData(json);
            setLastUpdate(new Date().toLocaleTimeString());
        } catch { /* silent */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPipeline();
        const iv = setInterval(fetchPipeline, 15000);
        return () => clearInterval(iv);
    }, [fetchPipeline]);

    if (loading) {
        return (
            <div className={cn(GLASS_PANEL, "p-6 animate-pulse")}>
                <div className="h-5 w-40 bg-white/5 rounded mb-4" />
                <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-8 bg-white/5 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (!data) return null;

    const serviceEntries = Object.entries(data.services);
    const allUp = serviceEntries.every(([, s]) => s.status === 'up');
    const upCount = serviceEntries.filter(([, s]) => s.status === 'up').length;

    return (
        <div className={cn(GLASS_PANEL, "p-6")}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/15 rounded-xl">
                        <Activity className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white/80">Pipeline Status</h3>
                        <p className="text-[10px] text-white/30 font-mono">{lastUpdate}</p>
                    </div>
                </div>
                <div className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold",
                    allUp
                        ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                        : "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                )}>
                    {allUp ? 'ALL SYSTEMS GO' : `${upCount}/${serviceEntries.length} UP`}
                </div>
            </div>

            {/* Service grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                {serviceEntries.map(([name, info]) => (
                    <div
                        key={name}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04]"
                    >
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            info.status === 'up'
                                ? "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]"
                                : "bg-red-400"
                        )} />
                        <span className="text-white/40">{SERVICE_ICONS[name]}</span>
                        <div className="flex-1 min-w-0">
                            <span className="text-[11px] text-white/60 block truncate">{name}</span>
                        </div>
                        <span className="text-[10px] text-white/25 font-mono">:{info.port}</span>
                    </div>
                ))}
            </div>

            {/* Pipeline flow */}
            <div className="mb-4">
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Pipeline Flow</p>
                <div className="flex items-center gap-1 text-[10px] flex-wrap">
                    {[
                        { label: 'Phone', icon: '📱' },
                        { label: 'Antigravity', icon: '🖥️' },
                        { label: 'PRD', icon: '📋' },
                        { label: 'Ralph', icon: '🔁' },
                        { label: 'Claude', icon: '🤖' },
                        { label: 'Sage', icon: '🦉' },
                        { label: 'Deploy', icon: '🚀' },
                    ].map((step, i, arr) => (
                        <React.Fragment key={step.label}>
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                                <span>{step.icon}</span>
                                <span className="text-white/50">{step.label}</span>
                            </div>
                            {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-white/15 shrink-0" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Bottom row: Ollama + PRDs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <Database className={cn("w-3.5 h-3.5", data.ollama === 'up' ? "text-emerald-400" : "text-red-400")} />
                    <div>
                        <span className="text-[11px] text-white/60 block">Sage/Ollama</span>
                        <span className="text-[10px] text-white/30 font-mono">{data.ollama === 'up' ? 'Online' : 'Offline'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                    <div>
                        <span className="text-[11px] text-white/60 block">Active PRDs</span>
                        <span className="text-[10px] text-white/30 font-mono">
                            {data.prds.active.length} active · {data.prds.completed.length} done
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    {data.autopilot?.status === 'executed' || data.autopilot?.status === 'completed'
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        : data.autopilot?.status === 'failed'
                            ? <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            : <Clock className="w-3.5 h-3.5 text-amber-400" />
                    }
                    <div>
                        <span className="text-[11px] text-white/60 block">Auto-Heal</span>
                        <span className="text-[10px] text-white/30 font-mono">
                            {data.autopilot?.score != null ? `score ${data.autopilot.score}` : (data.autopilot?.status || 'unknown')}
                            {data.autopilot?.mode ? ` · ${data.autopilot.mode}` : ''}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
