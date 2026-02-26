'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Shield, LogOut, Settings, RefreshCw, ExternalLink, Play, Square,
    RotateCcw, Loader2, Search, Power, ChevronRight, X, Clock,
    Wifi, WifiOff, Activity, Cpu, Server, Rocket, Zap, Ghost, Orbit,
    ShieldCheck, Timer, Monitor, Globe, CheckCircle2, AlertCircle,
    PlayCircle, StopCircle, ChevronDown, LayoutGrid, List,
    Link2, Copy, Check, Radio, Wrench, ArrowUpCircle,
    Eraser, SearchCheck, XCircle, HardDrive
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@matrix-lib/utils';
import { createPortal } from 'react-dom';

/* ═══════════════════════════════════════════════════════
   CITADEL APP DRAWER v1.0 — Premium app management
   Grid of app cards with live status, start/stop/restart
   Settings panel, quick actions, system overview
   ═══════════════════════════════════════════════════════ */

interface AppStatus {
    id: string;
    name: string;
    description: string;
    port: number;
    color: string;
    icon: string;
    image?: string;
    status: 'online' | 'offline' | 'starting' | 'stopping' | 'building' | 'optimizing' | 'upgrading' | 'cleaning' | 'auditing';
}

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'loading';
}

const ICON_MAP: Record<string, React.ElementType> = {
    Rocket, Zap, Ghost, Orbit,
};

const REFRESH_OPTIONS = [
    { label: '5s', value: 5000 },
    { label: '10s', value: 10000 },
    { label: '30s', value: 30000 },
    { label: '60s', value: 60000 },
];

export function AppDrawer({ onClose }: { onClose?: () => void }) {
    const router = useRouter();
    const { username, logout } = useAuth();
    const [apps, setApps] = useState<AppStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshInterval, setRefreshInterval] = useState(10000);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // UI states
    const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
    const [tunnelActive, setTunnelActive] = useState(false);
    const [tunnelCopied, setTunnelCopied] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [activeModalApp, setActiveModalApp] = useState<AppStatus | null>(null);

    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

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

    // ─── Copy tunnel URL ───
    const copyTunnelUrl = useCallback(async () => {
        if (!tunnelUrl) return;
        try {
            await navigator.clipboard.writeText(tunnelUrl);
            setTunnelCopied(true);
            setTimeout(() => setTunnelCopied(false), 2000);
        } catch { }
    }, [tunnelUrl]);

    // ─── Fetch app statuses ───
    const fetchApps = useCallback(async () => {
        try {
            const res = await fetch('/api/apps', { credentials: 'include' });
            if (res.status === 401) {
                router.push('/');
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setApps(data.apps);
                setLastRefresh(new Date());
            }
        } catch { }
        setLoading(false);
    }, [router]);

    // ─── Polling ───
    useEffect(() => {
        fetchApps();
        fetchTunnel();
        refreshTimerRef.current = setInterval(() => { fetchApps(); fetchTunnel(); }, refreshInterval);
        return () => {
            if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
        };
    }, [fetchApps, fetchTunnel, refreshInterval]);

    // ─── Close user menu on outside click ───
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

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

    // ─── Super Refresh (Manual Cache Purge) ───
    const handleSystemSync = useCallback(async () => {
        const toastId = addToast('Performing System Hard Sync...', 'loading');
        try {
            // 1. Unregister all service workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
            }
            // 2. Clear Caches if available
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                for (let name of cacheNames) {
                    await caches.delete(name);
                }
            }
            addToast('System Sync Complete. Reloading...', 'success');
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            console.error('[Sync] Failed:', err);
            addToast('Sync failed. Please clear browser cache manually.', 'error');
        } finally {
            removeToast(toastId);
        }
    }, [addToast, removeToast]);

    // ─── App control action ───
    const handleAction = useCallback(async (appId: string, action: 'start' | 'stop' | 'restart' | 'build' | 'optimize' | 'upgrade' | 'clean' | 'audit') => {
        setActionLoading(prev => ({ ...prev, [appId]: true }));
        const appName = apps.find(a => a.id === appId)?.name || 'App';

        let toastMsg = `Executing ${action} on ${appName}...`;
        if (action === 'start') toastMsg = `Starting ${appName}...`;
        if (action === 'stop') toastMsg = `Stopping ${appName}...`;
        if (action === 'build') toastMsg = `Building ${appName}...`;
        if (action === 'clean') toastMsg = `Cleaning cache for ${appName}...`;

        const toastId = addToast(toastMsg, 'loading');

        // Optimistic UI: show transitional state
        let nextStatus: AppStatus['status'] = action === 'stop' ? 'stopping' : 'starting';
        if (action === 'build') nextStatus = 'building';
        if (action === 'optimize') nextStatus = 'optimizing';
        if (action === 'upgrade') nextStatus = 'upgrading';
        if (action === 'clean') nextStatus = 'cleaning';
        if (action === 'audit') nextStatus = 'auditing';

        setApps(prev => prev.map(a =>
            a.id === appId ? { ...a, status: nextStatus } : a
        ));

        try {
            const res = await fetch('/api/apps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: appId, action }),
                credentials: 'include',
            });

            if (res.ok) {
                const data = await res.json();
                setApps(prev => prev.map(a =>
                    a.id === appId ? { ...a, status: data.status } : a
                ));
                removeToast(toastId);
                if (action !== 'stop' && action !== 'start' && action !== 'restart') {
                    addToast(`Task started: ${action} on ${appName}`, 'success');
                } else {
                    addToast(`${appName} is now ${data.status}`, 'success');
                }
            } else {
                throw new Error('Failed');
            }
        } catch {
            removeToast(toastId);
            addToast(`Failed to ${action} ${appName}`, 'error');
            // Revert optimisitic update on fetchApps tick
        }

        setActionLoading(prev => ({ ...prev, [appId]: false }));
    }, [apps, addToast, removeToast]);

    // ─── Batch actions ───
    const handleBatchAction = useCallback(async (action: 'start' | 'stop') => {
        const targets = apps.filter(a =>
            action === 'start' ? a.status === 'offline' : a.status === 'online'
        );
        for (const app of targets) {
            await handleAction(app.id, action);
        }
    }, [apps, handleAction]);

    // ─── Logout ───
    const handleLogout = useCallback(async () => {
        await logout();
        router.push('/');
    }, [logout, router]);

    // ─── Filtered apps ───
    const filteredApps = searchQuery.trim()
        ? apps.filter(a =>
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : apps;

    const onlineCount = apps.filter(a => a.status === 'online').length;
    const totalCount = apps.length;

    return (
        <div className="h-screen flex flex-col bg-[#06060f] relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 citadel-mesh pointer-events-none" />
            <div className="fixed inset-0 citadel-grid pointer-events-none opacity-30" />

            {/* ═══ HEADER ═══ */}
            <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 pb-3 pt-[max(1.25rem,calc(var(--safe-top) + 0.5rem))] border-b border-white/[0.06] bg-[#06060f]/80 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold-500/30 via-gold-600/10 to-transparent border border-gold-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(212,168,67,0.15)] group hover:shadow-[0_0_30px_rgba(212,168,67,0.3)] transition-all">
                        <Shield className="w-5 h-5 text-gold-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-sm font-display font-black tracking-[0.2em] text-white uppercase leading-none">
                            <span className="text-gold-400">Citadel</span> OS
                        </h1>
                        <p className="text-[9px] text-white/30 font-mono tracking-widest uppercase mt-0.5">Sovereign Command Center</p>
                    </div>
                </div>

                {/* Search */}
                <div className="flex-1 max-w-[300px] mx-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search apps..."
                            className="input-citadel w-full pl-9 pr-3 py-2 rounded-lg text-xs font-mono"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Refresh */}
                    <button
                        onClick={fetchApps}
                        className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
                        title="Refresh statuses"
                    >
                        <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                    </button>

                    {/* Settings */}
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
                        title="Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </button>

                    {/* Close Drawer (If rendered as overlay) */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 ml-2 rounded-lg text-white/40 hover:text-white hover:bg-red-500/20 hover:text-red-400 transition-colors"
                            title="Close App Drawer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}

                    {/* User menu */}
                    <div className="relative ml-2" ref={userMenuRef}>
                        <button
                            onClick={() => setShowUserMenu(v => !v)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                        >
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-500/30 to-gold-700/10 border border-gold-500/15 flex items-center justify-center">
                                <span className="text-xs font-mono font-bold text-gold-400 uppercase">
                                    {username?.[0] || 'O'}
                                </span>
                            </div>
                            <ChevronDown className="w-3 h-3 text-white/20" />
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 top-full mt-1 w-48 py-1 rounded-xl glass-gold shadow-xl shadow-black/30 z-50 animate-fade-in">
                                <div className="px-3 py-2 border-b border-white/[0.06]">
                                    <p className="text-xs font-mono text-gold-400">{username}</p>
                                    <p className="text-[10px] text-white/20">Active session</p>
                                </div>
                                <button
                                    onClick={() => { setShowUserMenu(false); setSettingsOpen(true); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors"
                                >
                                    <Settings className="w-3.5 h-3.5" />
                                    Settings
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.04] transition-colors"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ═══ SYSTEM STATUS BAR ═══ */}
            <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-2 border-b border-white/[0.04] bg-white/[0.01] shrink-0">
                <div className="flex items-center gap-4 text-[11px] font-mono">
                    <span className="flex items-center gap-1.5 text-white/30">
                        <Server className="w-3 h-3" />
                        {totalCount} Apps
                    </span>
                    <span className={cn(
                        'flex items-center gap-1.5',
                        onlineCount === totalCount ? 'text-emerald-400/60' : 'text-amber-400/60'
                    )}>
                        <div className={onlineCount === totalCount ? 'status-online' : 'status-offline'} style={{ width: 6, height: 6 }} />
                        {onlineCount} Online
                    </span>
                    {tunnelActive && tunnelUrl && (
                        <button
                            onClick={copyTunnelUrl}
                            className="flex items-center gap-1.5 text-gold-400/60 hover:text-gold-400 transition-colors group"
                            title="Click to copy public URL"
                        >
                            <Radio className="w-3 h-3 animate-pulse" />
                            <span className="hidden sm:inline truncate max-w-[180px] text-[11px]">
                                {tunnelCopied ? 'Copied!' : tunnelUrl.replace('https://', '')}
                            </span>
                            {tunnelCopied
                                ? <Check className="w-3 h-3 text-emerald-400" />
                                : <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            }
                        </button>
                    )}
                    {lastRefresh && (
                        <span className="flex items-center gap-1.5 text-white/20 hidden sm:flex">
                            <Clock className="w-3 h-3" />
                            Updated {lastRefresh.toLocaleTimeString()}
                        </span>
                    )}
                </div>

                {/* Quick batch actions */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => handleBatchAction('start')}
                        disabled={onlineCount === totalCount}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/[0.06] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                        <PlayCircle className="w-3 h-3" />
                        Start All
                    </button>
                    <button
                        onClick={() => handleBatchAction('stop')}
                        disabled={onlineCount === 0}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono text-red-400/50 hover:text-red-400 hover:bg-red-500/[0.06] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                        <StopCircle className="w-3 h-3" />
                        Stop All
                    </button>
                </div>
            </div>

            {/* ═══ MAIN CONTENT ═══ */}
            <main className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6">
                {loading && apps.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 text-gold-400/40 animate-spin mx-auto mb-3" />
                            <p className="text-sm text-white/20 font-mono">Loading apps...</p>
                        </div>
                    </div>
                ) : filteredApps.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Search className="w-8 h-8 text-white/10 mx-auto mb-3" />
                            <p className="text-sm text-white/20">No apps found</p>
                        </div>
                    </div>
                ) : (
                    /* ─── iOS Style Home Screen View ─── */
                    <div className="max-w-[700px] mx-auto mt-8 sm:mt-12">
                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-12 sm:gap-x-12 sm:gap-y-14">
                            {filteredApps.map((app, i) => (
                                <AppIcon
                                    key={app.id}
                                    app={app}
                                    index={i}
                                    onClick={() => setActiveModalApp(app)}
                                />
                            ))}
                            {/* Dashboard Explorer Item */}
                            <div className="flex flex-col items-center gap-3 w-[80px] sm:w-[90px] animate-slide-up opacity-0 stagger-7" style={{ animationDelay: `${filteredApps.length * 50}ms` }}>
                                <button
                                    onClick={() => router.push('/dashboard/explorer')}
                                    className="squircle relative w-16 h-16 sm:w-[72px] sm:h-[72px] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-xl bg-gradient-to-br from-indigo-500/20 to-indigo-900/40 border border-indigo-400/30 overflow-hidden group"
                                >
                                    <HardDrive className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
                                </button>
                                <span className="text-[11px] font-sans font-medium text-white/90 text-center tracking-wide [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
                                    Explorer
                                </span>
                            </div>
                            {/* Dashboard Settings Item */}
                            <div className="flex flex-col items-center gap-3 w-[80px] sm:w-[90px] animate-slide-up opacity-0 stagger-8" style={{ animationDelay: `${(filteredApps.length + 1) * 50}ms` }}>
                                <button
                                    onClick={() => setSettingsOpen(true)}
                                    className="squircle relative w-16 h-16 sm:w-[72px] sm:h-[72px] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-xl bg-white/[0.05] border border-white/[0.1] overflow-hidden"
                                >
                                    <Image
                                        src="/icons/settings.png"
                                        alt="Settings"
                                        fill
                                        sizes="72px"
                                        className="object-cover"
                                        loader={({ src }) => src}
                                        unoptimized
                                    />
                                </button>
                                <span className="text-[11px] font-sans font-medium text-white/90 text-center tracking-wide [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
                                    Settings
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* ═══ MODALS & TOASTS ═══ */}
            {activeModalApp && (
                <AppActionModal
                    app={activeModalApp}
                    onClose={() => setActiveModalApp(null)}
                    loading={!!actionLoading[activeModalApp.id]}
                    onAction={(action) => handleAction(activeModalApp.id, action)}
                />
            )}

            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {/* ═══ SETTINGS PANEL ═══ */}
            {settingsOpen && (
                <SettingsPanel
                    refreshInterval={refreshInterval}
                    onRefreshChange={setRefreshInterval}
                    username={username}
                    tunnelUrl={tunnelUrl}
                    tunnelActive={tunnelActive}
                    onCopyTunnel={copyTunnelUrl}
                    tunnelCopied={tunnelCopied}
                    onClose={() => setSettingsOpen(false)}
                    onLogout={handleLogout}
                />
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   APP ICON — iOS Style
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
    const isTransition = ['starting', 'stopping', 'building', 'optimizing', 'upgrading', 'cleaning', 'auditing'].includes(app.status);

    return (
        <div
            className={cn(
                "flex flex-col items-center gap-3 w-[80px] sm:w-[90px] animate-slide-up opacity-0 group",
                `stagger-${index + 1}`
            )}
        >
            <button
                onClick={onClick}
                className={cn(
                    "squircle relative w-16 h-16 sm:w-[76px] sm:h-[76px] flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 shadow-2xl",
                    isOnline ? "shadow-emerald-500/20" : "shadow-black/60"
                )}
                style={{
                    background: `linear-gradient(135deg, ${app.color}40, ${app.color}10, transparent)`,
                    boxShadow: `inset 0 1px 1px ${app.color}50, 0 15px 30px -10px rgba(0,0,0,0.8)`,
                    border: `1px solid ${app.color}30`
                }}
            >
                {/* Status Indicator inside squircle */}
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-[#06060f] z-10"
                    title={app.status}
                >
                    <div className={cn(
                        'w-full h-full rounded-full',
                        isOnline ? 'bg-emerald-400 font-glow-emerald animate-pulse-slow' :
                            isTransition ? 'bg-amber-400 font-glow-amber animate-pulse' :
                                'bg-white/10'
                    )} />
                </div>

                {/* Transition Glow overlay */}
                {isTransition && (
                    <div className="absolute inset-0 rounded-[inherit] border-2 border-amber-400/30 animate-pulse pointer-events-none z-10" />
                )}

                {app.image ? (
                    <Image
                        src={app.image}
                        alt={app.name}
                        fill
                        sizes="72px"
                        className={cn("object-cover transition-transform group-hover:scale-110", !isOnline && 'grayscale-[0.5] opacity-60')}
                        loader={({ src }) => src}
                        unoptimized
                    />
                ) : (
                    <Icon className={cn("w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:scale-110", isOnline ? 'opacity-100' : 'opacity-50')} style={{ color: app.color }} />
                )}

                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
            </button>
            <span className="text-[11px] font-sans font-medium text-white/90 text-center tracking-wide [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] line-clamp-2 leading-tight">
                {app.name}
            </span>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   APP ACTION MODAL — Bottom Sheet / Center Dialog
   ═══════════════════════════════════════════════════════ */

function AppActionModal({
    app,
    onClose,
    loading,
    onAction,
}: {
    app: AppStatus;
    onClose: () => void;
    loading: boolean;
    onAction: (action: 'start' | 'stop' | 'restart' | 'build' | 'optimize' | 'upgrade' | 'clean' | 'audit') => void;
}) {
    const Icon = ICON_MAP[app.icon] || Server;
    const isOnline = app.status === 'online';
    const isTransition = ['starting', 'stopping', 'building', 'optimizing', 'upgrading', 'cleaning', 'auditing'].includes(app.status);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose} />

            <div className="relative w-full max-w-[340px] glass-gold rounded-3xl overflow-hidden animate-slide-up shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-5 pb-4 flex items-center justify-between border-b border-white/[0.04] bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: `${app.color}15`, border: `1px solid ${app.color}25` }}
                        >
                            <Icon className="w-5 h-5" style={{ color: app.color }} />
                        </div>
                        <div>
                            <h3 className="text-sm font-display font-bold text-white">{app.name}</h3>
                            <span className={cn(
                                'text-[10px] font-mono uppercase tracking-wider',
                                isOnline ? 'text-emerald-400/80' : isTransition ? 'text-amber-400/80' : 'text-white/30'
                            )}>
                                {app.status} • Port {app.port}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Primary Actions */}
                <div className="p-3 space-y-1 border-b border-white/[0.04]">
                    {isOnline ? (
                        <>
                            <button
                                onClick={() => {
                                    const host = window.location.hostname;
                                    window.open(`http://${host}:${app.port}`, '_blank');
                                }}
                                className="w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors"
                            >
                                <span className="flex items-center gap-3">
                                    <ExternalLink className="w-4 h-4 text-white/40" />
                                    Launch Interface
                                </span>
                            </button>
                            <button
                                onClick={() => { onAction('restart'); onClose(); }}
                                disabled={loading}
                                className="w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium text-white/70 hover:text-amber-400 hover:bg-amber-400/[0.04] transition-colors disabled:opacity-50"
                            >
                                <span className="flex items-center gap-3">
                                    <RotateCcw className="w-4 h-4 text-amber-400/40" />
                                    Restart Instance
                                </span>
                            </button>
                            <button
                                onClick={() => { onAction('stop'); onClose(); }}
                                disabled={loading}
                                className="w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-400/[0.04] transition-colors disabled:opacity-50"
                            >
                                <span className="flex items-center gap-3">
                                    <Square className="w-4 h-4 text-red-400/40" />
                                    Stop Service
                                </span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => { onAction('start'); onClose(); }}
                            disabled={loading || isTransition}
                            className="w-full flex items-center justify-between p-4 rounded-2xl text-base font-bold text-white bg-gold-500/20 border border-gold-500/30 hover:bg-gold-500/30 transition-all disabled:opacity-50"
                        >
                            <span className="flex items-center gap-4">
                                {loading || isTransition ? <Loader2 className="w-5 h-5 animate-spin text-gold-400" /> : <Play className="w-5 h-5 text-gold-400" />}
                                {isTransition ? 'Processing...' : 'Start Execution'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gold-400/40" />
                        </button>
                    )}
                </div>

                {/* Advanced Lifecycle Actions */}
                <div className="p-3 bg-black/20">
                    <p className="px-3 pb-2 text-[10px] uppercase tracking-widest font-mono text-white/20">Lifecycle Hooks</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => { onAction('build'); onClose(); }}
                            disabled={loading || isTransition}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-blue-500/20 transition-all disabled:opacity-30 group"
                        >
                            <Wrench className="w-5 h-5 text-blue-400/60 group-hover:text-blue-400" />
                            <span className="text-[11px] font-mono text-white/50 group-hover:text-white/80">BUILD</span>
                        </button>
                        <button
                            onClick={() => { onAction('optimize'); onClose(); }}
                            disabled={loading || isTransition}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-amber-400/20 transition-all disabled:opacity-30 group"
                        >
                            <Zap className="w-5 h-5 text-amber-400/60 group-hover:text-amber-400" />
                            <span className="text-[11px] font-mono text-white/50 group-hover:text-white/80">OPTIMIZE</span>
                        </button>
                        <button
                            onClick={() => { onAction('upgrade'); onClose(); }}
                            disabled={loading || isTransition}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-fuchsia-400/20 transition-all disabled:opacity-30 group"
                        >
                            <ArrowUpCircle className="w-5 h-5 text-fuchsia-400/60 group-hover:text-fuchsia-400" />
                            <span className="text-[11px] font-mono text-white/50 group-hover:text-white/80">UPGRADE</span>
                        </button>
                        <button
                            onClick={() => { onAction('clean'); onClose(); }}
                            disabled={loading || isTransition}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-orange-400/20 transition-all disabled:opacity-30 group"
                        >
                            <Eraser className="w-5 h-5 text-orange-400/60 group-hover:text-orange-400" />
                            <span className="text-[11px] font-mono text-white/50 group-hover:text-white/80">CLEAN</span>
                        </button>
                    </div>
                </div>

                <div className="p-3 bg-black/40 border-t border-white/[0.02]">
                    <button
                        onClick={() => { onAction('audit'); onClose(); }}
                        disabled={loading || isTransition}
                        className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] text-xs font-medium text-white/50 hover:text-white transition-colors disabled:opacity-30"
                    >
                        <SearchCheck className="w-4 h-4" />
                        Run Dependency Audit
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                >
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-[320px] px-4">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={cn(
                        "pointer-events-auto flex items-center gap-3 p-3 rounded-2xl shadow-xl border backdrop-blur-md animate-slide-up",
                        toast.type === 'loading' ? "bg-[#06060f]/90 border-blue-500/20 shadow-blue-500/10" :
                            toast.type === 'success' ? "bg-[#06060f]/90 border-emerald-500/20 shadow-emerald-500/10" :
                                toast.type === 'error' ? "bg-[#06060f]/90 border-red-500/20 shadow-red-500/10" :
                                    "bg-[#06060f]/90 border-white/10 shadow-black/50"
                    )}
                >
                    {toast.type === 'loading' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />}
                    {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {toast.type === 'error' && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    {toast.type === 'info' && <Radio className="w-4 h-4 text-white/40 shrink-0" />}

                    <span className="text-xs font-medium text-white/90 truncate flex-1">{toast.message}</span>
                    <button onClick={() => removeToast(toast.id)} className="p-1 rounded-md hover:bg-white/10 shrink-0">
                        <X className="w-3 h-3 text-white/40" />
                    </button>
                </div>
            ))}
        </div>,
        document.body
    );
}

/* ═══════════════════════════════════════════════════════
   SETTINGS PANEL — Slide-in from right
   ═══════════════════════════════════════════════════════ */

function SettingsPanel({
    refreshInterval,
    onRefreshChange,
    username,
    tunnelUrl,
    tunnelActive,
    onCopyTunnel,
    tunnelCopied,
    onClose,
    onLogout,
}: {
    refreshInterval: number;
    onRefreshChange: (v: number) => void;
    username: string | null;
    tunnelUrl: string | null;
    tunnelActive: boolean;
    onCopyTunnel: () => void;
    tunnelCopied: boolean;
    onClose: () => void;
    onLogout: () => void;
}) {
    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Panel */}
            <div
                className="relative w-full max-w-[400px] h-full bg-[#04040c]/90 border-l border-white/10 slide-in-right overflow-y-auto backdrop-blur-3xl"
                style={{ paddingBottom: 'var(--safe-bottom)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-4 pt-[max(1.5rem,calc(var(--safe-top) + 1rem))] border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-gold-400" />
                        <h2 className="text-sm font-display font-bold text-white">Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-6">
                    {/* Session info */}
                    <section>
                        <h3 className="text-[10px] font-mono text-gold-400/60 tracking-wider uppercase mb-3">Session</h3>
                        <div className="glass rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/40">Logged in as</span>
                                <span className="text-xs font-mono text-gold-400">{username}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/40">Session type</span>
                                <span className="text-xs font-mono text-white/25">httpOnly · 24h</span>
                            </div>
                        </div>
                    </section>

                    {/* Public Access */}
                    <section>
                        <h3 className="text-[10px] font-mono text-gold-400/60 tracking-wider uppercase mb-3">Public Access</h3>
                        <div className="glass rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/40">Tunnel Status</span>
                                <span className={cn(
                                    'flex items-center gap-1.5 text-xs font-mono',
                                    tunnelActive ? 'text-emerald-400' : 'text-red-400/50'
                                )}>
                                    <div className={tunnelActive ? 'status-online' : 'status-offline'} style={{ width: 6, height: 6 }} />
                                    {tunnelActive ? 'LIVE' : 'OFFLINE'}
                                </span>
                            </div>
                            {tunnelActive && tunnelUrl ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-gold-500/15 overflow-hidden">
                                            <p className="text-[10px] text-white/20 mb-0.5">Public URL</p>
                                            <p className="text-xs font-mono text-gold-400 truncate">{tunnelUrl}</p>
                                        </div>
                                        <button
                                            onClick={onCopyTunnel}
                                            className="p-2.5 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 hover:bg-gold-500/20 transition-colors shrink-0"
                                            title="Copy URL"
                                        >
                                            {tunnelCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-white/30">
                                        <Globe className="w-3.5 h-3.5 text-gold-400/50" />
                                        <span>Accessible from anywhere · Protected by login</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 text-xs text-white/25">
                                    <WifiOff className="w-3.5 h-3.5" />
                                    <span>Start guardian to enable public access</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Preferences */}
                    <section>
                        <h3 className="text-[10px] font-mono text-gold-400/60 tracking-wider uppercase mb-3">Preferences</h3>
                        <div className="glass rounded-xl p-4 space-y-4">
                            {/* Refresh interval */}
                            <div>
                                <label className="text-xs text-white/40 mb-2 block">Auto-refresh interval</label>
                                <div className="flex items-center gap-2">
                                    {REFRESH_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => onRefreshChange(opt.value)}
                                            className={cn(
                                                'flex-1 py-1.5 rounded-lg text-[11px] font-mono transition-all',
                                                refreshInterval === opt.value
                                                    ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                                                    : 'bg-white/[0.03] text-white/30 border border-white/[0.06] hover:border-white/[0.1]'
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Security */}
                    <section>
                        <h3 className="text-[10px] font-mono text-gold-400/60 tracking-wider uppercase mb-3">Security</h3>
                        <div className="glass rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2 text-xs text-white/30">
                                <ShieldCheck className="w-4 h-4 text-emerald-400/50" />
                                <span>Session protected with httpOnly cookies</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/30">
                                <Timer className="w-4 h-4 text-amber-400/50" />
                                <span>Timing-safe credential verification</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/30">
                                <Shield className="w-4 h-4 text-gold-400/50" />
                                <span>Brute-force delay protection</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/30">
                                <Radio className="w-4 h-4 text-emerald-400/50" />
                                <span>Guardian auto-restart watchdog</span>
                            </div>
                        </div>
                    </section>

                    {/* About section */}
                    <section>
                        <h3 className="text-[10px] font-mono text-gold-400/60 tracking-wider uppercase mb-3">About</h3>
                        <div className="glass rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-700/10 border border-gold-500/20 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-gold-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-display font-bold text-white uppercase tracking-wider">Citadel v3.0</h4>
                                    <p className="text-[10px] text-white/30 font-mono">Matrix Command Center · Security Hardened</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] mb-6">
                                {[
                                    { label: 'Version', value: '3.0.0-omega' },
                                    { label: 'Port', value: '3005' },
                                    { label: 'Framework', value: 'Next.js 16' },
                                    { label: 'Runtime', value: 'Node.js' },
                                ].map(item => (
                                    <div key={item.label} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                        <span className="text-white/20 block text-[9px] uppercase tracking-tighter mb-0.5">{item.label}</span>
                                        <span className="text-white/60 font-mono">{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Security & Sync */}
                            <div className="space-y-4"> {/* Changed from section to div to be nested correctly */}
                                <h3 className="text-[10px] font-mono text-gold-400/60 tracking-wider uppercase mb-3">System Maintenance</h3>
                                <div className="glass rounded-xl p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/40">Cache Version</span>
                                        <span className="text-xs font-mono text-white/20">v3.0.0-omega</span>
                                    </div>
                                    <button
                                        onClick={onLogout}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-sm font-bold active:scale-95"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Terminate Session
                                    </button>
                                    <div className="pt-2 border-t border-white/[0.04]">
                                        <button
                                            onClick={() => (window as any)._handleSystemSync?.()}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400 hover:bg-gold-500/20 transition-all text-sm font-bold active:scale-95"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            System Hard Sync
                                        </button>
                                        <p className="text-[10px] text-center text-white/20 mt-2 font-mono uppercase tracking-widest">
                                            Force purge remote cache & service workers
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
