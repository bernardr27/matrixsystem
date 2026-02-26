'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Activity, CheckCircle2, XCircle, Clock, Database,
    HardDrive, FileText, AlertTriangle, Wrench, Power, Loader2,
    Zap, RefreshCw, X, CircleCheck, CircleX, SkipForward,
    Search, Shield, ArrowRight, RotateCcw, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import { RocketSurface, RocketButton } from '@/components/ui/RocketSurface';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/Toast';

/*  ═══════════════════════════════════════════════════════
    SAGE HEALTH v3.0 — RocketCommand Dashboard Widget
    Upgraded: live fix progress, verification scan, enhanced UI
    ═══════════════════════════════════════════════════════ */

interface SageData {
    timestamp: string;
    overall: string;
    services: Record<string, { port: number; status: string; latency: number }>;
    ollama: { status: string; latency: number };
    dependencies: { name: string; nodeModules: boolean; lockFile: boolean }[];
    builds: { name: string; hasBuild: boolean }[];
    logs: { count: number; recent: { file: string; line: number; text: string }[] };
    prds: { file: string; total: number; done: number; remaining: number }[];
    protocols: {
        ralph: string;
        sage: string;
        pipeline: string;
    };
}

interface CategorizedIssue {
    category: string;
    fixAction: string;
    count: number;
    samples: string[];
    severity: 'critical' | 'warning' | 'info';
}

interface FixResult {
    action: string;
    status: 'success' | 'failed' | 'skipped';
    detail: string;
}

// Fix pipeline phases
type FixPhase = 'idle' | 'scanning' | 'fixing' | 'verifying' | 'complete';

interface FixProgress {
    phase: FixPhase;
    currentAction: string;
    completedActions: FixResult[];
    totalActions: number;
    completedCount: number;
    verifyResult?: { before: number; after: number; fixed: number };
}

function HealthDot({ ok }: { ok: boolean }) {
    return (
        <div className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            ok
                ? "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]"
                : "bg-red-400 shadow-[0_0_4px_rgba(248,113,113,0.5)]"
        )} />
    );
}

function PhaseIndicator({ phase, label, isActive, isDone }: { phase: string; label: string; isActive: boolean; isDone: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300",
                isDone ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" :
                isActive ? "bg-orange-500/20 border-orange-500/40 text-orange-400 animate-pulse" :
                "bg-white/[0.03] border-white/[0.06] text-white/20"
            )}>
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                 isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                 <span>{phase}</span>}
            </div>
            <span className={cn(
                "text-[11px] font-medium transition-colors",
                isDone ? "text-emerald-400/70" : isActive ? "text-orange-400" : "text-white/20"
            )}>{label}</span>
        </div>
    );
}

export function SageHealth() {
    const [data, setData] = useState<SageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState('');
    const [ollamaLoading, setOllamaLoading] = useState(false);
    const [issueModalOpen, setIssueModalOpen] = useState(false);
    const [issueCategories, setIssueCategories] = useState<CategorizedIssue[]>([]);
    const [issuesLoading, setIssuesLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Enhanced fix state
    const [fixProgress, setFixProgress] = useState<FixProgress>({
        phase: 'idle',
        currentAction: '',
        completedActions: [],
        totalActions: 0,
        completedCount: 0,
    });
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const abortRef = useRef(false);

    const toast = useToast();

    const isBusy = fixProgress.phase !== 'idle' && fixProgress.phase !== 'complete';

    const fetchSage = useCallback(async (silent = false) => {
        if (!silent) setRefreshing(true);
        try {
            const res = await fetch('/api/sage-check');
            const json = await res.json();
            setData(json);
            setLastUpdate(new Date().toLocaleTimeString());
        } catch {
            if (!silent) toast.error('Failed to fetch Sage health data');
        }
        setLoading(false);
        setRefreshing(false);
    }, [toast]);

    useEffect(() => {
        fetchSage(true);
        const iv = setInterval(() => fetchSage(true), 20000);
        return () => clearInterval(iv);
    }, [fetchSage]);

    const toggleOllama = useCallback(async () => {
        if (!data || ollamaLoading) return;
        const isRunning = data.ollama?.status === 'up';
        const action = isRunning ? 'stop' : 'start';

        setOllamaLoading(true);
        try {
            const res = await fetch('/api/ollama', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            const result = await res.json();
            toast.success(result.message || (action === 'start' ? 'Ollama started' : 'Ollama stopped'));
            setTimeout(() => fetchSage(true), 1000);
        } catch {
            toast.error(`Failed to ${action} Ollama`);
        }
        setOllamaLoading(false);
    }, [data, ollamaLoading, fetchSage, toast]);

    // ── Scan for issues ──
    const scanIssues = useCallback(async (): Promise<CategorizedIssue[]> => {
        setIssuesLoading(true);
        try {
            const res = await fetch('/api/fix-issues');
            const json = await res.json();
            const issues = json.issues || [];
            setIssueCategories(issues);
            setIssuesLoading(false);
            return issues;
        } catch {
            toast.error('Failed to scan for issues');
            setIssuesLoading(false);
            return [];
        }
    }, [toast]);

    const openIssueModal = useCallback(async () => {
        setIssueModalOpen(true);
        setFixProgress({ phase: 'idle', currentAction: '', completedActions: [], totalActions: 0, completedCount: 0 });
        abortRef.current = false;
        await scanIssues();
    }, [scanIssues]);

    // ── Run fixes with live progress ──
    const runFixWithProgress = useCallback(async (actions: string[]) => {
        abortRef.current = false;
        const isAll = actions.includes('all');

        // Determine which fix actions to run
        const fixActions = isAll
            ? [...new Set(issueCategories.map(c => c.fixAction))]
            : actions;

        const totalSteps = fixActions.length;
        const allResults: FixResult[] = [];

        // Phase 1: Scanning (initial scan already done)
        setFixProgress({
            phase: 'scanning',
            currentAction: 'Analyzing issues...',
            completedActions: [],
            totalActions: totalSteps + 1, // +1 for verify
            completedCount: 0,
        });
        await new Promise(r => setTimeout(r, 400));

        // Phase 2: Fixing — run each action individually for live progress
        setFixProgress(prev => ({ ...prev, phase: 'fixing', currentAction: `Starting fixes (0/${totalSteps})...` }));

        for (let i = 0; i < fixActions.length; i++) {
            if (abortRef.current) break;
            const action = fixActions[i];
            const label = action.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

            setFixProgress(prev => ({
                ...prev,
                currentAction: `${label} (${i + 1}/${totalSteps})`,
                completedCount: i,
            }));

            try {
                const res = await fetch('/api/fix-issues', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ actions: [action] }),
                });
                const json = await res.json();
                const results: FixResult[] = json.results || [];
                allResults.push(...results);

                setFixProgress(prev => ({
                    ...prev,
                    completedActions: [...prev.completedActions, ...results],
                    completedCount: i + 1,
                }));
            } catch {
                const errResult: FixResult = { action: label, status: 'failed', detail: 'Network error' };
                allResults.push(errResult);
                setFixProgress(prev => ({
                    ...prev,
                    completedActions: [...prev.completedActions, errResult],
                    completedCount: i + 1,
                }));
            }
        }

        if (abortRef.current) {
            setFixProgress(prev => ({ ...prev, phase: 'complete', currentAction: 'Aborted by user' }));
            return;
        }

        // Phase 3: Verification — re-scan and compare
        setFixProgress(prev => ({
            ...prev,
            phase: 'verifying',
            currentAction: 'Verifying fixes — re-scanning environment...',
        }));

        // Refresh sage data
        await fetchSage(true);
        await new Promise(r => setTimeout(r, 500));

        // Re-scan issues
        const beforeCount = issueCategories.reduce((s, c) => s + c.count, 0);
        const newIssues = await scanIssues();
        const afterCount = newIssues.reduce((s, c) => s + c.count, 0);
        const fixedCount = Math.max(0, beforeCount - afterCount);

        // Phase 4: Complete
        setFixProgress(prev => ({
            ...prev,
            phase: 'complete',
            currentAction: afterCount === 0 ? 'All clear — no issues remaining!' : `${fixedCount} fixed, ${afterCount} remaining`,
            verifyResult: { before: beforeCount, after: afterCount, fixed: fixedCount },
        }));

        // Toast summary
        const succeeded = allResults.filter(r => r.status === 'success').length;
        const failed = allResults.filter(r => r.status === 'failed').length;
        if (failed > 0) {
            toast.warning('Fixes completed with errors', `${succeeded} succeeded, ${failed} failed — ${afterCount} issues remain`);
        } else if (afterCount === 0) {
            toast.success('All issues resolved!', `${succeeded} fixes applied, environment is clean`);
        } else {
            toast.success('Fixes applied', `${fixedCount} resolved, ${afterCount} remaining`);
        }
    }, [issueCategories, fetchSage, scanIssues, toast]);

    const resetProgress = useCallback(() => {
        setFixProgress({ phase: 'idle', currentAction: '', completedActions: [], totalActions: 0, completedCount: 0 });
    }, []);

    if (loading) {
        return (
            <RocketSurface className="p-5 animate-pulse">
                <div className="h-5 w-40 bg-white/5 rounded mb-4" />
                <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 bg-white/5 rounded-xl" />
                    ))}
                </div>
            </RocketSurface>
        );
    }

    if (!data) return null;

    const isHealthy = data.overall === 'HEALTHY';
    const depsOk = data.dependencies.filter(d => d.nodeModules).length;
    const buildsOk = data.builds.filter(b => b.hasBuild).length;
    const serviceEntries = Object.entries(data.services || {});
    const onlineServices = serviceEntries.filter(([, s]) => s.status === 'up').length;
    const avgLatency = serviceEntries.length > 0
        ? Math.round(serviceEntries.reduce((s, [, v]) => s + v.latency, 0) / serviceEntries.length)
        : 0;

    return (
        <RocketSurface variant="glass" className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className={cn(
                        "p-2 rounded-xl transition-colors",
                        isHealthy ? "bg-emerald-500/10" : "bg-amber-500/10"
                    )}>
                        <Shield className={cn("w-5 h-5", isHealthy ? "text-emerald-400" : "text-amber-400")} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white/80">Sage Environment</h3>
                        <p className="text-[10px] text-white/30 font-mono">{lastUpdate}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchSage(false)}
                        disabled={refreshing}
                        className="p-1.5 rounded-lg text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-all disabled:opacity-40"
                        title="Refresh environment data"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
                    </button>
                    <Tooltip content={isHealthy ? 'All systems operational' : 'Issues detected — click the Issues card to diagnose'} side="left">
                        <div className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold cursor-help",
                            isHealthy
                                ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                                : "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                        )}>
                            {data.overall}
                        </div>
                    </Tooltip>
                </div>
            </div>

            {/* Service rows */}
            <div className="space-y-1.5 mb-4">
                {serviceEntries.map(([name, svc]) => (
                    <div
                        key={name}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                    >
                        <HealthDot ok={svc.status === 'up'} />
                        <span className="text-[11px] text-white/60 flex-1">{name}</span>
                        <span className="text-[10px] text-white/25 font-mono w-10 text-right">:{svc.port}</span>
                        <span className={cn(
                            "text-[10px] font-mono w-14 text-right",
                            svc.status === 'up' ? "text-emerald-400/60" : "text-red-400/60"
                        )}>
                            {svc.latency}ms
                        </span>
                    </div>
                ))}
            </div>

            {/* Health summary strip */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.015] border border-white/[0.03] mb-4 text-[10px] font-mono text-white/30">
                <span className={cn(onlineServices === serviceEntries.length ? "text-emerald-400/60" : "text-amber-400/60")}>
                    {onlineServices}/{serviceEntries.length} online
                </span>
                <span className="text-white/10">|</span>
                <span>avg {avgLatency}ms</span>
                <span className="text-white/10">|</span>
                <span className={cn(depsOk === data.dependencies.length ? "text-emerald-400/60" : "text-amber-400/60")}>
                    {depsOk}/{data.dependencies.length} deps
                </span>
                <span className="text-white/10">|</span>
                <span className={cn(buildsOk === data.builds.length ? "text-emerald-400/60" : "text-amber-400/60")}>
                    {buildsOk}/{data.builds.length} builds
                </span>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                {/* Dependencies */}
                <div className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                    <CheckCircle2 className={cn("w-4 h-4 mx-auto mb-1", depsOk === data.dependencies.length ? "text-emerald-400" : "text-amber-400")} />
                    <p className="text-sm font-bold text-white/80">{depsOk}/{data.dependencies.length}</p>
                    <p className="text-[9px] text-white/30 uppercase tracking-wider">Deps</p>
                </div>

                {/* Builds */}
                <div className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                    <HardDrive className={cn("w-4 h-4 mx-auto mb-1", buildsOk === data.builds.length ? "text-emerald-400" : "text-amber-400")} />
                    <p className="text-sm font-bold text-white/80">{buildsOk}/{data.builds.length}</p>
                    <p className="text-[9px] text-white/30 uppercase tracking-wider">Builds</p>
                </div>

                {/* Ollama */}
                <button
                    onClick={toggleOllama}
                    disabled={ollamaLoading}
                    className={cn(
                        "px-3 py-2.5 rounded-xl border text-center transition-all group relative",
                        data.ollama?.status === 'up'
                            ? "bg-emerald-500/[0.04] border-emerald-500/15 hover:border-emerald-500/30"
                            : "bg-white/[0.02] border-white/[0.04] hover:border-orange-500/25 hover:bg-orange-500/[0.03]",
                        ollamaLoading && "opacity-70 cursor-wait"
                    )}
                    title={data.ollama?.status === 'up' ? 'Click to stop Ollama' : 'Click to start Ollama'}
                >
                    {ollamaLoading ? (
                        <Loader2 className="w-4 h-4 text-orange-400 mx-auto mb-1 animate-spin" />
                    ) : (
                        <Database className={cn(
                            "w-4 h-4 mx-auto mb-1",
                            data.ollama?.status === 'up' ? "text-emerald-400" : "text-red-400"
                        )} />
                    )}
                    <p className="text-sm font-bold text-white/80">{data.ollama?.status === 'up' ? 'ON' : 'OFF'}</p>
                    <p className="text-[9px] text-white/30 uppercase tracking-wider">Ollama</p>
                    <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Power className={cn("w-3 h-3", data.ollama?.status === 'up' ? "text-red-400" : "text-emerald-400")} />
                    </div>
                </button>

                {/* Log Issues */}
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openIssueModal(); }}
                    className={cn(
                        "px-3 py-2.5 rounded-xl border text-center transition-all group relative",
                        data.logs.count === 0
                            ? "bg-emerald-500/[0.04] border-emerald-500/15"
                            : "bg-amber-500/[0.04] border-amber-500/15 hover:border-amber-500/30 hover:bg-amber-500/[0.06]",
                        "cursor-pointer"
                    )}
                    title={data.logs.count === 0 ? 'No issues — click to scan' : `${data.logs.count} issues — click to diagnose & fix`}
                >
                    {data.logs.count === 0 ? (
                        <Search className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    )}
                    <p className="text-sm font-bold text-white/80">{data.logs.count}</p>
                    <p className="text-[9px] text-white/30 uppercase tracking-wider">Issues</p>
                    {data.logs.count > 0 && (
                        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Wrench className="w-3 h-3 text-amber-400" />
                        </div>
                    )}
                </button>
            </div>

            {/* PRD Progress + Protocols */}
            <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <div>
                        <span className="text-[11px] text-white/60 block">PRD Tracking</span>
                        <span className="text-[10px] text-white/30 font-mono">
                            {data.prds.filter(p => p.remaining > 0).length} active &middot; {data.prds.filter(p => p.remaining === 0).length} done
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <Activity className="w-3.5 h-3.5 text-orange-400" />
                    <div>
                        <span className="text-[11px] text-white/60 block">Protocols</span>
                        <span className="text-[10px] text-white/30 font-mono">
                            R:{data.protocols.ralph[0]} S:{data.protocols.sage[0]} P:{data.protocols.pipeline[0]}
                        </span>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                ISSUE DIAGNOSTICS & AUTO-FIX MODAL v3.0
               ══════════════════════════════════════════════════ */}
            {issueModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!isBusy) setIssueModalOpen(false); }}>
                    <div
                        className="bg-[#0c0c1d] border border-white/[0.08] rounded-2xl shadow-2xl w-[95vw] max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <Wrench className="w-4.5 h-4.5 text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-white">Issue Diagnostics &amp; Auto-Fix</h2>
                                    <p className="text-[10px] text-white/30 font-mono">
                                        {fixProgress.phase === 'idle' ? 'Scan → Fix → Verify pipeline' :
                                         fixProgress.phase === 'scanning' ? 'Phase 1/3 — Scanning...' :
                                         fixProgress.phase === 'fixing' ? 'Phase 2/3 — Applying fixes...' :
                                         fixProgress.phase === 'verifying' ? 'Phase 3/3 — Verifying...' :
                                         'Pipeline complete'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { if (!isBusy) setIssueModalOpen(false); }}
                                disabled={isBusy}
                                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors disabled:opacity-30"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* ── Live Progress Bar (visible during fix) ── */}
                        {isBusy && (
                            <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.01]">
                                {/* Phase indicators */}
                                <div className="flex items-center gap-4 mb-3">
                                    <PhaseIndicator phase="1" label="Scan" isActive={fixProgress.phase === 'scanning'} isDone={fixProgress.phase !== 'scanning'} />
                                    <ArrowRight className="w-3 h-3 text-white/10" />
                                    <PhaseIndicator phase="2" label="Fix" isActive={fixProgress.phase === 'fixing'} isDone={fixProgress.phase === 'verifying'} />
                                    <ArrowRight className="w-3 h-3 text-white/10" />
                                    <PhaseIndicator phase="3" label="Verify" isActive={fixProgress.phase === 'verifying'} isDone={false} />
                                </div>

                                {/* Progress bar */}
                                <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden mb-2">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500 ease-out"
                                        style={{
                                            width: fixProgress.totalActions > 0
                                                ? `${Math.round(((fixProgress.completedCount + (fixProgress.phase === 'verifying' ? 0.5 : 0)) / fixProgress.totalActions) * 100)}%`
                                                : '10%'
                                        }}
                                    />
                                </div>

                                {/* Current action text */}
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-3 h-3 text-orange-400 animate-spin flex-shrink-0" />
                                    <span className="text-[11px] text-orange-400/80 font-mono truncate">{fixProgress.currentAction}</span>
                                </div>
                            </div>
                        )}

                        {/* ── Verification Result Banner ── */}
                        {fixProgress.phase === 'complete' && fixProgress.verifyResult && (
                            <div className={cn(
                                "mx-5 mt-4 px-4 py-3 rounded-xl border flex items-center gap-3",
                                fixProgress.verifyResult.after === 0
                                    ? "bg-emerald-500/[0.06] border-emerald-500/15"
                                    : fixProgress.verifyResult.fixed > 0
                                        ? "bg-amber-500/[0.06] border-amber-500/15"
                                        : "bg-red-500/[0.06] border-red-500/15"
                            )}>
                                {fixProgress.verifyResult.after === 0 ? (
                                    <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                    <p className={cn(
                                        "text-xs font-semibold",
                                        fixProgress.verifyResult.after === 0 ? "text-emerald-400" : "text-amber-400"
                                    )}>
                                        {fixProgress.verifyResult.after === 0
                                            ? 'Environment Clean — All Issues Resolved!'
                                            : `${fixProgress.verifyResult.fixed} Issue${fixProgress.verifyResult.fixed !== 1 ? 's' : ''} Fixed — ${fixProgress.verifyResult.after} Remaining`
                                        }
                                    </p>
                                    <p className="text-[10px] text-white/30 mt-0.5 font-mono">
                                        Before: {fixProgress.verifyResult.before} &rarr; After: {fixProgress.verifyResult.after}
                                    </p>
                                </div>
                                {fixProgress.verifyResult.after > 0 && (
                                    <button
                                        onClick={() => { resetProgress(); runFixWithProgress(['all']); }}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 text-[10px] font-semibold hover:bg-amber-500/25 transition-all"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        Retry
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                            {issuesLoading && fixProgress.phase === 'idle' ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <div className="relative">
                                        <Search className="w-8 h-8 text-amber-400/30" />
                                        <Loader2 className="w-4 h-4 text-amber-400 animate-spin absolute -bottom-1 -right-1" />
                                    </div>
                                    <span className="text-sm text-white/40">Scanning environment for issues...</span>
                                    <span className="text-[10px] text-white/20 font-mono">Checking logs, services, deps, builds</span>
                                </div>
                            ) : issueCategories.length === 0 && fixProgress.phase === 'idle' ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-emerald-400/80">Environment is Clean</p>
                                    <p className="text-xs text-white/30 mt-1">No actionable issues found in log files</p>
                                    <button
                                        onClick={scanIssues}
                                        className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] text-white/40 text-xs hover:text-white/60 hover:bg-white/[0.06] transition-all mx-auto"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Re-scan
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Issue categories */}
                                    {issueCategories.map((cat, i) => {
                                        const isExpanded = expandedCategory === cat.category;
                                        const fixResult = fixProgress.completedActions.find(r => r.action.toLowerCase().includes(cat.fixAction.replace(/-/g, ' ').split(' ')[0]));
                                        return (
                                            <div key={i} className={cn(
                                                "rounded-xl border overflow-hidden transition-all duration-200",
                                                fixResult?.status === 'success' ? 'border-emerald-500/15 bg-emerald-500/[0.03]' :
                                                fixResult?.status === 'failed' ? 'border-red-500/15 bg-red-500/[0.03]' :
                                                "border-white/[0.06] bg-white/[0.02]"
                                            )}>
                                                <div
                                                    className="flex items-center gap-2.5 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                                                    onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                                                >
                                                    {/* Severity dot or result icon */}
                                                    {fixResult ? (
                                                        fixResult.status === 'success' ? <CircleCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" /> :
                                                        fixResult.status === 'failed' ? <CircleX className="w-4 h-4 text-red-400 flex-shrink-0" /> :
                                                        <SkipForward className="w-4 h-4 text-white/30 flex-shrink-0" />
                                                    ) : (
                                                        <div className={cn(
                                                            "w-2.5 h-2.5 rounded-full flex-shrink-0",
                                                            cat.severity === 'critical' ? 'bg-red-400 shadow-[0_0_4px_rgba(248,113,113,0.5)]' :
                                                            cat.severity === 'warning' ? 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)]' :
                                                            'bg-blue-400'
                                                        )} />
                                                    )}
                                                    <span className="text-xs font-semibold text-white/70 flex-1">{cat.category}</span>
                                                    <span className={cn(
                                                        "text-[10px] font-mono px-2 py-0.5 rounded-md",
                                                        cat.severity === 'critical' ? 'text-red-400/70 bg-red-500/[0.08]' :
                                                        cat.severity === 'warning' ? 'text-amber-400/70 bg-amber-500/[0.08]' :
                                                        'text-white/30 bg-white/[0.04]'
                                                    )}>
                                                        {cat.count} hit{cat.count !== 1 ? 's' : ''}
                                                    </span>

                                                    {!isBusy && !fixResult && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); runFixWithProgress([cat.fixAction]); }}
                                                            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-all"
                                                            title={`Run: ${cat.fixAction}`}
                                                        >
                                                            <Zap className="w-3 h-3" />
                                                            Fix
                                                        </button>
                                                    )}

                                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-white/20" /> : <ChevronDown className="w-3.5 h-3.5 text-white/20" />}
                                                </div>

                                                {/* Expanded samples + fix detail */}
                                                {isExpanded && (
                                                    <div className="border-t border-white/[0.04] px-4 py-2.5 space-y-1.5">
                                                        <p className="text-[9px] text-white/20 uppercase tracking-wider font-semibold mb-1">Sample log entries</p>
                                                        {cat.samples.map((s, j) => (
                                                            <p key={j} className="text-[10px] text-white/25 font-mono truncate leading-relaxed">{s}</p>
                                                        ))}
                                                        <div className="flex items-center gap-2 pt-1.5">
                                                            <span className="text-[9px] text-white/15 font-mono">Fix action:</span>
                                                            <code className="text-[9px] text-orange-400/50 bg-orange-500/[0.06] px-1.5 py-0.5 rounded">{cat.fixAction}</code>
                                                        </div>
                                                        {fixResult && (
                                                            <div className={cn(
                                                                "mt-1 px-3 py-2 rounded-lg text-[10px] font-mono",
                                                                fixResult.status === 'success' ? 'bg-emerald-500/[0.06] text-emerald-400/70' :
                                                                fixResult.status === 'failed' ? 'bg-red-500/[0.06] text-red-400/70' :
                                                                'bg-white/[0.02] text-white/30'
                                                            )}>
                                                                {fixResult.detail}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </>
                            )}

                            {/* Fix Results Log (during/after fixing) */}
                            {fixProgress.completedActions.length > 0 && fixProgress.phase !== 'idle' && (
                                <div className="mt-4 space-y-1.5">
                                    <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                        <Activity className="w-3.5 h-3.5 text-orange-400" />
                                        Fix Log ({fixProgress.completedActions.filter(r => r.status === 'success').length} passed, {fixProgress.completedActions.filter(r => r.status === 'failed').length} failed)
                                    </h4>
                                    {fixProgress.completedActions.map((r, i) => (
                                        <div key={i} className={cn(
                                            "flex items-start gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200",
                                            r.status === 'success' ? 'bg-emerald-500/[0.06] border border-emerald-500/10' :
                                            r.status === 'failed' ? 'bg-red-500/[0.06] border border-red-500/10' :
                                            'bg-white/[0.02] border border-white/[0.04]'
                                        )}>
                                            {r.status === 'success' ? <CircleCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" /> :
                                             r.status === 'failed' ? <CircleX className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" /> :
                                             <SkipForward className="w-3.5 h-3.5 text-white/30 flex-shrink-0 mt-0.5" />}
                                            <div className="flex-1 min-w-0">
                                                <span className="text-white/60 font-medium">{r.action}</span>
                                                <p className="text-white/30 font-mono text-[10px] mt-0.5 truncate">{r.detail}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
                            <span className="text-[10px] text-white/20 font-mono">
                                {issueCategories.length} categories &middot; {issueCategories.reduce((s, c) => s + c.count, 0)} total hits
                            </span>
                            <div className="flex items-center gap-2">
                                {fixProgress.phase === 'complete' && (
                                    <RocketButton
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { resetProgress(); scanIssues(); }}
                                    >
                                        <Search className="w-3.5 h-3.5 mr-1.5" />
                                        Re-scan
                                    </RocketButton>
                                )}
                                <RocketButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { if (isBusy) { abortRef.current = true; } else { setIssueModalOpen(false); } }}
                                >
                                    {isBusy ? 'Abort' : 'Close'}
                                </RocketButton>
                                {issueCategories.length > 0 && fixProgress.phase === 'idle' && (
                                    <RocketButton
                                        variant="primary"
                                        size="sm"
                                        onClick={() => runFixWithProgress(['all'])}
                                        disabled={issuesLoading}
                                    >
                                        <Zap className="w-3.5 h-3.5 mr-1.5" />
                                        Fix All &amp; Verify
                                    </RocketButton>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </RocketSurface>
    );
}
