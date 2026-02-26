'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, Clock3, RefreshCw, Wrench } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { cn } from '@/lib/utils';

type BridgeStatus = 'pending' | 'executing' | 'executed' | 'failed' | 'processing' | 'completed';

interface AutopilotRun {
    id: string;
    command: string;
    status: BridgeStatus;
    output: string | null;
    created_at: string;
}

function statusTone(status: BridgeStatus) {
    if (status === 'executed' || status === 'completed') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (status === 'failed') return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    if (status === 'executing' || status === 'processing') return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
    return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
}

function parseSummary(output: string | null) {
    if (!output) return null;
    try {
        const parsed = JSON.parse(output);
        if (parsed && typeof parsed === 'object') return parsed;
    } catch {
        return null;
    }
    return null;
}

export function OpsAutopilotPanel() {
    const [runs, setRuns] = useState<AutopilotRun[]>([]);
    const [loading, setLoading] = useState(false);
    const [firing, setFiring] = useState<'quick' | 'full' | 'maint' | 'maint_off' | 'emergency' | null>(null);

    const loadRuns = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('ghost_bridge')
                .select('id, command, status, output, created_at')
                .in('command', ['sys:autopilot', 'sys:autopilot_full', 'sys:maintenance_window', 'sys:maintenance_exit', 'sys:emergency_recover'])
                .order('created_at', { ascending: false })
                .limit(8);

            setRuns((data as AutopilotRun[]) || []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRuns();
        const channel = supabase
            .channel('nexus_autopilot_runs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ghost_bridge' }, () => {
                loadRuns();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadRuns]);

    const trigger = useCallback(async (mode: 'quick' | 'full') => {
        if (firing) return;
        setFiring(mode);
        try {
            await supabase.from('ghost_bridge').insert({
                command: mode === 'full' ? 'sys:autopilot_full' : 'sys:autopilot',
                source: 'nexus_ops_autopilot',
                status: 'pending'
            });
            await loadRuns();
        } finally {
            setFiring(null);
        }
    }, [firing, loadRuns]);

    const triggerMaintenance = useCallback(async (mode: 'maint' | 'maint_off') => {
        if (firing) return;
        setFiring(mode);
        try {
            await supabase.from('ghost_bridge').insert({
                command: mode === 'maint' ? 'sys:maintenance_window' : 'sys:maintenance_exit',
                source: 'nexus_ops_autopilot',
                status: 'pending'
            });
            await loadRuns();
        } finally {
            setFiring(null);
        }
    }, [firing, loadRuns]);

    const triggerEmergency = useCallback(async () => {
        if (firing) return;
        setFiring('emergency');
        try {
            await supabase.from('ghost_bridge').insert({
                command: 'sys:emergency_recover',
                source: 'nexus_ops_autopilot',
                status: 'pending'
            });
            await loadRuns();
        } finally {
            setFiring(null);
        }
    }, [firing, loadRuns]);

    const latest = useMemo(() => runs[0] || null, [runs]);
    const latestSummary = parseSummary(latest?.output || null);

    return (
        <NeuralSurface variant="glass" className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10">
                        <Bot size={16} className="text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Ops Autopilot</h3>
                        <p className="text-[11px] text-white/40">Self-heal lint, service, database and readiness health</p>
                    </div>
                </div>
                <button type="button"
                    onClick={loadRuns}
                    className="p-2 rounded-lg border border-white/10 hover:border-white/30 text-white/50 hover:text-white transition-colors"
                    aria-label="Refresh Autopilot Runs"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button type="button"
                    onClick={() => trigger('quick')}
                    disabled={Boolean(firing)}
                    className="h-11 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                >
                    {firing === 'quick' ? 'Running...' : 'Run Quick Heal'}
                </button>
                <button type="button"
                    onClick={() => trigger('full')}
                    disabled={Boolean(firing)}
                    className="h-11 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                >
                    {firing === 'full' ? 'Running...' : 'Run Full Heal'}
                </button>
                <button type="button"
                    onClick={() => triggerMaintenance('maint')}
                    disabled={Boolean(firing)}
                    className="h-11 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                >
                    {firing === 'maint' ? 'Starting...' : 'Start Maintenance'}
                </button>
                <button type="button"
                    onClick={() => triggerMaintenance('maint_off')}
                    disabled={Boolean(firing)}
                    className="h-11 rounded-lg border border-slate-500/30 bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                >
                    {firing === 'maint_off' ? 'Stopping...' : 'Stop Maintenance'}
                </button>
                <button type="button"
                    onClick={triggerEmergency}
                    disabled={Boolean(firing)}
                    className="h-11 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50 sm:col-span-2"
                >
                    {firing === 'emergency' ? 'Recovering...' : 'Emergency Recover'}
                </button>
            </div>

            {latest && (
                <div className="rounded-lg border border-white/10 bg-black/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/45 uppercase tracking-[0.2em]">Latest Run</span>
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] border uppercase tracking-widest', statusTone(latest.status))}>
                            {latest.status}
                        </span>
                    </div>
                    <div className="text-[11px] text-white/65 font-mono">
                        {new Date(latest.created_at).toLocaleString()}
                    </div>
                    {latestSummary?.summary?.healthScore != null && (
                        <div className="text-sm font-black text-cyan-300">Health Score: {latestSummary.summary.healthScore}</div>
                    )}
                    {latestSummary?.summary?.failedChecks?.length > 0 && (
                        <div className="text-[11px] text-rose-300">
                            Failed: {latestSummary.summary.failedChecks.join(', ')}
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {runs.length === 0 && (
                    <div className="text-xs text-white/35 border border-dashed border-white/10 rounded-lg p-3">
                        No autopilot runs found.
                    </div>
                )}
                {runs.map((run) => {
                    const parsed = parseSummary(run.output);
                    return (
                        <div key={run.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-white/70 font-bold uppercase tracking-wider">{run.command.replace('sys:', '')}</span>
                                <span className={cn('px-2 py-0.5 rounded-full text-[10px] border uppercase tracking-widest', statusTone(run.status))}>
                                    {run.status}
                                </span>
                            </div>
                            <div className="mt-1 text-[11px] text-white/40 font-mono">{new Date(run.created_at).toLocaleTimeString()}</div>
                            {parsed?.summary?.healthScore != null && (
                                <div className="mt-2 text-[11px] text-cyan-300">score {parsed.summary.healthScore}</div>
                            )}
                            {run.command === 'sys:emergency_recover' && parsed?.maintenance && (
                                <div className="mt-2 text-[11px] text-amber-300">
                                    maintenance {parsed.maintenance.ok ? 'ok' : 'degraded'} · post-heal {parsed.postHeal?.ok ? 'ok' : 'degraded'}
                                </div>
                            )}
                            {run.status === 'failed' && (
                                <div className="mt-2 text-[11px] text-rose-300 flex items-start gap-1.5">
                                    <AlertTriangle size={12} className="mt-0.5" />
                                    <span className="line-clamp-2">{run.output || 'Run failed'}</span>
                                </div>
                            )}
                            {run.status === 'executed' && (
                                <div className="mt-2 text-[11px] text-emerald-300 flex items-center gap-1.5">
                                    <CheckCircle2 size={12} />
                                    <span>Completed</span>
                                </div>
                            )}
                            {(run.status === 'pending' || run.status === 'executing' || run.status === 'processing') && (
                                <div className="mt-2 text-[11px] text-cyan-300 flex items-center gap-1.5">
                                    <Clock3 size={12} />
                                    <span>In progress</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="text-[11px] text-white/35 border border-white/10 rounded-lg p-3 flex items-start gap-2">
                <Wrench size={12} className="mt-0.5 text-white/50" />
                <span>Use quick for remote recovery, full when you can allow longer lint and readiness remediation.</span>
            </div>
        </NeuralSurface>
    );
}
