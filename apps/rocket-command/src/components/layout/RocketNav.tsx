'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Rocket, MessageSquare, LayoutDashboard, Radio, Target,
    Terminal, Sparkles, Settings, Monitor, Shield, Wifi, WifiOff,
    Cpu, Activity, Zap, ChevronRight, MoreHorizontal, Menu, X,
} from 'lucide-react';
import { useRocket } from '@/components/providers/RocketProvider';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════
   ROCKETCOMMAND NAV v5.0 — Rich & detailed
   Top bar: 44px — logo · nav links (desktop) · live status nodes
   Bottom: 48px labeled rail with icons + labels (mobile)
   ═══════════════════════════════════════════════════════ */

export const APP_VERSION = '3.0';

const navLinks = [
    { href: '/', label: 'Hub', shortLabel: 'Hub', icon: LayoutDashboard },
    { href: '/chat', label: 'Chat', shortLabel: 'Chat', icon: MessageSquare },
    { href: '/mission-control', label: 'Missions', shortLabel: 'Missions', icon: Target },
    { href: '/operations', label: 'Ops', shortLabel: 'Ops', icon: Terminal },
    { href: '/telemetry', label: 'Telemetry', shortLabel: 'Telem', icon: Radio },
    { href: '/remote-desktop', label: 'Remote', shortLabel: 'Remote', icon: Monitor },
    { href: '/settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
];

/* ─── TOP BAR ─── */
export function RocketNav() {
    const pathname = usePathname();
    const { services, isConnected } = useRocket();
    const [aiReady, setAiReady] = useState(false);

    const onlineCount = Object.values(services).filter(s => s === 'online').length;
    const totalCount = Object.keys(services).length;

    useEffect(() => {
        const check = async () => {
            try {
                const r = await fetch('/api/chat', { method: 'HEAD', signal: AbortSignal.timeout(3000) });
                setAiReady(r.ok || r.status === 405);
            } catch { setAiReady(false); }
        };
        check();
        const t = setInterval(check, 300000);
        return () => clearInterval(t);
    }, []);

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 bg-[#050510]/85 backdrop-blur-2xl border-b border-white/[0.06]"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
            <div className="flex items-center justify-between h-11 px-3 sm:px-4 md:px-5 max-w-[1920px] mx-auto">

                {/* ── Left: Logo + Title ── */}
                <Link href="/" className="flex items-center gap-2 flex-shrink-0 group" aria-label="Home">
                    <div className="w-7 h-7 squircle bg-gradient-to-br from-[#ff6b35] to-[#ff9f1c] flex items-center justify-center shadow-md shadow-orange-500/30 group-active:scale-95 transition-transform">
                        <Rocket className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5">
                        <span className="text-[12px] font-bold text-white/90 tracking-tight">Rocket<span className="text-orange-400">Command</span> <span className="text-white/40 font-semibold">Pro</span></span>
                    </div>
                </Link>
                {pathname !== '/' && (
                    <div className="flex items-center text-[11px] text-white/20">
                        <ChevronRight className="w-3 h-3" />
                        <span className="ml-1 text-white/50 font-medium">{navLinks.find(l => l.href === pathname)?.label || 'Hub'}</span>
                    </div>
                )}

                {/* ── Center: Desktop nav links ── */}
                <div className="hidden md:flex items-center gap-0.5 bg-white/[0.02] rounded-full p-0.5 border border-white/[0.04]">
                    {navLinks.map(link => {
                        const Icon = link.icon;
                        const active = pathname === link.href;
                        return (
                            <Tooltip key={link.href} content={link.label} side="bottom" delay={400}>
                                <Link
                                    href={link.href}
                                    className={cn(
                                        'relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all',
                                        active
                                            ? 'text-orange-400 bg-orange-500/10 shadow-sm shadow-orange-500/10'
                                            : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
                                    )}
                                >
                                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="hidden lg:inline">{link.label}</span>
                                    {active && (
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-orange-400 shadow-[0_0_8px_rgba(255,107,53,0.5)]" />
                                    )}
                                </Link>
                            </Tooltip>
                        );
                    })}
                </div>

                {/* ── Right: Live Status Nodes ── */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Connection status */}
                    <Tooltip content={isConnected ? 'WebSocket connected' : 'WebSocket disconnected'} side="bottom">
                        <div className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors',
                            isConnected
                                ? 'bg-emerald-500/[0.06] border-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/[0.06] border-red-500/20 text-red-400'
                        )}>
                            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                            <span className="text-[9px] font-bold hidden sm:inline">{isConnected ? 'LIVE' : 'OFF'}</span>
                        </div>
                    </Tooltip>

                    {/* Services status */}
                    <Tooltip content={`${onlineCount}/${totalCount} services online`} side="bottom">
                        <div className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors',
                            onlineCount === totalCount
                                ? 'bg-emerald-500/[0.06] border-emerald-500/15 text-emerald-400/80'
                                : onlineCount > 0
                                    ? 'bg-amber-500/[0.06] border-amber-500/15 text-amber-400/80'
                                    : 'bg-red-500/[0.06] border-red-500/15 text-red-400/80'
                        )}>
                            <Shield className="w-3 h-3" />
                            <span className="text-[9px] font-mono font-bold tabular-nums">{onlineCount}/{totalCount}</span>
                        </div>
                    </Tooltip>

                    {/* AI status */}
                    <Tooltip content={aiReady ? 'AI engine ready' : 'AI engine offline'} side="bottom">
                        <div className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors',
                            aiReady
                                ? 'bg-violet-500/[0.06] border-violet-500/15 text-violet-400/80'
                                : 'bg-red-500/[0.06] border-red-500/15 text-red-400/60'
                        )}>
                            <Sparkles className="w-3 h-3" />
                            <span className="text-[9px] font-bold hidden sm:inline">{aiReady ? 'AI' : '—'}</span>
                        </div>
                    </Tooltip>
                </div>
            </div>
        </nav>
    );
}

/* ─── MOBILE BOTTOM NAV — 5 + More ─── */
const MOBILE_PRIMARY = navLinks.slice(0, 4); // Launch, Chat, Missions, Ops

export function RocketMobileNav() {
    const pathname = usePathname();
    const [showMore, setShowMore] = React.useState(false);
    const isSecondaryActive = navLinks.slice(4).some(l => l.href === pathname);

    return (
        <>
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0E14]/95 backdrop-blur-2xl border-t border-white/[0.06]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <div className="grid grid-cols-5 h-[54px]">
                    {MOBILE_PRIMARY.map(link => {
                        const Icon = link.icon;
                        const active = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'relative flex flex-col items-center justify-center gap-1 h-full transition-all duration-200',
                                    active ? 'text-orange-400' : 'text-white/20 active:text-white/35'
                                )}
                                aria-label={link.label}
                            >
                                <div className={cn(
                                    'flex items-center justify-center w-9 h-9 rounded-full transition-all',
                                    active && 'bg-orange-500/12 scale-110'
                                )}>
                                    <Icon className="w-[18px] h-[18px]" />
                                </div>
                                <span className={cn(
                                    'text-[7px] font-bold leading-none tracking-wide',
                                    active ? 'text-orange-400' : 'text-white/15'
                                )}>
                                    {link.shortLabel}
                                </span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => setShowMore(true)}
                        className={cn(
                            'relative flex flex-col items-center justify-center gap-1 h-full transition-all duration-200',
                            isSecondaryActive ? 'text-orange-400' : 'text-white/20 active:text-white/35'
                        )}
                    >
                        <div className="flex items-center justify-center w-9 h-9 rounded-full">
                            <MoreHorizontal className="w-[18px] h-[18px]" />
                        </div>
                        <span className="text-[7px] font-bold leading-none tracking-wide text-white/15">More</span>
                    </button>
                </div>
            </nav>

            {/* More sheet */}
            {showMore && (
                <>
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] md:hidden" onClick={() => setShowMore(false)} />
                    <div className="fixed bottom-0 left-0 right-0 z-[60] md:hidden">
                        <div className="bg-[#0a0a18]/98 backdrop-blur-2xl rounded-t-[20px] border-t border-white/[0.06] shadow-2xl">
                            <div className="flex justify-center py-3"><div className="w-10 h-1 rounded-full bg-white/[0.12]" /></div>
                            <div className="px-5 pb-3 flex items-center justify-between">
                                <span className="text-[13px] font-bold text-white">Navigation</span>
                                <button onClick={() => setShowMore(false)} className="p-2 squircle hover:bg-white/[0.06] text-white/30">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="px-4 pb-4 grid grid-cols-4 gap-2">
                                {navLinks.map(link => {
                                    const Icon = link.icon;
                                    const active = pathname === link.href;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setShowMore(false)}
                                            className={cn(
                                                'flex flex-col items-center gap-2 p-3 squircle transition-all border',
                                                active
                                                    ? 'bg-orange-500/10 border-orange-500/25 text-orange-400'
                                                    : 'bg-white/[0.02] border-white/[0.04] text-white/30 active:bg-white/[0.06]'
                                            )}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="text-[10px] font-bold truncate w-full text-center">{link.shortLabel}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                            <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }} />
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
