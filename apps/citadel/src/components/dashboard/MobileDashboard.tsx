'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Search, Server, Globe, Activity, Rocket, Zap, Ghost, Orbit, CheckCircle2, XCircle, Radio, X, ExternalLink, ChevronRight, Check, Copy } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@matrix-lib/utils';
import { createPortal } from 'react-dom';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
interface AppStatus {
    id: string;
    name: string;
    description: string;
    port: number;
    cloudUrl?: string;
    color: string;
    icon: string;
    image?: string;
    status: 'online' | 'offline' | 'degraded' | 'unconfigured';
    latency?: number;
    mode?: 'cloud' | 'local';
}

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'loading';
}

const ICON_MAP: Record<string, React.ElementType> = {
    Rocket, Zap, Ghost, Orbit, Server
};

/* ═══════════════════════════════════════════════════════
   MOBILE DASHBOARD
   ═══════════════════════════════════════════════════════ */
export const MobileDashboard: React.FC = () => {
    const [apps, setApps] = useState<AppStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    // UI states
    const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
    const [tunnelActive, setTunnelActive] = useState(false);
    const [tunnelCopied, setTunnelCopied] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [activeModalApp, setActiveModalApp] = useState<AppStatus | null>(null);

    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ─── Fetch tunnel status ───
    const fetchTunnel = useCallback(async () => {
        try {
            const res = await fetch('/api/tunnel', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setTunnelUrl(data.url);
                setTunnelActive(data.active);
            }
        } catch { }
    }, []);

    // ─── Fetch app statuses ───
    const fetchApps = useCallback(async () => {
        try {
            const res = await fetch('/api/apps', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setApps(data.apps);
                setLastRefresh(new Date());
            }
        } catch { }
        setLoading(false);
    }, []);

    // ─── Polling ───
    useEffect(() => {
        fetchApps();
        fetchTunnel();
        refreshTimerRef.current = setInterval(() => { fetchApps(); fetchTunnel(); }, 15000);
        return () => {
            if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
        };
    }, [fetchApps, fetchTunnel]);

    // ─── Toast System ───
    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, message, type }]);
        if (type !== 'loading') {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 5000);
        }
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const copyTunnelUrl = useCallback(async () => {
        if (!tunnelUrl) return;
        try {
            await navigator.clipboard.writeText(tunnelUrl);
            setTunnelCopied(true);
            setTimeout(() => setTunnelCopied(false), 2000);
        } catch { }
    }, [tunnelUrl]);

    // ─── App control action (Cloud + Simulated) ───
    const handleAction = useCallback(async (appId: string, action: 'open' | 'health' | 'audit' | 'start' | 'stop' | 'update') => {
        const app = apps.find(a => a.id === appId);
        const appName = app?.name || 'App';

        if (action === 'open') {
            if (app?.cloudUrl) {
                window.open(app.cloudUrl, '_blank');
                addToast(`Opening ${appName} in cloud...`, 'success');
            } else {
                addToast(`${appName} has no cloud URL configured`, 'error');
            }
            return;
        }

        setActionLoading(prev => ({ ...prev, [appId]: true }));
        const toastId = addToast(`Executing ${action} on ${appName}...`, 'loading');

        try {
            const res = await fetch('/api/apps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: appId, action }),
                credentials: 'include',
            });
            const data = await res.json();
            removeToast(toastId);

            if (res.ok && data.success) {
                if (action === 'health' || action === 'audit') {
                    setApps(prev => prev.map(a =>
                        a.id === appId ? { ...a, status: data.status, latency: data.latency } : a
                    ));
                    addToast(`${appName}: ${data.status} (${data.latency}ms)`, 'success');
                } else {
                    addToast(data.message || `${appName} ${action} successful`, 'success');
                }
            } else {
                addToast(data.message || `${appName} action failed`, 'error');
            }
        } catch {
            removeToast(toastId);
            addToast(`Failed to check ${appName} health`, 'error');
        }
        setActionLoading(prev => ({ ...prev, [appId]: false }));
    }, [apps, addToast, removeToast]);

    const handleBatchHealthCheck = useCallback(async () => {
        for (const app of apps) {
            await handleAction(app.id, 'health');
        }
    }, [apps, handleAction]);

    const filteredApps = searchQuery.trim()
        ? apps.filter(a =>
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : apps;

    const onlineCount = apps.filter(a => a.status === 'online').length;
    const totalCount = apps.length;

    return (
        <div className="w-full flex-1 flex flex-col pt-4">

            {/* System Status Metrics Card */}
            <div className="px-4 mb-6 relative z-20">
                <div className="p-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col gap-4 ct-liquid-glass">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", onlineCount === totalCount && totalCount > 0 ? "bg-emerald-400 animate-pulse-slow font-glow-emerald" : "bg-amber-400")} />
                            <span className="text-xs font-mono font-bold tracking-wider uppercase text-white/90">System Status</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-mono text-gold-400/60 bg-gold-500/[0.06] border border-gold-500/10 flex items-center gap-1 shrink-0">
                            <Globe className="w-2.5 h-2.5" />
                            CLOUD MODE
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col gap-1 cursor-pointer hover:bg-white/[0.04] transition-colors" onClick={handleBatchHealthCheck}>
                            <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase flex flex-col sm:flex-row items-start sm:items-center gap-1.5 leading-tight">
                                <Server className="w-3.5 h-3.5" />
                                Apps Online
                            </span>
                            <div className="text-lg font-display font-medium text-white flex items-end gap-1 mt-1">
                                {onlineCount} <span className="text-xs text-white/30 mb-1">/ {totalCount}</span>
                                <Activity className="w-4 h-4 text-emerald-400/50 mb-1 ml-auto" />
                            </div>
                        </div>

                        {tunnelActive && tunnelUrl ? (
                            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col gap-1 cursor-pointer group hover:bg-white/[0.04] transition-colors" onClick={copyTunnelUrl}>
                                <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase flex flex-col sm:flex-row items-start sm:items-center gap-1.5 leading-tight">
                                    <Radio className="w-3.5 h-3.5" />
                                    Tunnel
                                </span>
                                <div className="text-xs font-display font-medium text-gold-400 truncate mt-auto mb-0.5 pr-1 flex items-center justify-between">
                                    {tunnelCopied ? 'Copied!' : tunnelUrl.replace('https://', '')}
                                    {tunnelCopied ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />}
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col gap-1 opacity-50">
                                <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase flex items-center gap-1.5">
                                    <Radio className="w-3.5 h-3.5" />
                                    Tunnel
                                </span>
                                <div className="text-xs font-display font-medium text-white/40 mt-auto mb-0.5">
                                    Offline
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="px-6 mb-8 relative z-20">
                <div className="relative max-w-[340px] mx-auto ct-liquid-glass rounded-2xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search matrix apps..."
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-black/40 border border-white/[0.08] text-sm text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all shadow-inner"
                    />
                </div>
            </div>

            {/* Apps Grid */}
            <div className="flex-1 px-4 pb-32">
                {loading && apps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48">
                        <Loader2 className="w-8 h-8 text-gold-400/40 animate-spin mb-4" />
                        <p className="text-sm text-white/30 font-mono">Loading matrix...</p>
                    </div>
                ) : filteredApps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48">
                        <Search className="w-8 h-8 text-white/10 mb-4" />
                        <p className="text-sm text-white/30 font-mono">No apps matched</p>
                    </div>
                ) : (
                    <div className="max-w-[700px] mx-auto">
                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-10 sm:gap-x-12 sm:gap-y-12">
                            {filteredApps.map((app, i) => (
                                <AppIcon
                                    key={app.id}
                                    app={app}
                                    index={i}
                                    onClick={() => setActiveModalApp(app)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals & Toasts */}
            {activeModalApp && (
                <AppActionModal
                    app={activeModalApp}
                    onClose={() => setActiveModalApp(null)}
                    loading={!!actionLoading[activeModalApp.id]}
                    onAction={(action) => handleAction(activeModalApp.id, action)}
                />
            )}

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

/* ═══════════════════════════════════════════════════════
   APP ICON
   ═══════════════════════════════════════════════════════ */
function AppIcon({
    app,
    index,
    onClick,
}: {
    app: AppStatus;
    index: number;
    onClick: () => void;
}) {
    const Icon = ICON_MAP[app.icon] || Server;
    const isOnline = app.status === 'online';
    const isDegraded = app.status === 'degraded';

    return (
        <div className={cn("flex flex-col items-center gap-3 w-20 animate-slide-up opacity-0 group", `stagger-${index % 10 + 1}`)}>
            <button
                onClick={onClick}
                className={cn(
                    "squircle relative w-16 h-16 flex flex-col items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 shadow-2xl overflow-hidden",
                    isOnline ? "shadow-emerald-500/10" : "shadow-black/60"
                )}
                style={{
                    background: app.image ? '' : `linear-gradient(135deg, ${app.color}, ${app.color}60)`,
                    boxShadow: app.image ? '' : `inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.4), 0 10px 20px -10px ${app.color}80`,
                    border: 'none'
                }}
            >
                {/* Status Indicator */}
                <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full ring-2 ring-black/40 z-40" title={app.status}>
                    <div className={cn(
                        'w-full h-full rounded-full',
                        isOnline ? 'bg-emerald-400 font-glow-emerald animate-pulse-slow' :
                            isDegraded ? 'bg-amber-400 font-glow-amber animate-pulse' : 'bg-white/30'
                    )} />
                </div>

                {isDegraded && <div className="absolute inset-0 rounded-[inherit] border-2 border-amber-400/30 animate-pulse pointer-events-none z-30" />}

                {/* Premium Image Support */}
                {app.image && (
                    <div className="absolute inset-0 z-0 p-1.5">
                        <Image
                            src={app.image}
                            alt={app.name}
                            fill
                            sizes="64px"
                            className={cn(
                                "object-contain transition-opacity",
                                !isOnline && 'grayscale-[0.5] opacity-60'
                            )}
                            loader={({ src }) => src}
                            unoptimized
                        />
                    </div>
                )}

                {/* Native iOS-Style SVG Icon */}
                {!app.image && (
                    <div className={cn(
                        "relative z-10 w-full h-full flex flex-col items-center justify-center transition-transform group-hover:scale-110",
                        !isOnline && "opacity-50"
                    )}>
                        <Icon className="absolute w-8 h-8 text-black/30 blur-[2px] translate-y-[2px]" />
                        <Icon className="relative w-8 h-8 text-white drop-shadow-md z-10" />
                    </div>
                )}

                {/* Glossy Top Highlight */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-[inherit] z-20 pointer-events-none mix-blend-overlay" />
            </button>
            <span className="text-[11px] font-sans font-medium text-white/90 text-center tracking-wide [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] line-clamp-2 leading-tight">
                {app.name}
            </span>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   APP ACTION MODAL
   ═══════════════════════════════════════════════════════ */
function AppActionModal({
    app, onClose, loading, onAction,
}: {
    app: AppStatus; onClose: () => void; loading: boolean; onAction: (action: 'open' | 'health' | 'start' | 'stop' | 'update') => void;
}) {
    const Icon = ICON_MAP[app.icon] || Server;
    const isOnline = app.status === 'online';
    const isUnconfigured = app.status === 'unconfigured';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose} />
            <div className="relative w-full max-w-[340px] glass-gold ct-liquid-glass rounded-3xl overflow-hidden animate-slide-up shadow-2xl flex flex-col border border-white/[0.08]">

                <div className="p-5 pb-4 flex items-center justify-between border-b border-white/[0.04] bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: `${app.color}15`, border: `1px solid ${app.color}25` }}>
                            <Icon className="w-6 h-6" style={{ color: app.color }} />
                        </div>
                        <div>
                            <h3 className="text-base font-display font-bold text-white tracking-wide">{app.name}</h3>
                            <span className={cn('text-[10px] font-mono uppercase tracking-wider', isOnline ? 'text-emerald-400' : 'text-white/40')}>
                                {app.status} • Cloud
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-2 border-b border-white/[0.04] bg-black/20">
                    <button
                        onClick={() => { onAction('open'); onClose(); }}
                        disabled={isUnconfigured}
                        className={cn(
                            "w-full min-h-11 flex items-center justify-between p-4 rounded-2xl text-sm font-bold transition-all shadow-lg",
                            isOnline ? "text-white bg-gold-500/20 border border-gold-500/30 hover:bg-gold-500/30" : "text-white/50 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]",
                            "disabled:opacity-30 disabled:cursor-not-allowed"
                        )}
                    >
                        <span className="flex items-center gap-3">
                            <ExternalLink className="w-5 h-5 text-gold-400" />
                            {isOnline ? 'Launch Application' : isUnconfigured ? 'Not Configured' : 'Open Anyway'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gold-400/40" />
                    </button>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {!isOnline ? (
                            <button
                                onClick={() => { onAction('start'); onClose(); }}
                                disabled={loading || isUnconfigured}
                                className="w-full min-h-11 flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                            >
                                <Zap className="w-4 h-4" /> Start Server
                            </button>
                        ) : (
                            <button
                                onClick={() => { onAction('stop'); onClose(); }}
                                disabled={loading}
                                className="w-full min-h-11 flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                            >
                                <XCircle className="w-4 h-4" /> Stop Server
                            </button>
                        )}
                        <button
                            onClick={() => { onAction('update'); onClose(); }}
                            disabled={loading || isUnconfigured}
                            className="w-full min-h-11 flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all disabled:opacity-50"
                        >
                            <Rocket className="w-4 h-4" /> Update App
                        </button>
                    </div>

                    <button
                        onClick={() => { onAction('health'); onClose(); }}
                        disabled={loading || isUnconfigured}
                        className="w-full min-h-11 flex items-center justify-between p-3 rounded-xl text-sm font-medium text-white/70 border border-transparent hover:border-emerald-500/20 hover:text-emerald-400 hover:bg-emerald-400/[0.04] transition-colors disabled:opacity-50 mt-2"
                    >
                        <span className="flex items-center gap-3">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Activity className="w-4 h-4 text-emerald-400/50" />}
                            Run Diagnostic Check
                        </span>
                        {app.latency != null && <span className="text-[10px] font-mono text-emerald-400/60">{app.latency}ms</span>}
                    </button>
                </div>

                <button onClick={onClose} className="absolute top-4 right-4 h-11 w-11 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
   ═══════════════════════════════════════════════════════ */
function ToastContainer({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) {
    if (typeof window === 'undefined') return null;
    return createPortal(
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-[340px] px-4">
            {toasts.map((toast) => (
                <div key={toast.id} className={cn(
                    "pointer-events-auto ct-liquid-glass flex items-center gap-3 p-3 rounded-2xl shadow-xl border backdrop-blur-md animate-slide-up",
                    toast.type === 'loading' ? "bg-black/90 border-blue-500/20" :
                        toast.type === 'success' ? "bg-black/90 border-emerald-500/20" :
                            toast.type === 'error' ? "bg-black/90 border-red-500/20" : "bg-black/90 border-white/10"
                )}>
                    {toast.type === 'loading' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />}
                    {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {toast.type === 'error' && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    {toast.type === 'info' && <Radio className="w-4 h-4 text-white/40 shrink-0" />}
                    <span className="text-xs font-medium text-white/90 truncate flex-1">{toast.message}</span>
                    <button onClick={() => removeToast(toast.id)} className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-white/10 shrink-0"><X className="w-3 h-3 text-white/40" /></button>
                </div>
            ))}
        </div>,
        document.body
    );
}

