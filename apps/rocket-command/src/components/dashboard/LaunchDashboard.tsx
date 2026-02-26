'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    Rocket, MessageSquare, Target, Radio, Zap, Cpu, HardDrive,
    Activity, ArrowUpRight, Shield, Wifi, Clock,
    Terminal, ExternalLink, Settings, Sparkles, Send,
    TrendingUp, TrendingDown, Loader2, X, ChevronRight,
    Globe, Copy, Check, Power, RefreshCw
} from 'lucide-react';
import { useRocket, useGlobalUptime } from '@/components/providers/RocketProvider';
import { RocketSurface, RocketButton } from '@/components/ui/RocketSurface';
import { Tooltip as InfoTooltip } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/Toast';
import { SageHealth } from '@/components/dashboard/SageHealth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

/* ── Types ── */
interface SystemEvent {
    id: string;
    event_type: string;
    message: string;
    severity: string;
    created_at: string;
}

/* ═══════════════════════════════════════════════════════
   OPERATOR HUB — Mission Briefing Dashboard
   Purpose: At-a-glance health, AI assist, activity feed
   Service management → Operations Center (SOLE owner)
   Metrics & charts  → Telemetry Deck (SOLE owner)
   ═══════════════════════════════════════════════════════ */

export default function LaunchDashboard() {
    const { services: rocketServices, cpu, memory, isConnected, broadcasts } = useRocket();
    const uptime = useGlobalUptime();
    const toast = useToast();

    /* ── Delta indicators for CPU/Memory trends ── */
    const prevRef = useRef({ cpu: 0, memory: 0 });
    const [cpuDelta, setCpuDelta] = useState(0);
    const [memDelta, setMemDelta] = useState(0);
    useEffect(() => {
        if (prevRef.current.cpu > 0) {
            setCpuDelta(cpu - prevRef.current.cpu);
            setMemDelta(memory - prevRef.current.memory);
        }
        prevRef.current = { cpu, memory };
    }, [cpu, memory]);

    /* ── Tunnel state ── */
    const [tunnelUrls, setTunnelUrls] = useState<Record<string, string>>({});
    const [showTunnelPanel, setShowTunnelPanel] = useState(false);
    const [tunnelAction, setTunnelAction] = useState<'idle' | 'starting' | 'stopping'>('idle');
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const tunnelCount = Object.keys(tunnelUrls).length;

    const fetchTunnels = useCallback(async () => {
        try {
            const res = await fetch('/api/tunnels');
            const data = await res.json();
            setTunnelUrls(data.tunnels || data.urls || {});
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchTunnels();
        const iv = setInterval(fetchTunnels, 30000);
        return () => clearInterval(iv);
    }, [fetchTunnels]);

    const handleTunnelAction = useCallback(async (action: 'start' | 'stop') => {
        setTunnelAction(action === 'start' ? 'starting' : 'stopping');
        try {
            const res = await fetch('/api/tunnels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(action === 'start' ? 'Tunnels launching' : 'Tunnels stopped', data.message);
                // Poll for URL updates after start
                if (action === 'start') {
                    const poll = setInterval(async () => { await fetchTunnels(); }, 3000);
                    setTimeout(() => clearInterval(poll), 30000);
                } else {
                    setTunnelUrls({});
                }
            } else {
                toast.error('Tunnel action failed', data.error || 'Unknown error');
            }
        } catch (err: unknown) {
            toast.error('Tunnel error', (err instanceof Error ? err.message : String(err)));
        } finally {
            setTimeout(() => setTunnelAction('idle'), 2000);
        }
    }, [fetchTunnels, toast]);

    const copyTunnelUrl = useCallback((url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    }, []);

    const onlineCount = Object.values(rocketServices).filter(s => s === 'online').length;
    const totalCount = Object.keys(rocketServices).length || 4;

    /* ══════════════════════════════════════════
       System Health Score (0–100)
       Composite metric across all signals
       ══════════════════════════════════════════ */
    const systemScore = (() => {
        let score = 0;
        score += (onlineCount / totalCount) * 40;          // Services: 0-40
        score += Math.max(0, 20 - (cpu / 5));              // CPU: 0-20  (low = good)
        score += Math.max(0, 20 - (memory / 5));           // Memory: 0-20
        if (isConnected) score += 10;                       // WebSocket: 0-10
        if (tunnelCount > 0) score += 10;                   // Tunnels: 0-10
        return Math.min(100, Math.round(score));
    })();

    const scoreColor = systemScore >= 80 ? 'text-emerald-400' : systemScore >= 50 ? 'text-amber-400' : 'text-red-400';
    const scoreLabel = systemScore >= 90 ? 'OPTIMAL' : systemScore >= 70 ? 'GOOD' : systemScore >= 50 ? 'DEGRADED' : 'CRITICAL';

    /* ══════════════════════════════════════════
       AI Quick Assist
       One-click system queries via Groq
       ══════════════════════════════════════════ */
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    const askAI = useCallback(async (prompt: string) => {
        setAiLoading(true);
        setAiResponse(null);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'You are a concise system assistant for RocketCommand. Give brief, actionable answers in 2-4 sentences. Use technical precision.' },
                        { role: 'user', content: prompt },
                    ],
                    context: { services: rocketServices, cpu, memory, agent: 'antigravity' },
                }),
            });
            const data = await res.json();
            setAiResponse(data.content || data.error || 'No response');
        } catch {
            setAiResponse('⚠ AI unavailable — check Groq API key');
        }
        setAiLoading(false);
    }, [rocketServices, cpu, memory]);

    const quickQueries = [
        { label: '🩺 Health Check', prompt: `System health report. Services: ${JSON.stringify(rocketServices)}, CPU: ${cpu}%, Memory: ${memory}%, WebSocket: ${isConnected ? 'connected' : 'disconnected'}. What needs attention?` },
        { label: '⚡ Optimize', prompt: `CPU is at ${cpu}%, memory at ${memory}%. ${onlineCount}/${totalCount} services online. Suggest concrete optimizations.` },
        { label: '🔒 Security Scan', prompt: 'Run a conceptual security audit for a Next.js app ecosystem on Windows with Supabase, Cloudflare tunnels, and Ollama. Flag risks.' },
        { label: '📋 Action Plan', prompt: `Given ${onlineCount}/${totalCount} services up, ${cpu}% CPU, ${memory}% memory, generate a prioritized action plan for the next hour.` },
    ];

    /* ══════════════════════════════════════════
       Activity Feed — Supabase events + broadcasts
       Unified timeline from all sources
       ══════════════════════════════════════════ */
    const [events, setEvents] = useState<SystemEvent[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const { data } = await supabase
                    .from('system_events')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(15);
                if (data) setEvents(data as SystemEvent[]);
            } catch { /* silent */ }
            setEventsLoading(false);
        };
        fetchEvents();
        const iv = setInterval(fetchEvents, 30000);
        return () => clearInterval(iv);
    }, []);

    const activityFeed = [
        ...events.map(e => ({
            id: e.id,
            type: e.event_type,
            message: e.message,
            severity: e.severity,
            time: new Date(e.created_at),
            source: 'event' as const,
        })),
        ...broadcasts.slice(-10).map(b => ({
            id: b.id,
            type: b.event || b.type || 'broadcast',
            message: b.source || 'System pulse',
            severity: 'info',
            time: new Date(b.timestamp),
            source: 'broadcast' as const,
        })),
    ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 20);

    /* ── Navigation Cards ── */
    const quickLinks = [
        { href: '/operations', label: 'Operations', desc: 'Fleet control & commands', icon: Terminal, color: 'text-orange-400', border: 'border-orange-500/20 hover:border-orange-500/40', stat: `${onlineCount}/${totalCount} services` },
        { href: '/chat', label: 'AI Chat', desc: 'Antigravity AI agents', icon: MessageSquare, color: 'text-cyan-400', border: 'border-cyan-500/20 hover:border-cyan-500/40', stat: 'Groq LLaMA 3' },
        { href: '/mission-control', label: 'Missions', desc: 'Task management', icon: Target, color: 'text-violet-400', border: 'border-violet-500/20 hover:border-violet-500/40', stat: 'Supabase RT' },
        { href: '/telemetry', label: 'Telemetry', desc: 'Metrics & analytics', icon: Radio, color: 'text-emerald-400', border: 'border-emerald-500/20 hover:border-emerald-500/40', stat: `${cpu}% CPU` },
        { href: '/settings', label: 'Settings', desc: 'Appearance & config', icon: Settings, color: 'text-amber-400', border: 'border-amber-500/20 hover:border-amber-500/40', stat: '20+ options' },
    ];

    /* ═══════════════════════════════════════════
       RENDER
       ═══════════════════════════════════════════ */
    return (
        <div className="p-4 md:p-6 xl:p-8 max-w-[1920px] mx-auto space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/15 flex items-center justify-center shadow-[0_0_20px_rgba(255,107,53,0.1)] animate-breathe">
                            <Rocket className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-display font-bold text-white">Operator Hub</h1>
                                <span className="text-[9px] font-mono text-orange-400/50 bg-orange-500/5 px-1.5 py-0.5 rounded-md border border-orange-500/10">PRO v3.0</span>
                            </div>
                            <p className="text-sm text-white/40">Mission briefing &amp; system overview</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <Clock className="w-3.5 h-3.5 text-orange-400/60" />
                        <span className="text-xs font-mono text-white/50">{uptime}</span>
                    </div>
                    <InfoTooltip content={tunnelCount > 0 ? `${tunnelCount} tunnel${tunnelCount > 1 ? 's' : ''} active — click to manage` : 'No tunnels — click to launch'}>
                        <button
                            onClick={() => setShowTunnelPanel(p => !p)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all',
                                tunnelCount > 0
                                    ? 'bg-cyan-500/5 border border-cyan-500/15 hover:border-cyan-500/30 hover:bg-cyan-500/10'
                                    : 'bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05]',
                                showTunnelPanel && 'ring-1 ring-cyan-500/30'
                            )}
                        >
                            <Globe className={cn('w-3.5 h-3.5', tunnelCount > 0 ? 'text-cyan-400' : 'text-white/40')} />
                            <span className={cn('text-xs font-medium', tunnelCount > 0 ? 'text-cyan-400' : 'text-white/40')}>
                                {tunnelCount > 0 ? `${tunnelCount} TUNNELS` : 'TUNNELS'}
                            </span>
                        </button>
                    </InfoTooltip>
                    <InfoTooltip content={isConnected ? 'Supabase realtime connected — live data active' : 'WebSocket disconnected — data may be stale'}>
                        <div className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                            isConnected ? 'bg-emerald-500/5 border border-emerald-500/15' : 'bg-red-500/5 border border-red-500/15'
                        )}>
                            <Wifi className={cn('w-3.5 h-3.5', isConnected ? 'text-emerald-400' : 'text-red-400')} />
                            <span className={cn('text-xs font-medium', isConnected ? 'text-emerald-400' : 'text-red-400')}>
                                {isConnected ? 'LINKED' : 'OFFLINE'}
                            </span>
                        </div>
                    </InfoTooltip>
                </div>
            </div>

            {/* ── Tunnel Quick-View Panel ── */}
            {showTunnelPanel && (
                <RocketSurface variant="neon" className="p-4 relative overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-white/70">Cloudflare Tunnels</h3>
                            <span className={cn('text-[9px] font-mono px-1.5 py-0.5 rounded-md',
                                tunnelCount > 0 ? 'text-cyan-400/60 bg-cyan-500/10' : 'text-white/25 bg-white/[0.04]'
                            )}>
                                {tunnelCount > 0 ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchTunnels()}
                                className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setShowTunnelPanel(false)}
                                className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Tunnel URLs */}
                    {tunnelCount > 0 ? (
                        <div className="space-y-2 mb-3">
                            {Object.entries(tunnelUrls).map(([app, url]) => (
                                <div key={app} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] group hover:border-cyan-500/20 transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs font-semibold text-white/70 capitalize">{app}</span>
                                        <p className="text-[11px] text-cyan-400/70 font-mono truncate">{url}</p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                                        <InfoTooltip content="Copy URL">
                                            <button
                                                onClick={() => copyTunnelUrl(String(url))}
                                                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
                                            >
                                                {copiedUrl === url ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </InfoTooltip>
                                        <InfoTooltip content="Open in browser">
                                            <a
                                                href={String(url)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-cyan-400 transition-colors"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </InfoTooltip>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 mb-3">
                            <Globe className="w-8 h-8 text-white/[0.06] mx-auto mb-2" />
                            <p className="text-xs text-white/25">No active tunnels</p>
                            <p className="text-[10px] text-white/15 mt-0.5">Launch tunnels to access your apps remotely</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <RocketButton
                            variant="primary"
                            size="sm"
                            onClick={() => handleTunnelAction('start')}
                            disabled={tunnelAction !== 'idle'}
                            icon={tunnelAction === 'starting' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
                        >
                            {tunnelAction === 'starting' ? 'Launching...' : tunnelCount > 0 ? 'Relaunch' : 'Start Tunnels'}
                        </RocketButton>
                        {tunnelCount > 0 && (
                            <RocketButton
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTunnelAction('stop')}
                                disabled={tunnelAction !== 'idle'}
                                icon={tunnelAction === 'stopping' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                            >
                                {tunnelAction === 'stopping' ? 'Stopping...' : 'Stop All'}
                            </RocketButton>
                        )}
                        <div className="flex-1" />
                        <Link href="/operations" className="text-[10px] text-white/25 hover:text-white/50 transition-colors flex items-center gap-1">
                            Full tunnel management <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                </RocketSurface>
            )}

            {/* ── System Score + Vitals ── */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* System Health Score */}
                <RocketSurface variant="neon" className="md:col-span-2 p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 blur-2xl -translate-y-8 translate-x-8"
                        style={{ background: systemScore >= 80 ? 'radial-gradient(circle, rgba(52,211,153,0.3), transparent)' : systemScore >= 50 ? 'radial-gradient(circle, rgba(251,191,36,0.3), transparent)' : 'radial-gradient(circle, rgba(248,113,113,0.3), transparent)' }} />
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-white/40" />
                        <span className="text-[11px] text-white/40 uppercase tracking-wide">System Health Score</span>
                    </div>
                    <div className="flex items-end gap-4">
                        <div className="relative">
                            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                                <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                                <circle cx="36" cy="36" r="30" fill="none"
                                    stroke={systemScore >= 80 ? '#34d399' : systemScore >= 50 ? '#fbbf24' : '#f87171'}
                                    strokeWidth="6" strokeLinecap="round"
                                    strokeDasharray={`${(systemScore / 100) * 188.5} 188.5`}
                                    className="transition-all duration-1000" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className={cn('text-2xl font-display font-bold', scoreColor)}>{systemScore}</span>
                            </div>
                        </div>
                        <div className="pb-2">
                            <span className={cn('text-xs font-mono font-semibold px-2 py-0.5 rounded-md', scoreColor,
                                systemScore >= 80 ? 'bg-emerald-500/10' : systemScore >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10'
                            )}>{scoreLabel}</span>
                            <p className="text-[10px] text-white/30 mt-1.5 leading-relaxed">
                                {systemScore >= 80 ? 'All systems nominal' : systemScore >= 50 ? 'Some issues need attention' : 'Critical systems offline'}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-5 gap-1 mt-4">
                        {[
                            { label: 'Fleet', ok: onlineCount === totalCount },
                            { label: 'CPU', ok: cpu < 80 },
                            { label: 'Memory', ok: memory < 80 },
                            { label: 'Link', ok: isConnected },
                            { label: 'Tunnel', ok: tunnelCount > 0 },
                        ].map(item => (
                            <div key={item.label} className="text-center">
                                <div className={cn('w-1.5 h-1.5 rounded-full mx-auto mb-1', item.ok ? 'bg-emerald-400' : 'bg-red-400/60')} />
                                <span className="text-[9px] text-white/25">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </RocketSurface>

                {/* Compact Vitals */}
                <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3">
                    {/* Fleet */}
                    <RocketSurface className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-3.5 h-3.5 text-emerald-400/60" />
                            <span className="text-[10px] text-white/30 uppercase">Fleet</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-display font-bold text-white">{onlineCount}</span>
                            <span className="text-sm text-white/25">/ {totalCount}</span>
                        </div>
                        <span className={cn('text-[10px] font-mono', onlineCount === totalCount ? 'text-emerald-400/60' : 'text-amber-400/60')}>
                            {onlineCount === totalCount ? 'All responding' : `${totalCount - onlineCount} offline`}
                        </span>
                    </RocketSurface>

                    {/* CPU */}
                    <RocketSurface className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Cpu className="w-3.5 h-3.5 text-cyan-400/60" />
                            <span className="text-[10px] text-white/30 uppercase">CPU</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-display font-bold text-white">{cpu || 0}%</span>
                            {cpuDelta !== 0 && (
                                <span className={cn('text-[10px] font-mono flex items-center gap-0.5',
                                    cpuDelta > 0 ? 'text-red-400/70' : 'text-emerald-400/70'
                                )}>
                                    {cpuDelta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(cpuDelta)}%
                                </span>
                            )}
                        </div>
                        <div className="mt-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full transition-all duration-500',
                                cpu > 80 ? 'bg-red-400' : 'bg-cyan-400'
                            )} style={{ width: `${cpu || 0}%` }} />
                        </div>
                    </RocketSurface>

                    {/* Memory */}
                    <RocketSurface className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <HardDrive className="w-3.5 h-3.5 text-violet-400/60" />
                            <span className="text-[10px] text-white/30 uppercase">Memory</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-display font-bold text-white">{memory || 0}%</span>
                            {memDelta !== 0 && (
                                <span className={cn('text-[10px] font-mono flex items-center gap-0.5',
                                    memDelta > 0 ? 'text-red-400/70' : 'text-emerald-400/70'
                                )}>
                                    {memDelta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(memDelta)}%
                                </span>
                            )}
                        </div>
                        <div className="mt-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full transition-all duration-500',
                                memory > 80 ? 'bg-red-400' : 'bg-violet-400'
                            )} style={{ width: `${memory || 0}%` }} />
                        </div>
                    </RocketSurface>
                </div>
            </div>

            {/* ── AI Quick Assist ── */}
            <RocketSurface variant="neon" className="p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/30 to-transparent" />
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white/70">AI Quick Assist</h3>
                    <span className="text-[9px] font-mono text-orange-400/40 bg-orange-500/5 px-1.5 py-0.5 rounded-md">Groq</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                    {quickQueries.map(q => (
                        <button
                            key={q.label}
                            onClick={() => askAI(q.prompt)}
                            disabled={aiLoading}
                            className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-orange-500/25 hover:bg-white/[0.06] text-xs text-white/60 hover:text-white/80 transition-all disabled:opacity-40 disabled:cursor-wait"
                        >
                            {q.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <input
                        value={aiQuery}
                        onChange={e => setAiQuery(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && aiQuery.trim()) { askAI(aiQuery); setAiQuery(''); } }}
                        placeholder="Ask anything about your system..."
                        disabled={aiLoading}
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-orange-500/30 disabled:opacity-50"
                    />
                    <RocketButton
                        variant="primary" size="sm"
                        onClick={() => { if (aiQuery.trim()) { askAI(aiQuery); setAiQuery(''); } }}
                        disabled={!aiQuery.trim() || aiLoading}
                        icon={aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    >
                        Ask
                    </RocketButton>
                </div>

                {(aiResponse || aiLoading) && (
                    <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] relative">
                        {aiLoading ? (
                            <div className="flex items-center gap-2 py-2">
                                <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                                <span className="text-xs text-white/40">Analyzing system state...</span>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => setAiResponse(null)}
                                    className="absolute top-2 right-2 p-1 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.04]"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                                <div className="flex items-start gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-orange-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-white/70 leading-relaxed pr-6 whitespace-pre-wrap">{aiResponse}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <Link href="/chat" className="text-[10px] text-orange-400/60 hover:text-orange-400 transition-colors flex items-center gap-1">
                                        Continue in Chat <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </RocketSurface>

            {/* ── Activity Feed + Sage Health ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RocketSurface className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-orange-400" />
                            Activity Feed
                        </h3>
                        <span className="text-[10px] font-mono text-white/20">{activityFeed.length} entries</span>
                    </div>
                    {eventsLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-10 bg-white/[0.02] rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : activityFeed.length === 0 ? (
                        <div className="text-center py-8">
                            <Radio className="w-8 h-8 text-white/10 mx-auto mb-2" />
                            <p className="text-xs text-white/25">No recent activity</p>
                        </div>
                    ) : (
                        <div className="space-y-1 max-h-[280px] overflow-y-auto">
                            {activityFeed.map(item => (
                                <div key={item.id} className="flex items-start gap-2.5 py-2 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.03] transition-colors">
                                    <div className={cn(
                                        'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                                        item.severity === 'critical' || item.severity === 'error' ? 'bg-red-400' :
                                        item.severity === 'warning' ? 'bg-amber-400' :
                                        item.source === 'broadcast' ? 'bg-violet-400' : 'bg-emerald-400'
                                    )} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-medium text-white/60 truncate">{item.type}</span>
                                            <span className="text-[9px] text-white/15 font-mono px-1 bg-white/[0.03] rounded">
                                                {item.source === 'broadcast' ? 'BC' : 'EVT'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-white/30 truncate">{item.message}</p>
                                    </div>
                                    <span className="text-[10px] text-white/15 font-mono flex-shrink-0">
                                        {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </RocketSurface>

                <SageHealth />
            </div>

            {/* ── Navigation Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 stagger-children">
                {quickLinks.map(link => {
                    const Icon = link.icon;
                    return (
                        <Link key={link.href} href={link.href}>
                            <RocketSurface hover className={cn('p-4 h-full', link.border)}>
                                <div className="flex items-center gap-2.5 mb-2">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.04]">
                                        <Icon className={cn('w-5 h-5', link.color)} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-white/80">{link.label}</h3>
                                        <p className="text-[10px] text-white/30">{link.desc}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-white/20">{link.stat}</span>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-white/15" />
                                </div>
                            </RocketSurface>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
