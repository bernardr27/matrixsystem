'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Activity, Menu, X, Settings, Globe, BarChart3, LayoutDashboard, Database, Share2, Wifi, WifiOff, Sparkles, ChevronRight, Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTelemetry } from '@/components/providers/TelemetryProvider';

/* ═══════════════════════════════════════════════════════
   NEXUS NAVBAR v6.0 — Teal accent, split layout
   Top: 48px elevated bar with gradient accent strip
   Bottom: 52px mobile dock with pill indicators
   Completely different visual from Rocket Command
   ═══════════════════════════════════════════════════════ */

const navLinks = [
    { id: 'dash', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard, href: '/' },
    { id: 'anal', label: 'Analytics', shortLabel: 'Stats', icon: BarChart3, href: '/analytics' },
    { id: 'diag', label: 'Diagnostics', shortLabel: 'Diag', icon: Activity, href: '/diagnostics' },
    { id: 'gate', label: 'Gateway', shortLabel: 'Gate', icon: Globe, isGate: true },
    { id: 'ints', label: 'Integrations', shortLabel: 'Links', icon: Share2, href: '/integrations' },
    { id: 'arch', label: 'Archive', shortLabel: 'Data', icon: Database, href: '/knowledge' },
    { id: 'sett', label: 'Settings', shortLabel: 'Config', icon: Settings, href: '/settings' },
];

export function NexusNavbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { services, coherence, setGateOpen } = useTelemetry();
    const [clock, setClock] = useState('');

    const onlineCount = Object.values(services || {}).filter(s => s === 'online').length;
    const totalServices = Math.max(Object.keys(services || {}).length, 1);

    useEffect(() => {
        const tick = () => setClock(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
        tick();
        const t = setInterval(tick, 10000);
        return () => clearInterval(t);
    }, []);

    const handleNav = (link: typeof navLinks[0]) => {
        setIsMenuOpen(false);
        if (link.isGate) { setGateOpen(true); return; }
        if (link.href && pathname !== link.href) router.push(link.href);
    };

    const currentPage = navLinks.find(l => l.href === pathname)?.label || 'Nexus';

    return (
        <>
            {/* ── TOP BAR — 48px with gradient strip ── */}
            <nav className="fixed top-0 left-0 right-0 z-[300]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
                {/* Gradient accent strip */}
                <div className="h-[2px] bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-500 opacity-60" />

                <div className="h-[46px] bg-[#0a0f14]/90 backdrop-blur-2xl border-b border-white/[0.05]">
                    <div className="flex items-center justify-between h-full px-3 sm:px-5 max-w-[1920px] mx-auto">

                        {/* Left: Logo + page breadcrumb */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <Link href="/" className="flex items-center gap-2.5 group">
                                <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 group-active:scale-95 transition-transform relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    <Shield className="w-4 h-4 text-white relative z-10" />
                                </div>
                                <div className="hidden sm:flex flex-col leading-none">
                                    <span className="text-[12px] font-extrabold text-white/95 tracking-tight">NEXUS</span>
                                    <span className="text-[8px] font-semibold text-teal-400/50 tracking-[0.15em]">MATRIX HUB</span>
                                </div>
                            </Link>
                            <div className="flex items-center text-[11px] text-white/25">
                                <ChevronRight className="w-3 h-3" />
                                <span className="ml-1 text-white/50 font-medium">{currentPage}</span>
                            </div>
                        </div>

                        {/* Center: Desktop nav — segmented control style */}
                        <div className="hidden md:flex items-center gap-1 bg-white/[0.03] rounded-[10px] p-[3px] border border-white/[0.05]">
                            {navLinks.map(link => {
                                const Icon = link.icon;
                                const active = link.href ? pathname === link.href : false;
                                return (
                                    <button type="button"
                                        key={link.id}
                                        onClick={() => handleNav(link)}
                                        className={cn(
                                            'relative flex items-center gap-1.5 px-3 py-[6px] rounded-[8px] text-[11px] font-semibold transition-all duration-200',
                                            active
                                                ? 'text-white bg-gradient-to-b from-white/[0.08] to-white/[0.03] shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]'
                                                : 'text-white/30 hover:text-white/55'
                                        )}
                                    >
                                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="hidden lg:inline">{link.label}</span>
                                        {active && (
                                            <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-teal-400" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right: Clock + status + hamburger */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="hidden lg:inline text-[11px] font-mono font-bold text-white/25 tabular-nums">{clock}</span>

                            {/* Status orb */}
                            <div className={cn(
                                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border transition-all',
                                onlineCount > 0
                                    ? 'border-teal-500/20 text-teal-400'
                                    : 'border-red-500/20 text-red-400'
                            )}>
                                <div className={cn(
                                    "w-[6px] h-[6px] rounded-full",
                                    onlineCount > 0 ? "bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]" : "bg-red-400",
                                )} />
                                <span className="text-[9px] font-bold tabular-nums">{onlineCount}/{totalServices}</span>
                            </div>

                            {/* Coherence badge */}
                            <div className={cn(
                                'hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] border transition-all',
                                coherence >= 80 ? 'border-emerald-500/15 text-emerald-400/70' : 'border-amber-500/15 text-amber-400/70'
                            )}>
                                <Sparkles className="w-3 h-3" />
                                <span className="text-[9px] font-bold">{coherence}%</span>
                            </div>

                            {/* Mobile hamburger */}
                            <button type="button"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
                            >
                                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── MOBILE BOTTOM DOCK — 52px, 5 slots ── */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 z-[300]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <div className="bg-[#080c12]/95 backdrop-blur-2xl border-t border-white/[0.04]">
                    <div className="grid grid-cols-5 h-[56px]">
                        {navLinks.slice(0, 4).map(link => {
                            const Icon = link.icon;
                            const active = link.href ? pathname === link.href : false;
                            return (
                                <button type="button"
                                    key={link.id}
                                    onClick={() => handleNav(link)}
                                    className={cn(
                                        'relative flex flex-col items-center justify-center gap-1 h-full transition-all duration-200',
                                        active ? 'text-teal-400' : 'text-white/25 active:text-white/40'
                                    )}
                                >
                                    <div className={cn(
                                        'flex items-center justify-center w-8 h-8 rounded-xl transition-all',
                                        active && 'bg-teal-500/15 scale-110'
                                    )}>
                                        <Icon className="w-[17px] h-[17px]" />
                                    </div>
                                    <span className={cn(
                                        'text-[9px] font-bold leading-none tracking-wide',
                                        active ? 'text-teal-400' : 'text-white/20'
                                    )}>
                                        {link.shortLabel}
                                    </span>
                                </button>
                            );
                        })}
                        {/* More button */}
                        <button type="button"
                            onClick={() => setIsMenuOpen(true)}
                            className={cn(
                                'relative flex flex-col items-center justify-center gap-1 h-full transition-all duration-200',
                                navLinks.slice(4).some(l => l.href && pathname === l.href) ? 'text-teal-400' : 'text-white/25 active:text-white/40'
                            )}
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-xl">
                                <Menu className="w-[17px] h-[17px]" />
                            </div>
                            <span className="text-[9px] font-bold leading-none tracking-wide text-white/20">More</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── MOBILE DRAWER — full-screen overlay ── */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 z-[350] bg-black/70 backdrop-blur-md md:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 30, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 z-[400] w-full max-w-[300px] bg-[#0a0f14]/98 backdrop-blur-2xl border-l border-white/[0.05] flex flex-col md:hidden"
                        >
                            {/* Header */}
                            <div className="p-5 pb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center">
                                        <Shield className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-white block leading-none">Navigation</span>
                                        <span className="text-[9px] text-white/25 font-medium">{onlineCount} services online</span>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setIsMenuOpen(false)} className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mx-5 h-px bg-gradient-to-r from-teal-500/30 via-white/[0.06] to-transparent" />

                            {/* Links */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                                {navLinks.map(link => {
                                    const Icon = link.icon;
                                    const active = link.href ? pathname === link.href : false;
                                    return (
                                        <button type="button"
                                            key={link.id}
                                            onClick={() => handleNav(link)}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-[13px] font-medium',
                                                active
                                                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                                                    : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04] border border-transparent'
                                            )}
                                        >
                                            <div className={cn(
                                                'w-8 h-8 rounded-lg flex items-center justify-center',
                                                active ? 'bg-teal-500/15' : 'bg-white/[0.03]'
                                            )}>
                                                <Icon className="w-4 h-4 flex-shrink-0" />
                                            </div>
                                            {link.label}
                                            {active && <div className="ml-auto w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.5)]" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-white/[0.05] space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                                        <span className="text-[9px] text-white/25 font-medium block">Coherence</span>
                                        <span className="text-sm font-bold text-teal-400">{coherence}%</span>
                                    </div>
                                    <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                                        <span className="text-[9px] text-white/25 font-medium block">Services</span>
                                        <span className="text-sm font-bold text-emerald-400">{onlineCount}/{totalServices}</span>
                                    </div>
                                </div>
                                <button type="button"
                                    onClick={() => { setGateOpen(true); setIsMenuOpen(false); }}
                                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500/15 to-emerald-500/15 border border-teal-500/25 text-teal-400 text-[11px] font-bold tracking-wider hover:border-teal-500/40 transition-all"
                                >
                                    OPEN GATEWAY
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
