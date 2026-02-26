'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, RefreshCw, Globe, Zap, X, Shield } from 'lucide-react';
import { useTelemetry, useGlobalUptime } from '@/components/providers/TelemetryProvider';
import { useSoul } from '@/components/providers/SoulProvider';
import { cn } from '@/lib/utils';

interface FloatingNavProps {
    onGateClick: () => void;
    isGateOpen?: boolean;
}

export function FloatingNav({ onGateClick, isGateOpen = false }: FloatingNavProps) {
    const { services, isSyncing, uptimeStart, refreshTelemetry } = useTelemetry();
    const { profile, isLoading: soulLoading } = useSoul();

    const uptime = useGlobalUptime();

    // Consolidated Status: Online if Sentinel is active (primary) or fallbacks
    const sentinelOnline = services.sentinel === 'online' || services.nexus === 'online';
    const gateStatus = services.gate;

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-50 px-4 py-6"
        >
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between gap-4 px-8 py-4 bg-black/40 backdrop-blur-2xl rounded-full border border-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-visible">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 group/logo">
                            <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity" />
                            <Image
                                src="/nexus_logo.png"
                                alt="Matrix Hub Nano"
                                width={32}
                                height={32}
                                className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                            />
                            {sentinelOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full animate-pulse z-10" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-black tracking-[0.4em] uppercase bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent leading-none font-display">
                                Matrix Hub
                            </span>
                            <span className="text-[7px] font-black tracking-[0.3em] uppercase text-cyan-400 leading-none mt-1.5 opacity-80">
                                Command Node
                            </span>
                        </div>
                    </div>

                    {/* Status Cluster */}
                    <div className="flex items-center gap-3">
                        {/* Sentinel Badge */}
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                            sentinelOnline
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                        )}>
                            <ShieldCheck size={12} />
                            <span className="hidden sm:inline">Sentinel</span>
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                sentinelOnline ? "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" : "bg-slate-600"
                            )} />
                        </div>

                        {/* Uptime Badge */}
                        {uptime && (
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold font-mono tracking-widest bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                <span>{uptime}</span>
                            </div>
                        )}

                        {/* Sync Status */}
                        <button type="button"
                            onClick={() => refreshTelemetry()}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-white/5 active:scale-95",
                                isSyncing || soulLoading
                                    ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40"
                            )}>
                            <RefreshCw size={12} className={isSyncing || soulLoading ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">SoulSync</span>
                        </button>

                        {/* Tier Badge */}
                        {profile && (
                            <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 text-slate-300 border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                                <Shield size={12} className="text-amber-400" />
                                <span>{profile.tier}</span>
                            </div>
                        )}

                        {/* Gate Button */}
                        <button type="button"
                            onClick={onGateClick}
                            className={cn(
                                "relative flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all group overflow-visible",
                                gateStatus === 'online'
                                    ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                                    : gateStatus === 'connecting'
                                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                                        : "bg-white/5 text-slate-400 border border-white/10 hover:border-cyan-500/30 hover:text-cyan-400"
                            )}
                        >
                            <Globe size={14} className={gateStatus === 'connecting' ? 'animate-spin' : ''} />
                            <span>Gate</span>
                            {gateStatus === 'online' && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}
