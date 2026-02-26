'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Cpu, Server, Wifi, AlertTriangle, Database, RefreshCw, Sparkles, Shield } from 'lucide-react';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { cn } from '@/lib/utils';
import { useSage } from '@/context/SageContext';

interface DiagnosticResult {
    cpu: number;
    ram: number;
    cores: number;
    totalMemGB: number;
    freeMemGB: number;
    platform: string;
    hostname: string;
    uptime: number;
    services: Record<string, string>;
    timestamp: string;
}

export function TriagePanel() {
    const { messages, systemHealth } = useSage();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const hasSupabase = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder';

    const [logs, setLogs] = useState<{ level: 'crit' | 'warn' | 'info'; message: string; time: string }[]>([]);
    const [scanProgress, setScanProgress] = useState(0);
    const [isScanning, setIsScanning] = useState(false);
    const [lastDiag, setLastDiag] = useState<DiagnosticResult | null>(null);
    const [lastScanTime, setLastScanTime] = useState<string>('');

    // Live CPU/RAM from systemHealth context (updates every 5s from runner or heartbeat)
    const liveCpu = parseInt(systemHealth.cpu) || 0;
    const liveRam = parseInt(systemHealth.ram) || 0;

    // Use diagnostic data when fresh (< 30s), otherwise fall back to live context
    const diagFresh = lastDiag && (Date.now() - new Date(lastDiag.timestamp).getTime()) < 30000;
    const displayCpu = diagFresh ? lastDiag!.cpu : liveCpu;
    const displayRam = diagFresh ? lastDiag!.ram : liveRam;

    // Ingest sage messages into log feed
    useEffect(() => {
        if (!messages.length) return;
        const latest = messages[messages.length - 1];
        const time = new Date(latest.timestamp).toLocaleTimeString();
        const content = latest.content.length > 80 ? latest.content.substring(0, 80) + '...' : latest.content;
        setLogs(prev => [{
            level: 'info' as const,
            message: `[${latest.role.toUpperCase()}] ${content}`,
            time,
        }, ...prev].slice(0, 50));
    }, [messages]);

    // Real-time health alerts
    useEffect(() => {
        if (systemHealth.networkLatency > 200) {
            setLogs(prev => [{
                level: 'warn' as const,
                message: `High latency detected: ${systemHealth.networkLatency}ms`,
                time: new Date().toLocaleTimeString(),
            }, ...prev].slice(0, 50));
        }
    }, [systemHealth.networkLatency]);

    useEffect(() => {
        if (!systemHealth.online && systemHealth.lastHeartbeat > 0) {
            setLogs(prev => [{
                level: 'crit' as const,
                message: `System offline - no heartbeat for ${Math.round((Date.now() - systemHealth.lastHeartbeat) / 1000)}s`,
                time: new Date().toLocaleTimeString(),
            }, ...prev].slice(0, 50));
        }
    }, [systemHealth.online, systemHealth.lastHeartbeat]);

    // Real diagnostic scan - hits /api/health for actual system data
    const runDiagnostic = useCallback(async () => {
        if (isScanning) return;
        setIsScanning(true);
        setScanProgress(0);

        const ts = new Date().toLocaleTimeString();
        setLogs(prev => [{
            level: 'info' as const,
            message: '[DIAG] Initiating full system diagnostic scan...',
            time: ts,
        }, ...prev].slice(0, 50));

        // Animate progress bar while fetching
        const progressInterval = setInterval(() => {
            setScanProgress(prev => Math.min(prev + 3, 85));
        }, 100);

        try {
            const res = await fetch('/api/health', { cache: 'no-store' });
            if (!res.ok) throw new Error(`Health API returned ${res.status}`);
            const data = await res.json();

            clearInterval(progressInterval);
            setScanProgress(95);

            const diag: DiagnosticResult = {
                cpu: data.system?.cpu ?? 0,
                ram: data.system?.ram ?? 0,
                cores: data.system?.cores ?? 0,
                totalMemGB: data.system?.totalMemGB ?? 0,
                freeMemGB: data.system?.freeMemGB ?? 0,
                platform: data.system?.platform ?? 'unknown',
                hostname: data.system?.hostname ?? 'unknown',
                uptime: data.uptime ?? 0,
                services: data.services ?? {},
                timestamp: data.timestamp ?? new Date().toISOString(),
            };
            setLastDiag(diag);
            setLastScanTime(new Date().toLocaleTimeString());

            const svcEntries = Object.entries(diag.services);
            const onlineCount = svcEntries.filter(([, v]) => v === 'online').length;
            const offlineServices = svcEntries.filter(([, v]) => v !== 'online').map(([k]) => k);

            setLogs(prev => [
                ...(offlineServices.length > 0 ? [{
                    level: 'warn' as const,
                    message: `[DIAG] Offline: ${offlineServices.join(', ')}`,
                    time: ts,
                }] : []),
                {
                    level: diag.cpu > 80 ? 'warn' as const : 'info' as const,
                    message: `[DIAG] CPU: ${diag.cpu}% | RAM: ${diag.ram}% | Cores: ${diag.cores} | ${diag.platform}`,
                    time: ts,
                },
                {
                    level: 'info' as const,
                    message: `[DIAG] Services: ${onlineCount}/${svcEntries.length} online | Host: ${diag.hostname}`,
                    time: ts,
                },
                {
                    level: 'info' as const,
                    message: `[DIAG] Complete - system ${diag.cpu > 90 || diag.ram > 90 ? 'DEGRADED' : 'NOMINAL'}`,
                    time: ts,
                },
                ...prev,
            ].slice(0, 50));

            setScanProgress(100);
            setTimeout(() => setIsScanning(false), 500);
        } catch (err: unknown) {
            clearInterval(progressInterval);
            setScanProgress(0);
            setIsScanning(false);
            setLogs(prev => [{
                level: 'crit' as const,
                message: `[DIAG] Scan failed: ${err instanceof Error ? err.message : String(err)}`,
                time: ts,
            }, ...prev].slice(0, 50));
        }
    }, [isScanning]);

    const handleRepairSystem = useCallback(() => {
        setLastDiag(null);
        setLogs(prev => [{
            level: 'warn' as const,
            message: '[REPAIR] Diagnostic cache cleared. Run a fresh scan.',
            time: new Date().toLocaleTimeString(),
        }, ...prev].slice(0, 50));
    }, []);

    // Derive service statuses from real data
    const isDbOnline = lastDiag?.services?.reflect === 'online' || hasSupabase;
    const isApiOnline = hasSupabase;
    const isRunnerOnline = lastDiag?.services?.runner === 'online' || systemHealth.ai_status === 'ONLINE';

    // --- New Action Handlers ---
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isAutoHealing, setIsAutoHealing] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isPurging, setIsPurging] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    // Helper for action feedback
    const actionLog = (msg: string, level: 'info' | 'warn' | 'crit' = 'info') => {
        setLogs(prev => [{
            level,
            message: msg,
            time: new Date().toLocaleTimeString(),
        }, ...prev].slice(0, 50));
    };

    // Upgrade
    const handleUpgrade = useCallback(async () => {
        if (isUpgrading) return;
        setIsUpgrading(true);
        actionLog('[UPGRADE] Initiating upgrade...');
        try {
            const res = await fetch('/api/upgrade', { method: 'POST' });
            if (!res.ok) throw new Error(`Upgrade API returned ${res.status}`);
            const data = await res.json();
            actionLog(`[UPGRADE] ${data.status || 'Upgrade complete.'}`);
        } catch (err: unknown) {
            actionLog(`[UPGRADE] Failed: ${err instanceof Error ? err.message : String(err)}`, 'crit');
        }
        setIsUpgrading(false);
    }, [isUpgrading]);

    // Optimize
    const handleOptimize = useCallback(async () => {
        if (isOptimizing) return;
        setIsOptimizing(true);
        actionLog('[OPTIMIZE] Optimizing system...');
        try {
            const res = await fetch('/api/optimize', { method: 'POST' });
            if (!res.ok) throw new Error(`Optimize API returned ${res.status}`);
            const data = await res.json();
            actionLog(`[OPTIMIZE] ${data.status || 'Optimization complete.'}`);
        } catch (err: unknown) {
            actionLog(`[OPTIMIZE] Failed: ${err instanceof Error ? err.message : String(err)}`, 'crit');
        }
        setIsOptimizing(false);
    }, [isOptimizing]);

    // Suggest Improvements
    const handleSuggest = useCallback(async () => {
        if (isSuggesting) return;
        setIsSuggesting(true);
        actionLog('[SUGGEST] Scanning for improvements...');
        try {
            const res = await fetch('/api/suggest', { method: 'POST' });
            if (!res.ok) throw new Error(`Suggest API returned ${res.status}`);
            const data = await res.json();
            if (Array.isArray(data.suggestions)) {
                setSuggestions(data.suggestions);
                actionLog(`[SUGGEST] ${data.suggestions.length} improvement(s) found.`);
            } else {
                setSuggestions([]);
                actionLog('[SUGGEST] No suggestions found.', 'warn');
            }
        } catch (err: unknown) {
            setSuggestions([]);
            actionLog(`[SUGGEST] Failed: ${err instanceof Error ? err.message : String(err)}`, 'crit');
        }
        setIsSuggesting(false);
    }, [isSuggesting]);

    // Confirm Fix
    const handleConfirm = useCallback(async () => {
        if (isConfirming) return;
        setIsConfirming(true);
        actionLog('[CONFIRM] Confirming fixes...');
        try {
            const res = await fetch('/api/confirm', { method: 'POST' });
            if (!res.ok) throw new Error(`Confirm API returned ${res.status}`);
            const data = await res.json();
            actionLog(`[CONFIRM] ${data.status || 'Confirmation complete.'}`);
        } catch (err: unknown) {
            actionLog(`[CONFIRM] Failed: ${err instanceof Error ? err.message : String(err)}`, 'crit');
        }
        setIsConfirming(false);
    }, [isConfirming]);

    // Ralph Auto-Heal
    const handleAutoHeal = useCallback(async () => {
        if (isAutoHealing) return;
        setIsAutoHealing(true);
        actionLog('[RALPH] Initiating autonomous system healing...', 'warn');
        try {
            const res = await fetch('/api/ralph/fix', {
                method: 'POST',
                body: JSON.stringify({ action: 'auto-heal' })
            });
            if (!res.ok) throw new Error(`Ralph API returned ${res.status}`);
            actionLog('[RALPH] Autonomous repair request dispatched.');
        } catch (err: unknown) {
            actionLog(`[RALPH] Auto-Heal failed: ${err instanceof Error ? err.message : String(err)}`, 'crit');
        }
        setIsAutoHealing(false);
    }, [isAutoHealing]);

    // Ralph Simulate
    const handleSimulate = useCallback(async () => {
        if (isSimulating) return;
        setIsSimulating(true);
        actionLog('[RALPH] Running predictive shadow simulation...', 'info');
        try {
            const res = await fetch('/api/ralph/fix', {
                method: 'POST',
                body: JSON.stringify({ action: 'simulate' })
            });
            if (!res.ok) throw new Error(`Ralph API returned ${res.status}`);
            actionLog('[RALPH] Simulation dispatched. Awaiting shadow fragment verification.');
        } catch (err: unknown) {
            actionLog(`[RALPH] Simulation failed: ${err instanceof Error ? err.message : String(err)}`, 'crit');
        }
        setIsSimulating(false);
    }, [isSimulating]);

    // Ralph Purge Shadows
    const handlePurgeShadows = useCallback(async () => {
        if (isPurging) return;
        setIsPurging(true);
        actionLog('[RALPH] Purging shadow fragments...', 'info');
        try {
            const res = await fetch('/api/ralph/fix', {
                method: 'POST',
                body: JSON.stringify({ action: 'purge' })
            });
            if (!res.ok) throw new Error(`Ralph API returned ${res.status}`);
            actionLog('[RALPH] Shadow purge complete. Source integrity restored.');
        } catch (err: unknown) {
            actionLog(`[RALPH] Purge failed: ${err instanceof Error ? err.message : String(err)}`, 'crit');
        }
        setIsPurging(false);
    }, [isPurging]);

    return (
        <div className="flex flex-col h-full bg-[#0a0f1a] p-3 sm:p-4 lg:p-6 text-xs font-mono relative overflow-auto text-cyan-400">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.05)_0%,transparent_50%)]" />

            {/* HEADER */}
            <div className="flex items-center justify-between mb-6 sm:mb-8 z-10 gap-3 flex-wrap">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <div className="p-2 sm:p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex-shrink-0">
                        <Activity size={18} className="text-cyan-400 sm:block hidden" />
                        <Activity size={14} className="text-cyan-400 sm:hidden" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl font-bold tracking-widest text-white uppercase truncate">System Triage</h1>
                        <p className="text-[9px] sm:text-[10px] text-cyan-500/60 uppercase tracking-[0.2em]">
                            {lastScanTime ? `Last scan: ${lastScanTime}` : 'Diagnostics & Repair'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <button type="button"
                        onClick={handleAutoHeal}
                        disabled={isAutoHealing}
                        className={cn(
                            "px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-lg border text-[8px] sm:text-xs font-bold uppercase tracking-widest transition-all flex-shrink-0 flex items-center gap-2",
                            isAutoHealing
                                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 cursor-not-allowed"
                                : "bg-emerald-500 text-black hover:bg-emerald-400 border-transparent shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse"
                        )}
                    >
                        <Shield size={14} className={isAutoHealing ? "animate-spin" : ""} />
                        {isAutoHealing ? 'Healing...' : 'Auto-Heal'}
                    </button>
                    <button type="button"
                        onClick={handleSimulate}
                        disabled={isSimulating}
                        className={cn(
                            "px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg border text-[8px] sm:text-xs font-bold uppercase tracking-widest transition-all flex-shrink-0 flex items-center gap-2",
                            isSimulating
                                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 cursor-not-allowed"
                                : "bg-black/60 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500"
                        )}
                    >
                        <Activity size={14} className={isSimulating ? "animate-spin" : ""} />
                        {isSimulating ? 'Simulating...' : 'Scan & Simulate'}
                    </button>
                    <button type="button"
                        onClick={handlePurgeShadows}
                        disabled={isPurging}
                        className={cn(
                            "px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg border text-[8px] sm:text-xs font-bold uppercase tracking-widest transition-all flex-shrink-0 flex items-center gap-2",
                            isPurging
                                ? "bg-red-500/20 border-red-500/40 text-red-300 cursor-not-allowed"
                                : "bg-black/60 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500"
                        )}
                    >
                        <RefreshCw size={14} className={isPurging ? "animate-spin" : ""} />
                        {isPurging ? 'Purging...' : 'Purge Shadows'}
                    </button>
                    {!systemHealth.online && (
                        <span className="text-[8px] sm:text-[9px] font-black tracking-[0.35em] uppercase text-amber-300/80 border border-amber-500/30 bg-amber-500/10 px-2 sm:px-3 py-1 rounded-full">
                            OFFLINE
                        </span>
                    )}
                    <button type="button"
                        onClick={runDiagnostic}
                        disabled={isScanning}
                        className={cn(
                            "px-2 sm:px-6 py-1.5 sm:py-2.5 rounded-lg border text-[8px] sm:text-xs font-bold uppercase tracking-widest transition-all flex-shrink-0 flex items-center gap-2",
                            isScanning
                                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 cursor-not-allowed"
                                : "bg-cyan-500 text-black hover:bg-cyan-400 border-transparent shadow-lg shadow-cyan-500/20"
                        )}
                    >
                        <RefreshCw size={12} className={isScanning ? "animate-spin" : ""} />
                        {isScanning ? `Scan ${scanProgress}%` : 'Diagnostics'}
                    </button>
                    <button type="button"
                        onClick={handleUpgrade}
                        disabled={isUpgrading}
                        className={cn(
                            "px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border text-[8px] sm:text-xs font-bold uppercase tracking-widest transition-all flex-shrink-0 flex items-center gap-2",
                            isUpgrading
                                ? "bg-amber-500/20 border-amber-500/40 text-amber-300 cursor-not-allowed"
                                : "bg-amber-500 text-black hover:bg-amber-400 border-transparent shadow-lg shadow-amber-500/20"
                        )}
                    >
                        <Zap size={12} className={isUpgrading ? "animate-spin" : ""} />
                        {isUpgrading ? 'Upgrading...' : 'Upgrade'}
                    </button>
                    <button type="button"
                        onClick={handleOptimize}
                        disabled={isOptimizing}
                        className={cn(
                            "px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border text-[8px] sm:text-xs font-bold uppercase tracking-widest transition-all flex-shrink-0 flex items-center gap-2",
                            isOptimizing
                                ? "bg-purple-500/20 border-purple-500/40 text-purple-300 cursor-not-allowed"
                                : "bg-purple-500 text-black hover:bg-purple-400 border-transparent shadow-lg shadow-purple-500/20"
                        )}
                    >
                        <Cpu size={12} className={isOptimizing ? "animate-spin" : ""} />
                        {isOptimizing ? 'Optimizing...' : 'Optimize'}
                    </button>
                    <button type="button"
                        onClick={handleSuggest}
                        disabled={isSuggesting}
                        className={cn(
                            "px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border text-[8px] sm:text-xs font-bold uppercase tracking-widest transition-all flex-shrink-0 flex items-center gap-2",
                            isSuggesting
                                ? "bg-green-500/20 border-green-500/40 text-green-300 cursor-not-allowed"
                                : "bg-green-500 text-black hover:bg-green-400 border-transparent shadow-lg shadow-green-500/20"
                        )}
                    >
                        <Sparkles size={12} className={isSuggesting ? "animate-spin" : ""} />
                        {isSuggesting ? 'Suggesting...' : 'Suggest Improvements'}
                    </button>
                    <button type="button"
                        onClick={handleConfirm}
                        disabled={isConfirming}
                        className={cn(
                            "px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border text-[8px] sm:text-xs font-bold uppercase tracking-widest transition-all flex-shrink-0 flex items-center gap-2",
                            isConfirming
                                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 cursor-not-allowed"
                                : "bg-cyan-500 text-black hover:bg-cyan-400 border-transparent shadow-lg shadow-cyan-500/20"
                        )}
                    >
                        <Shield size={12} className={isConfirming ? "animate-spin" : ""} />
                        {isConfirming ? 'Confirming...' : 'Confirm Fix'}
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 z-10 overflow-auto">
                {/* SYSTEM HEALTH */}
                <NeuralSurface className="p-4 sm:p-6 bg-black/40 backdrop-blur-md space-y-6 border-none rounded-lg">
                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                        <Cpu size={14} /> Core Metrics
                        {systemHealth.online && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    </h3>

                    <div className="space-y-4">
                        <MetricBar label="CPU Load" value={displayCpu} max={100} unit="%" />
                        <MetricBar label="Memory Usage" value={displayRam} max={100} unit="%" />
                        <MetricBar label="Network Latency" value={systemHealth.networkLatency || 0} max={500} unit="ms" />
                        <MetricBar label="Active Models" value={systemHealth.models || 0} max={10} unit="" />
                    </div>

                    {lastDiag && (
                        <div className="grid grid-cols-2 gap-2 text-[9px] text-white/40 border-t border-white/5 pt-3">
                            <span>Cores: <span className="text-cyan-400">{lastDiag.cores}</span></span>
                            <span>Platform: <span className="text-cyan-400">{lastDiag.platform}</span></span>
                            <span>Total RAM: <span className="text-cyan-400">{lastDiag.totalMemGB} GB</span></span>
                            <span>Free RAM: <span className="text-cyan-400">{lastDiag.freeMemGB} GB</span></span>
                            <span>Host: <span className="text-cyan-400">{lastDiag.hostname}</span></span>
                            <span>Uptime: <span className="text-cyan-400">{Math.floor(lastDiag.uptime / 60)}m</span></span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <StatusBox icon={Database} label="Postgres" status={isDbOnline ? 'operational' : 'degraded'} />
                        <StatusBox icon={Server} label="API Gateway" status={isApiOnline ? 'operational' : 'degraded'} />
                        <StatusBox icon={Wifi} label="Uplink" status={systemHealth.online ? 'operational' : 'down'} />
                        <StatusBox icon={Zap} label="AI Engine" status={isRunnerOnline ? 'operational' : (systemHealth.ai_status === 'OFF' ? 'down' : 'degraded')} />
                    </div>
                </NeuralSurface>

                {/* SYSTEM ACTIVITY LOG & SUGGESTIONS */}
                <NeuralSurface className="p-4 sm:p-6 bg-black/40 backdrop-blur-md flex flex-col border-none rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                            <AlertTriangle size={14} /> System Activity
                        </h3>
                        <button type="button"
                            onClick={() => setLogs([])}
                            className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-all"
                        >
                            Clear
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {logs.length === 0 && (
                            <div className="text-center text-white/20 py-10 italic">
                                {systemHealth.online ? 'Run a diagnostic scan to begin...' : 'System offline.'}
                            </div>
                        )}
                        {logs.map((log, i) => (
                            <AlertCard key={`${log.time}-${i}`} level={log.level} message={log.message} time={log.time} />
                        ))}
                        {/* --- Creative Suggestions --- */}
                        {suggestions.length > 0 && (
                            <div className="mt-6">
                                <h4 className="text-xs font-bold text-green-400 uppercase mb-2">Creative Suggestions</h4>
                                <ul className="list-disc pl-5 text-green-300 text-[11px] space-y-1">
                                    {suggestions.map((s, i) => (
                                        <li key={i}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex gap-2 pt-4 border-t border-white/5 flex-wrap">
                        <button type="button"
                            onClick={handleRepairSystem}
                            className="flex-1 px-3 py-2 text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/30 rounded hover:bg-amber-500/30 transition-all text-amber-300"
                        >
                            Reset Cache
                        </button>
                        <button type="button"
                            onClick={runDiagnostic}
                            disabled={isScanning}
                            className="flex-1 px-3 py-2 text-[9px] font-bold uppercase tracking-wider bg-cyan-500/20 border border-cyan-500/30 rounded hover:bg-cyan-500/30 transition-all text-cyan-300 disabled:opacity-50"
                        >
                            {isScanning ? 'Scanning...' : 'Re-scan'}
                        </button>
                        <button type="button"
                            onClick={handleUpgrade}
                            disabled={isUpgrading}
                            className="flex-1 px-3 py-2 text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/30 rounded hover:bg-amber-500/30 transition-all text-amber-300 disabled:opacity-50"
                        >
                            {isUpgrading ? 'Upgrading...' : 'Upgrade'}
                        </button>
                        <button type="button"
                            onClick={handleOptimize}
                            disabled={isOptimizing}
                            className="flex-1 px-3 py-2 text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 border border-purple-500/30 rounded hover:bg-purple-500/30 transition-all text-purple-300 disabled:opacity-50"
                        >
                            {isOptimizing ? 'Optimizing...' : 'Optimize'}
                        </button>
                        <button type="button"
                            onClick={handleSuggest}
                            disabled={isSuggesting}
                            className="flex-1 px-3 py-2 text-[9px] font-bold uppercase tracking-wider bg-green-500/20 border border-green-500/30 rounded hover:bg-green-500/30 transition-all text-green-300 disabled:opacity-50"
                        >
                            {isSuggesting ? 'Suggesting...' : 'Suggest Improvements'}
                        </button>
                        <button type="button"
                            onClick={handleConfirm}
                            disabled={isConfirming}
                            className="flex-1 px-3 py-2 text-[9px] font-bold uppercase tracking-wider bg-cyan-500/20 border border-cyan-500/30 rounded hover:bg-cyan-500/30 transition-all text-cyan-300 disabled:opacity-50"
                        >
                            {isConfirming ? 'Confirming...' : 'Confirm Fix'}
                        </button>
                    </div>
                </NeuralSurface>
            </div>
        </div>
    );
}

function MetricBar({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) {
    const percentage = Math.min((value / max) * 100, 100);
    return (
        <div>
            <div className="flex justify-between mb-1.5 text-[10px] uppercase font-bold tracking-wider">
                <span className="text-white/60">{label}</span>
                <span className="text-cyan-400">{value}{unit}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ type: 'spring', stiffness: 50 }}
                    className={cn(
                        "h-full rounded-full shadow-[0_0_10px_currentColor]",
                        percentage > 80 ? "bg-red-500" : percentage > 50 ? "bg-amber-500" : "bg-cyan-500"
                    )}
                />
            </div>
        </div>
    );
}

function StatusBox({ icon: Icon, label, status }: { icon: any; label: string; status: 'operational' | 'degraded' | 'down' }) {
    return (
        <div className={cn(
            "p-2 sm:p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all group hover:bg-white/5",
            status === 'operational' ? "border-emerald-500/20 bg-emerald-500/5" :
                status === 'degraded' ? "border-amber-500/20 bg-amber-500/5" : "border-red-500/20 bg-red-500/5"
        )}>
            <Icon size={16} className={cn(
                status === 'operational' ? "text-emerald-400" :
                    status === 'degraded' ? "text-amber-400" : "text-red-400"
            )} />
            <span className="text-[8px] font-bold text-white uppercase tracking-wider text-center">{label}</span>
            <span className={cn(
                "px-1.5 py-0.5 rounded text-[7px] font-bold uppercase",
                status === 'operational' ? "bg-emerald-500/10 text-emerald-400" :
                    status === 'degraded' ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
            )}>
                {status}
            </span>
        </div>
    );
}

function AlertCard({ level, message, time }: { level: 'crit' | 'warn' | 'info'; message: string; time: string }) {
    return (
        <div className={cn(
            "p-3 rounded-lg border flex gap-3 transition-colors",
            level === 'crit' ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40" :
                level === 'warn' ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40" :
                    "bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40"
        )}>
            <div className={cn(
                "w-1 h-full rounded-full shrink-0",
                level === 'crit' ? "bg-red-500" : level === 'warn' ? "bg-amber-500" : "bg-blue-500"
            )} />
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                    <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider",
                        level === 'crit' ? "text-red-400" : level === 'warn' ? "text-amber-400" : "text-blue-400"
                    )}>
                        {level === 'crit' ? 'Critical' : level === 'warn' ? 'Warning' : 'Info'}
                    </span>
                    <span className="text-[9px] text-white/30">{time}</span>
                </div>
                <p className="text-[10px] text-white/70 leading-relaxed font-mono">{message}</p>
            </div>
        </div>
    );
}


