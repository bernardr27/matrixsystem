'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, FolderOpen, Crosshair, Activity,
    Globe, Database, LayoutGrid, ChevronRight,
    Menu, X, Bell, Settings, User, Command, Terminal,
    Wifi, WifiOff, Cpu, Sparkles, MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NeuralChat } from '@/components/NeuralChat';
import { UIDebugger } from '@/components/debug/UIDebugger';
import { MatrixExplorer } from '@/components/v2/MatrixExplorer';
import MissionBoard from '@/components/v2/MissionBoard';
import { TriagePanel } from '@/components/TriagePanel';
import { DebugConsole } from '@/components/debug/DebugConsole';
import MatrixNetworkLink from '@/components/console/MatrixNetworkLink';
import ArchitectDashboard from '@/app/architect/page';
import VaultPage from '@/app/vault/page';
import { useSage } from '@/context/SageContext';

/* ═══════════════════════════════════════════════════════
   GHOST COMMAND v11.0 — Terminal-inspired redesign
   Desktop: Full-width top header + scrollable tab bar + content
   Mobile: Compact header + bottom dock + content
   Indigo/violet accent — visually distinct from Rocket & Nexus
   ═══════════════════════════════════════════════════════ */

type TabId = 'chat' | 'explorer' | 'mission' | 'gate' | 'triage' | 'debug' | 'architect' | 'vault';

const NAV_ITEMS: { id: TabId; label: string; shortLabel: string; icon: React.ElementType }[] = [
    { id: 'chat', label: 'Neural Chat', shortLabel: 'Chat', icon: MessageSquare },
    { id: 'architect', label: 'Architect', shortLabel: 'Build', icon: LayoutGrid },
    { id: 'mission', label: 'Missions', shortLabel: 'Ops', icon: Crosshair },
    { id: 'explorer', label: 'Explorer', shortLabel: 'Files', icon: FolderOpen },
    { id: 'vault', label: 'Vault', shortLabel: 'Vault', icon: Database },
    { id: 'triage', label: 'Diagnostics', shortLabel: 'Diag', icon: Activity },
    { id: 'gate', label: 'Network', shortLabel: 'Net', icon: Globe },
    { id: 'debug', label: 'Debug', shortLabel: 'Debug', icon: Terminal },
];

const MOBILE_DOCK = NAV_ITEMS.slice(0, 4);

export default function IndustrialConsole() {
    const [activeTab, setActiveTab] = useState<TabId>('chat');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const { systemHealth, sageExecuting, ralphExecuting } = useSage();

    const isOnline = systemHealth?.online;
    const isBusy = sageExecuting || ralphExecuting;
    const activeItem = NAV_ITEMS.find(n => n.id === activeTab);

    return (
        <div className="flex flex-col h-screen w-full bg-[#06080e] text-slate-200 font-sans overflow-hidden selection:bg-indigo-500/30">

            {/* ═══ TOP HEADER — 50px ═══ */}
            <header
                className="shrink-0 z-40 bg-[#0B0E14]/70 backdrop-blur-2xl"
                style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
                {/* Thin gradient accent line */}
                <div className="h-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 opacity-50" />

                <div className="h-[48px] flex items-center justify-between px-3 sm:px-5">
                    {/* Left: Logo + breadcrumb */}
                    <div className="flex items-center gap-3">
                        <button type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            className="md:hidden p-1.5 hover:bg-white/[0.06] rounded-lg"
                            aria-label="Open navigation"
                        >
                            <Menu size={18} className="text-white/40" />
                        </button>

                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)] relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                                <Command size={15} className="text-white relative z-10" />
                            </div>
                            <div className="hidden sm:flex flex-col leading-none">
                                <span className="text-[12px] font-extrabold text-white/95 tracking-tight">GHOST</span>
                                <span className="text-[8px] font-semibold text-indigo-400/50 tracking-[0.15em]">COMMAND</span>
                            </div>
                        </div>

                        <div className="flex items-center text-[11px] text-white/20">
                            <ChevronRight className="w-3 h-3" />
                            <span className="ml-1 text-white/45 font-medium">{activeItem?.label || 'Chat'}</span>
                        </div>
                    </div>

                    {/* Right: Status + actions */}
                    <div className="flex items-center gap-2">
                        {/* Connection orb */}
                        <div className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border transition-all',
                            isOnline ? 'border-emerald-500/20 text-emerald-400' : 'border-red-500/20 text-red-400'
                        )}>
                            <div className={cn(
                                "w-[6px] h-[6px] rounded-full",
                                isOnline ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-red-400",
                                isBusy && "animate-pulse"
                            )} />
                            <span className="text-[9px] font-bold">{isOnline ? 'LIVE' : 'OFF'}</span>
                        </div>

                        {/* AI indicator */}
                        {isBusy && (
                            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-violet-500/20 text-violet-400/80 animate-pulse shadow-[0_0_12px_rgba(139,92,246,0.2)]">
                                <Sparkles className="w-3 h-3" />
                                <span className="text-[9px] font-bold">AI</span>
                            </div>
                        )}

                        <button type="button" className="p-1.5 text-white/25 hover:text-white/50 hover:bg-white/[0.04] rounded-lg transition-colors relative" aria-label="Notifications">
                            <Bell size={15} />
                            {isOnline && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-400 rounded-full" />}
                        </button>
                        <button type="button"
                            onClick={() => setShowDebug(true)}
                            className="p-1.5 text-white/25 hover:text-white/50 hover:bg-white/[0.04] rounded-lg transition-colors"
                            aria-label="Settings"
                        >
                            <Settings size={15} />
                        </button>
                        <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center ml-0.5">
                            <User size={12} className="text-white" />
                        </div>
                    </div>
                </div>
            </header>

            {/* ═══ DESKTOP TAB BAR — scrollable horizontal tabs ═══ */}
            <div className="hidden md:block shrink-0 border-b border-white/[0.04] bg-[#0B0E14]/50 backdrop-blur-2xl z-30">
                <div className="flex items-center h-[38px] px-4 gap-0.5 overflow-x-auto scrollbar-none">
                    {NAV_ITEMS.map(nav => {
                        const isActive = activeTab === nav.id;
                        return (
                            <button type="button"
                                key={nav.id}
                                onClick={() => setActiveTab(nav.id)}
                                className={cn(
                                    'relative flex items-center gap-2 px-3.5 h-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 border-b-2',
                                    isActive
                                        ? 'text-indigo-400 border-indigo-400'
                                        : 'text-white/25 hover:text-white/50 border-transparent hover:border-white/[0.08]'
                                )}
                            >
                                <nav.icon className="w-3.5 h-3.5" />
                                <span>{nav.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <UIDebugger isOpen={showDebug} onClose={() => setShowDebug(false)} />

            {/* ═══ CONTENT AREA ═══ */}
            <main className="flex-1 overflow-hidden relative">
                {/* Ambient gradient */}
                <div className="absolute inset-0 pointer-events-none z-0" style={{
                    background: `
                        radial-gradient(ellipse 60% 40% at 15% 25%, rgba(99,102,241,0.03) 0%, transparent 60%),
                        radial-gradient(ellipse 50% 35% at 85% 75%, rgba(139,92,246,0.02) 0%, transparent 60%)
                    `
                }} />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, scale: 0.995 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.995 }}
                        transition={{ duration: 0.12 }}
                        className="h-full w-full relative z-10"
                    >
                        {activeTab === 'chat' && <NeuralChat />}
                        {activeTab === 'explorer' && <MatrixExplorer isActive={true} />}
                        {activeTab === 'mission' && <MissionBoard />}
                        {activeTab === 'triage' && <TriagePanel />}
                        {activeTab === 'debug' && <DebugConsole />}
                        {activeTab === 'gate' && <MatrixNetworkLink />}
                        {activeTab === 'architect' && <ArchitectDashboard />}
                        {activeTab === 'vault' && <VaultPage />}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* ═══ MOBILE BOTTOM DOCK — 54px ═══ */}
            <nav
                className="md:hidden shrink-0 bg-[#0B0E14]/85 backdrop-blur-2xl border-t border-white/[0.04]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <div className="grid grid-cols-5 h-[54px]">
                    {MOBILE_DOCK.map(nav => {
                        const isActive = activeTab === nav.id;
                        return (
                            <button type="button"
                                key={nav.id}
                                onClick={() => setActiveTab(nav.id)}
                                className={cn(
                                    'relative flex flex-col items-center justify-center gap-1 h-full transition-all duration-200',
                                    isActive ? 'text-indigo-400' : 'text-white/20 active:text-white/35'
                                )}
                            >
                                <div className={cn(
                                    'flex items-center justify-center w-9 h-9 rounded-full transition-all',
                                    isActive && 'bg-indigo-500/12 scale-110'
                                )}>
                                    <nav.icon className="w-[18px] h-[18px]" />
                                </div>
                                <span className={cn(
                                    'text-[7px] font-bold leading-none tracking-wide',
                                    isActive ? 'text-indigo-400' : 'text-white/15'
                                )}>
                                    {nav.shortLabel}
                                </span>
                            </button>
                        );
                    })}
                    {/* More button for remaining tabs */}
                    <button type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className={cn(
                            'relative flex flex-col items-center justify-center gap-1 h-full transition-all duration-200',
                            NAV_ITEMS.slice(4).some(n => n.id === activeTab) ? 'text-indigo-400' : 'text-white/20 active:text-white/35'
                        )}
                    >
                        <div className="flex items-center justify-center w-9 h-9 rounded-full">
                            <MoreHorizontal className="w-[18px] h-[18px]" />
                        </div>
                        <span className="text-[7px] font-bold leading-none tracking-wide text-white/15">More</span>
                    </button>
                </div>
            </nav>

            {/* ═══ MOBILE SLIDE-UP MENU ═══ */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 md:hidden"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                            className="fixed bottom-0 left-0 right-0 z-50 md:hidden max-h-[75vh]"
                        >
                            <div className="bg-[#0c1020]/98 backdrop-blur-2xl rounded-t-[20px] border-t border-white/[0.06] shadow-2xl overflow-hidden">
                                {/* Drag handle */}
                                <div className="flex justify-center py-3">
                                    <div className="w-10 h-1 rounded-full bg-white/[0.12]" />
                                </div>

                                {/* Header */}
                                <div className="px-5 pb-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                            <Command size={14} className="text-white" />
                                        </div>
                                        <div>
                                            <span className="text-[13px] font-bold text-white block leading-none">Ghost Command</span>
                                            <span className="text-[9px] text-white/25">{isOnline ? 'System Online' : 'Offline'}</span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl hover:bg-white/[0.06] text-white/30">
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="mx-5 h-px bg-gradient-to-r from-indigo-500/30 via-white/[0.04] to-transparent" />

                                {/* All tabs */}
                                <div className="p-4 grid grid-cols-4 gap-2">
                                    {NAV_ITEMS.map(nav => {
                                        const isActive = activeTab === nav.id;
                                        return (
                                            <button type="button"
                                                key={nav.id}
                                                onClick={() => { setActiveTab(nav.id); setMobileMenuOpen(false); }}
                                                className={cn(
                                                    'flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border',
                                                    isActive
                                                        ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400'
                                                        : 'bg-white/[0.02] border-white/[0.04] text-white/30 active:bg-white/[0.06]'
                                                )}
                                            >
                                                <nav.icon className="w-5 h-5" />
                                                <span className="text-[10px] font-bold">{nav.shortLabel}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Status footer */}
                                <div className="px-5 py-4 border-t border-white/[0.04] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" : "bg-red-400")} />
                                        <span className="text-[10px] text-white/30 font-medium">{isBusy ? 'AI Processing...' : isOnline ? 'Connected' : 'Offline'}</span>
                                    </div>
                                    <span className="text-[9px] text-white/15 font-mono">v11.0</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
