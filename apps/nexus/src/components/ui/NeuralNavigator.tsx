'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Activity, Library, FileText, Settings, RefreshCw, Globe, X, Cpu,
    Fingerprint, Zap, Database, ChevronRight, Shield, Search, Heart
} from 'lucide-react';
import { useTelemetry, useGlobalUptime } from '@/components/providers/TelemetryProvider';
import { cn } from '@/lib/utils';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { uuidv4 } from '@/lib/uuid';
import Image from 'next/image';

const NAV_ITEMS = [
    { label: 'Core', href: '/', icon: LayoutDashboard },
    { label: 'Nodes', href: '/analytics', icon: Activity },
    { label: 'Archive', href: '/knowledge', icon: Library },
    { label: 'Terminal', href: '/diagnostics', icon: FileText },
];

function ProtocolOption({ label, icon, onClick, color = "text-white/50" }: { label: string, icon: React.ReactNode, onClick: () => void, color?: string }) {
    return (
        <button type="button"
            onClick={onClick}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-xl transition-all group active:scale-95"
        >
            <div className="flex items-center gap-3">
                <div className={cn("p-1.5 rounded-lg bg-white/5 border border-white/5 transition-colors group-hover:border-white/10", color)}>
                    {icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 group-hover:text-white transition-colors">
                    {label}
                </span>
            </div>
            <ChevronRight size={12} className="text-white/10 group-hover:text-white/30 transition-colors" />
        </button>
    );
}

export function NeuralNavigator() {
    return (
        <Suspense fallback={<div className="h-16 w-full" />}>
            <NeuralNavigatorContent />
        </Suspense>
    );
}

function NeuralNavigatorContent() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const { services, isSyncing, uptimeStart, refreshTelemetry, setGateOpen, performanceHistory } = useTelemetry();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const hasSupabase = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder';
    const uptime = useGlobalUptime();

    const latestPerformance = performanceHistory[performanceHistory.length - 1] || { ram: 0, cpu: '0%' };
    const ramLoad = Math.round(latestPerformance.ram);
    const cpuLoad = latestPerformance.cpu;

    const sendCommand = async (cmd: string) => {
        try {
            await supabase.from('ghost_bridge').insert([{
                id: uuidv4(),
                command: cmd,
                source: 'nexus_hud',
                status: 'pending'
            }]);
        } catch (e) {
            console.error('[HUD] Command dispatch failed:', e);
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    // Logic Checks
    const systemOnline = services.nexus === 'online' && services.runner === 'online' && services.sentinel === 'online';
    const systemState = !systemOnline ? (services.sentinel === 'online' ? 'degraded' : 'offline') : 'nominal';
    const gateStatus = services.gate;

    const toggleProtocolMenu = () => {
        const el = document.getElementById('system-protocol-menu');
        if (el) el.classList.toggle('hidden');
    };

    if (!mounted) return null;

    return (
        <>
            {/* TOP BAR: IDENTITY & STATUS */}
            <div className="fixed top-0 left-0 right-0 z-[60] px-3 pt-3 pb-4 pointer-events-none sm:px-6 sm:pt-6 font-primary overflow-visible">
                <div className="max-w-7xl mx-auto w-full flex items-start gap-1.5 sm:gap-4">

                    {/* PORT POD: Identity */}
                    <motion.div
                        initial={{ x: -25, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex-shrink-0 pointer-events-auto transform-gpu"
                    >
                        <div className="bg-zinc-950/80 backdrop-blur-[40px] border border-white/10 p-1.5 rounded-[1.75rem] shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-center relative group/identity overflow-hidden">
                            <button type="button"
                                onClick={toggleProtocolMenu}
                                className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/5 rounded-2xl transition-all active:scale-95 group min-w-[44px] min-h-[44px] justify-center relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full group-hover/identity:animate-[shimmer_2s_infinite] pointer-events-none" />
                                <div className="relative w-8 h-8 flex items-center justify-center">
                                    <Image src="/nexus_logo.png" alt="Matrix Hub" fill className="object-contain p-0.5 opacity-90 group-hover:scale-110 transition-transform duration-700 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                                </div>
                                <div className="flex flex-col items-start leading-none gap-1 pr-1">
                                    <h2 className="text-lg font-black uppercase tracking-tighter text-white italic drop-shadow-sm">Matrix Hub</h2>
                                    <span className="text-[6px] font-black text-cyan-500/60 uppercase tracking-[0.4em] italic leading-tight">Aetheric_Command v4.2.0</span>
                                </div>
                            </button>

                            {/* SYSTEM PROTOCOL MENU - Revamped */}
                            <div id="system-protocol-menu" className="hidden absolute top-14 left-0 w-56 bg-[#050505]/98 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-2 z-[100] animate-in fade-in slide-in-from-top-2">
                                <span className="block px-3 py-2 text-[7px] font-black text-white/20 uppercase tracking-[0.3em] mb-1 border-b border-white/5">System_Protocols_v4.2</span>
                                <div className="space-y-1">
                                    <ProtocolOption label="Deep_Ignite" icon={<Zap size={14} />} onClick={() => sendCommand('sys:ignite')} color="text-cyan-400" />
                                    <ProtocolOption label="Mission_Snapshot" icon={<Database size={14} />} onClick={() => sendCommand('sys:snapshot')} color="text-emerald-400" />
                                    <ProtocolOption label="Launch_Experience" icon={<Globe size={14} />} onClick={() => window.open(process.env.NEXT_PUBLIC_REFLECT_URL || `http://${window.location.hostname}:3000`, '_blank')} color="text-fuchsia-400" />
                                    <ProtocolOption label="Pulse_Resync" icon={<RefreshCw size={14} />} onClick={() => refreshTelemetry()} color="text-blue-400" />
                                    <ProtocolOption label="Neural_Hardening" icon={<Shield size={14} />} onClick={() => sendCommand('sys:harden')} color="text-violet-400" />
                                </div>
                            </div>

                            {/* NAV LINKS: HIDDEN ON MOBILE PORTRAIT (Moved to Bottom Nav) */}
                            <div className="hidden sm:flex items-center">
                                <div className="h-5 w-px bg-white/10 mx-1" />
                                <nav className="flex items-center gap-0.5">
                                    {NAV_ITEMS.map((item) => {
                                        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                                        const Icon = item.icon;
                                        return (
                                            <Link key={item.href} href={item.href}>
                                                <motion.div
                                                    className={cn(
                                                        "px-3 py-2 rounded-xl transition-all relative flex items-center gap-2 min-w-[40px] justify-center group",
                                                        isActive ? "text-cyan-300" : "text-slate-500 hover:text-white"
                                                    )}
                                                >
                                                    <Icon size={16} className={cn("transition-colors duration-200", isActive ? "text-cyan-400" : "group-hover:text-cyan-400/50")} />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:block mt-0.5">
                                                        {item.label}
                                                    </span>
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="nav-active-pill"
                                                            className="absolute inset-0 bg-cyan-500/5 border-b-2 border-cyan-500/40 rounded-xl"
                                                            transition={{ type: "tween", duration: 0.2 }}
                                                        />
                                                    )}
                                                </motion.div>
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>
                    </motion.div>

                    {/* FLUID SPACER */}
                    <div className="flex-1" />

                    {/* SYNAPTIC CORE: High-Density Telemetry */}
                    <div className="flex-1 flex justify-center">
                        <motion.div
                            initial={{ y: -25, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="pointer-events-auto transform-gpu"
                        >
                            <div className="bg-zinc-950/95 backdrop-blur-[50px] border-x border-b border-white/15 px-2.5 py-1.5 rounded-b-[1.75rem] shadow-[0_15px_35px_rgba(0,0,0,0.5)] flex items-center gap-2.5 group relative">

                                {/* NODE Pod */}
                                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white/[0.03] rounded-xl border border-white/5 min-w-[125px] shadow-inner transition-colors group-hover:bg-white/[0.05]">
                                    <div className="flex flex-col flex-1">
                                        <span className="text-[6px] font-black text-white/20 uppercase tracking-[0.25em] leading-none mb-0.5 italic">Node_Identity</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                                            <span className="text-[11px] font-mono font-black text-cyan-400 leading-none whitespace-nowrap tracking-wider drop-shadow-sm">NX_CMD_P01</span>
                                        </div>
                                    </div>
                                    <div className="h-5 w-px bg-white/10 mx-0.5" />
                                    <div className="flex flex-col items-end">
                                        <span className="text-[6px] font-black text-white/20 uppercase tracking-[0.25em] leading-none mb-0.5 italic">Sync</span>
                                        <span className={cn(
                                            "text-[10px] font-mono font-black leading-none italic uppercase tracking-tighter",
                                            hasSupabase ? "text-white" : "text-amber-300/80"
                                        )}>
                                            {hasSupabase ? 'Live' : 'Offline'}
                                        </span>
                                    </div>
                                </div>

                                {/* RAM Pod */}
                                <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-white/[0.03] rounded-xl border border-white/5 shadow-inner group-hover:bg-white/[0.05] transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-[6px] font-black text-white/20 uppercase tracking-[0.25em] leading-none mb-0.5 italic">Buffer</span>
                                        <span className="text-[10px] font-mono font-black text-violet-400 leading-none uppercase tracking-wider">{ramLoad}MB</span>
                                    </div>
                                    <div className="w-14 h-1 bg-white/10 rounded-full overflow-hidden mt-0.5 shadow-inner">
                                        <motion.div
                                            className="h-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (ramLoad / 1024) * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* SYS Pod */}
                                <div className="flex items-center gap-3 px-3 py-1.5 bg-white/[0.03] rounded-xl border border-white/5 shadow-inner group-hover:bg-white/[0.05] transition-colors overflow-hidden">
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <motion.div
                                                animate={{
                                                    scale: systemState === 'nominal' ? [1, 1.2, 1] : [1, 1.5, 1],
                                                    opacity: systemState === 'nominal' ? [0.6, 1, 0.6] : [1, 0.4, 1]
                                                }}
                                                transition={{ duration: systemState === 'nominal' ? 2 : 0.6, repeat: Infinity }}
                                                className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    systemState === 'nominal' ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]" :
                                                        systemState === 'degraded' ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]" : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)]"
                                                )}
                                            />
                                            <span className={cn(
                                                "text-[8px] font-mono font-black tracking-[0.2em] uppercase leading-none mt-0.5 italic drop-shadow-sm",
                                                systemState === 'nominal' ? "text-cyan-400" :
                                                    systemState === 'degraded' ? "text-amber-400" : "text-rose-500"
                                            )}>
                                                {systemState}
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-mono font-black text-white tabular-nums tracking-[0.1em] leading-none drop-shadow-sm">
                                            {uptime}
                                        </span>
                                    </div>
                                    <div className="h-6 w-px bg-white/10" />
                                    <motion.button
                                        onClick={() => refreshTelemetry()}
                                        whileHover={{ scale: 1.1, rotate: 180, color: '#fff' }}
                                        whileTap={{ scale: 0.9 }}
                                        className={cn(
                                            "p-2 rounded-xl transition-all shadow-lg",
                                            isSyncing ? "text-violet-400 bg-violet-400/10 border border-violet-500/20" : "text-slate-600 hover:text-white bg-white/5 border border-transparent"
                                        )}
                                    >
                                        <RefreshCw size={14} className={cn(isSyncing ? "animate-spin" : "opacity-60")} />
                                    </motion.button>
                                </div>

                                <div className="absolute inset-x-6 -bottom-px h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent blur-[1px]" />
                            </div>
                        </motion.div>
                    </div>

                    {/* FLUID SPACER */}
                    <div className="flex-1" />

                    {/* CONTROL POD: Tools & Console */}
                    <motion.div
                        initial={{ x: 25, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex-shrink-0 pointer-events-auto transform-gpu"
                    >
                        <div className="bg-zinc-950/90 backdrop-blur-[50px] border border-white/10 p-1.5 rounded-[1.75rem] shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-center">
                            <div className="hidden sm:flex items-center gap-1.5">
                                <button type="button"
                                    onClick={() => setGateOpen(true)}
                                    className={cn(
                                        "flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition-all active:scale-95 group min-w-[44px] min-h-[44px] justify-center",
                                        gateStatus === 'online' ?
                                            "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.1)]" :
                                            "border-transparent bg-white/5 text-slate-500 hover:text-white"
                                    )}
                                >
                                    <Globe size={16} className={cn(gateStatus === 'connecting' ? 'animate-spin' : 'group-hover:rotate-12 transition-transform duration-300')} />
                                    <span className="text-[9px] font-black tracking-[0.2em] hidden md:block italic">
                                        {gateStatus === 'online' ? 'LINKED' : 'GATE'}
                                    </span>
                                </button>
                                <div className="h-5 w-px bg-white/10 mx-0.5" />
                            </div>

                            <Link href={pathname === '/settings' ? '/' : '/settings'}>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className={cn(
                                        "p-2.5 rounded-2xl transition-all border group active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center",
                                        pathname === '/settings' ?
                                            "text-rose-400 bg-rose-400/10 border-rose-400/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]" :
                                            "text-slate-500 hover:text-white border-transparent hover:bg-white/5"
                                    )}
                                >
                                    {pathname === '/settings' ? <X size={18} /> : <Settings size={18} />}
                                </motion.button>
                            </Link>

                            <div className="hidden sm:flex w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/20 items-center justify-center shrink-0 ml-1.5 shadow-inner">
                                <Fingerprint size={20} className="text-cyan-400/80" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* BOTTOM NAV: PRIMARY APP NAVIGATION (MOBILE ONLY) */}
            <div className="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-6 sm:hidden pointer-events-none">
                <div className="max-w-md mx-auto w-full flex justify-center">
                    <motion.nav
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-zinc-950/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-1.5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex items-center justify-around pointer-events-auto transform-gpu w-full max-w-[340px]"
                    >
                        {NAV_ITEMS.map((item) => {
                            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                            const Icon = item.icon;
                            return (
                                <Link key={item.href} href={item.href} className="flex-1">
                                    <motion.div
                                        className={cn(
                                            "flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all relative group",
                                            isActive ? "text-cyan-400" : "text-slate-500"
                                        )}
                                    >
                                        <Icon size={18} className={cn("transition-transform duration-300", isActive ? "scale-110" : "opacity-70 group-active:scale-90")} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="bottom-nav-active"
                                                className="absolute inset-0 bg-cyan-500/5 rounded-xl border-t border-cyan-500/40"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                            />
                                        )}
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </motion.nav>
                </div>
            </div>

            {/* SYNC HUD OVERLAY */}
            <AnimatePresence>
                {isSyncing && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 10 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="fixed inset-x-0 top-20 flex justify-center pointer-events-none px-4"
                    >
                        <div className="max-w-[240px] w-full px-4 py-2 bg-zinc-950/95 border border-violet-500/30 rounded-full backdrop-blur-2xl shadow-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-violet-400">Sync Active</span>
                            </div>
                            <span className="text-[9px] font-mono text-violet-400/60 font-bold">1.0Hz</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
