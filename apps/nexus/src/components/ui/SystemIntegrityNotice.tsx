'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, RefreshCw, Power, AlertTriangle, Zap, Activity, Info, Copy, Check } from 'lucide-react';
import { useTelemetry } from '@/components/providers/TelemetryProvider';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export function SystemIntegrityNotice() {
    const { services, lastPulse, isSyncing, refreshTelemetry, manualOverrides } = useTelemetry();
    const [isDismissed, setIsDismissed] = useState(false);
    const [isIgniting, setIsIgniting] = useState(false);
    const [handshakeFailed, setHandshakeFailed] = useState(false);
    const [copied, setCopied] = useState(false);
    const [suppressedUntil, setSuppressedUntil] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 1. Suppression logic for Sync Cool-off
    useEffect(() => {
        if (isSyncing) {
            setSuppressedUntil(Date.now() + 5000); // Hold alert for 5s after sync starts
        }
    }, [isSyncing]);

    // 1. Metabolic Auto-Resolution: Reset and unmount when system is stable
    useEffect(() => {
        const isCritical = services.nexus === 'offline';
        const isWarning = services.runner === 'offline' && services.nexus === 'online';

        const now = Date.now();
        const reflectLast = services.reflect === 'online' ? (lastPulse.reflect || 0) : now;
        const ghostLast = services.ghost === 'online' ? (lastPulse.ghost || 0) : now;
        const isDesynced = services.runner === 'online' && (now - reflectLast > 60000 || now - ghostLast > 60000);

        if (isCritical || isWarning || isDesynced) {
            setIsDismissed(false);
            if (!isIgniting) setHandshakeFailed(false);
        } else {
            // AUTO-RESOLUTION: Clear transient states to ensure alert unmounts
            setIsDismissed(false);      // Reset for next alert cycle
            setHandshakeFailed(false);  // Reset failure flag
            setIsIgniting(false);       // Stop verification loop
        }
    }, [services.nexus, services.runner, services.reflect, services.ghost, services.gate, isIgniting, lastPulse.reflect, lastPulse.ghost]);

    // 2. Handshake Verification: Robustly check for ignition success
    useEffect(() => {
        if (!isIgniting) return;

        const startCheck = Date.now();
        const checkTimer = setInterval(() => {
            if (services.nexus === 'online') {
                setIsIgniting(false);
                setHandshakeFailed(false);
                clearInterval(checkTimer);
            } else if (Date.now() - startCheck > 12000) { // High fidelity tolerance
                setIsIgniting(false);
                setHandshakeFailed(true);
                clearInterval(checkTimer);
            }
        }, 1000);

        return () => clearInterval(checkTimer);
    }, [isIgniting, services.nexus]);

    // 3. ALERT GRACE PERIOD: 
    // To prevent "flicker alerts" during telemetry cycling, we only show
    // the alert if the critical state persists for more than 10 seconds.
    const [graceStart, setGraceStart] = useState<number | null>(null);
    const [showSafeAlert, setShowSafeAlert] = useState(false);

    const isCritical = services.nexus === 'offline';
    const isWarning = services.runner === 'offline' && services.nexus === 'online' && !(manualOverrides && manualOverrides.runner);

    const now = Date.now();
    const reflectLast = services.reflect === 'online' ? (lastPulse.reflect || 0) : now;
    const ghostLast = services.ghost === 'online' ? (lastPulse.ghost || 0) : now;
    const isDesynced = services.runner === 'online' && (now - reflectLast > 60000 || now - ghostLast > 60000);

    const hasIssue = isCritical || isWarning || isDesynced;

    useEffect(() => {
        if (!hasIssue) {
            setGraceStart(null);
            setShowSafeAlert(false);
            return;
        }

        if (!graceStart) {
            setGraceStart(Date.now());
            return;
        }

        const elapsed = Date.now() - graceStart;
        if (elapsed > 10000) { // 10s Grace Period
            setShowSafeAlert(true);
        }
    }, [hasIssue, graceStart]);

    // Suppress alert if user manually stopped the service, is actively syncing, or in grace/cool-off
    const isActuallyShowing = mounted && !isSyncing && !(manualOverrides && manualOverrides.nexus) && Date.now() >= suppressedUntil && showSafeAlert;

    if (!isActuallyShowing) return null;

    const handleMetaIgnition = async () => {

        setIsIgniting(true);
        setHandshakeFailed(false);

        try {
            // GRANULAR RESTORATION:
            // 1. If Matrix Hub (Sentinel) is Offline -> Ask Ghost Runner to spawn it ('sys:start_sentinel').
            // 2. If Matrix Hub is Online but Runner is Offline -> Ask Sentinel to spawn Runner ('sys:start_runner').
            // 3. Fallback -> Global Ignite ('sys:ignite').
            let cmd = 'sys:ignite';

            if (services.nexus === 'offline') {
                cmd = 'sys:start_sentinel';
            } else if (services.runner === 'offline') {
                cmd = 'sys:start_runner';
            }



            const { error } = await supabase.from('ghost_bridge').insert({
                command: cmd,
                source: 'nexus_restoration',
                status: 'pending',
                output: `Manual recovery: ${cmd}`
            });
            if (error) throw error;
        } catch (e) {
            console.error('[IGNITION] Neural Link Error:', e);
            setIsIgniting(false);
            setHandshakeFailed(true);
        }
    };

    const copyIgniteCommand = () => {
        navigator.clipboard.writeText('launchers\\matrix.bat start');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getAlertDetails = () => {
        if (handshakeFailed) return {
            title: 'Handshake Failed',
            desc: 'Sentinel offline. Run: launchers\\matrix.bat start',
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/30',
            icon: <ShieldAlert className="text-rose-500" size={24} />
        };
        if (isCritical) return {
            title: 'Integrity Critical',
            desc: 'Sentinel link severed. External commands disabled.',
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            icon: <ShieldAlert className="text-rose-500 animate-pulse" size={24} />
        };
        if (isDesynced) return {
            title: 'Neural Interference',
            desc: 'Metabolic desync or signal noise detected.',
            color: 'text-violet-400',
            bg: 'bg-violet-400/10',
            border: 'border-violet-400/20',
            icon: <Activity className="text-violet-400 animate-spin-slow" size={24} />
        };
        return {
            title: 'Uplink Alert',
            desc: 'Ghost Runner heartbeat delayed (>30s)',
            color: 'text-amber-400',
            bg: 'bg-amber-400/10',
            border: 'border-amber-400/20',
            icon: <AlertTriangle className="text-amber-400 animate-bounce" size={24} />
        };
    };

    const details = (mounted && getAlertDetails()) || {
        title: 'System Alert',
        desc: 'Unknown state detected',
        color: 'text-slate-500',
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/20',
        icon: <AlertTriangle size={24} />
    };

    if (!mounted || isDismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30, transition: { duration: 0.2 } }}
                className="fixed bottom-24 sm:bottom-32 left-4 right-4 sm:left-auto sm:right-8 z-[300] group pointer-events-none flex justify-center sm:block"
            >
                {/* Visual Glow Layer */}
                <div className={cn(
                    "absolute -inset-4 blur-3xl opacity-20 transition-all duration-1000",
                    isCritical || handshakeFailed ? "bg-rose-500" : isDesynced ? "bg-violet-500" : "bg-amber-500"
                )} />

                <div className={cn(
                    "relative flex flex-col gap-4 p-5 rounded-3xl border backdrop-blur-3xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-500 w-full max-w-[340px] overflow-hidden pointer-events-auto",
                    details?.bg || "bg-slate-900/90",
                    details?.border || "border-white/10"
                )}>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="mt-1">{details.icon}</div>
                            <div>
                                <h4 className={cn("text-[10px] font-black uppercase tracking-[0.3em]", details.color)}>
                                    {handshakeFailed ? 'Verification Failed' : isCritical ? 'Integrity Critical' : isDesynced ? 'Metabolic Desync' : 'Uplink Alert'}
                                </h4>
                                <p className="text-sm font-bold text-white tracking-tight mt-1">{details.title}</p>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1 italic">{details.desc}</p>
                            </div>
                        </div>
                        <button type="button"
                            onClick={() => setIsDismissed(true)}
                            className="text-slate-500 hover:text-white transition-colors p-1"
                        >
                            <Power size={14} />
                        </button>
                    </div>

                    {/* Actions Area: Contextual Recovery */}
                    {(isCritical || handshakeFailed) ? (
                        <div className="flex flex-col gap-3 mt-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Local Ignition Required:</span>
                                <div className="flex items-center justify-between px-3 py-2 bg-black/60 rounded-xl border border-rose-500/20 group/cmd">
                                    <code className="text-[11px] text-rose-400 font-mono">matrix.bat start</code>
                                    <button type="button"
                                        onClick={copyIgniteCommand}
                                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-500" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button type="button"
                                    onClick={handleMetaIgnition}
                                    disabled={isIgniting}
                                    className={cn(
                                        "flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-500/20 transition-all active:scale-95",
                                        isIgniting && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {isIgniting ? <RefreshCw className="animate-spin" size={12} /> : <Zap size={12} />}
                                    {isIgniting ? 'Verifying Link...' : 'Re-Attempt Pulse'}
                                </button>
                                <button type="button"
                                    onClick={refreshTelemetry}
                                    disabled={isSyncing}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <RefreshCw className={cn(isSyncing && "animate-spin")} size={12} />
                                    Sync Core
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <button type="button"
                                onClick={handleMetaIgnition}
                                disabled={isIgniting}
                                className={cn(
                                    "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                                    isIgniting
                                        ? "bg-white/5 border-white/5 text-slate-500 cursor-not-allowed"
                                        : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 active:scale-95"
                                )}
                            >
                                {isIgniting ? (
                                    <RefreshCw className="animate-spin" size={12} />
                                ) : (
                                    <Zap className={cn("fill-current", details.color)} size={12} />
                                )}
                                {isIgniting ? 'Verifying Link...' : 'Re-Attempt Pulse'}
                            </button>

                            <button type="button"
                                onClick={refreshTelemetry}
                                disabled={isSyncing}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <RefreshCw className={cn(isSyncing && "animate-spin")} size={12} />
                                Sync Core
                            </button>
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="flex items-center gap-2 px-1 mt-1 opacity-60">
                        <Info size={10} className="text-slate-500" />
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                            {handshakeFailed ? 'Handshake timeout exceeded' : 'Neural restoration protocol active'}
                        </span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
