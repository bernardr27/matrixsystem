'use client';

import React, { useEffect } from 'react';
import { Settings, X, Shield, Globe, ShieldCheck, Timer, Radio, WifiOff, Check, Copy, LogOut, RotateCcw } from 'lucide-react';
import { cn } from '@matrix-lib/utils';
import { createPortal } from 'react-dom';

const REFRESH_OPTIONS = [
    { label: '5s', value: 5000 },
    { label: '10s', value: 10000 },
    { label: '30s', value: 30000 },
    { label: '60s', value: 60000 },
];

interface SettingsPanelProps {
    refreshInterval: number;
    onRefreshChange: (v: number) => void;
    username: string | null;
    tunnelUrl: string | null;
    tunnelActive: boolean;
    onCopyTunnel: () => void;
    tunnelCopied: boolean;
    onClose: () => void;
    onLogout: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    refreshInterval, onRefreshChange, username, tunnelUrl, tunnelActive, onCopyTunnel, tunnelCopied, onClose, onLogout
}) => {
    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleSystemSync = async () => {
        try {
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
            }
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                for (let name of cacheNames) {
                    await caches.delete(name);
                }
            }
            setTimeout(() => window.location.reload(), 500);
        } catch (err) {
            console.error('[Sync] Failed:', err);
        }
    };

    const panel = (
        <div className="fixed inset-0 z-[100] flex justify-end" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

            {/* Panel */}
            <div
                className="relative w-full max-w-[400px] h-full bg-[#04040c]/95 border-l border-white/10 slide-in-right overflow-y-auto backdrop-blur-3xl pb-24 ct-liquid-glass"
                style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(6rem, env(safe-area-inset-bottom))' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-4 border-b border-white/[0.06] sticky top-0 bg-[#04040c]/95 backdrop-blur-xl z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                            <Settings className="w-4 h-4 text-gold-400" />
                        </div>
                        <h2 className="text-base font-display font-bold text-white tracking-wide">Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-8">
                    {/* Session info */}
                    <section>
                        <h3 className="text-[10px] font-mono text-gold-400/60 tracking-widest uppercase mb-3 flex items-center gap-2">
                            <Shield className="w-3 h-3" /> Session
                        </h3>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-3 ct-liquid-glass">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/40">Operator</span>
                                <span className="text-xs font-mono font-bold text-gold-400 uppercase tracking-widest">{username || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/40">Connection</span>
                                <span className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-widest">Secured</span>
                            </div>
                        </div>
                    </section>

                    {/* Public Access */}
                    <section>
                        <h3 className="text-[10px] font-mono text-gold-400/60 tracking-widest uppercase mb-3 flex items-center gap-2">
                            <Globe className="w-3 h-3" /> Public Access
                        </h3>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-4 ct-liquid-glass">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/40">Tunnel Status</span>
                                <span className={cn(
                                    'flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest',
                                    tunnelActive ? 'text-emerald-400' : 'text-red-400/60'
                                )}>
                                    <div className={tunnelActive ? 'status-online' : 'status-offline'} style={{ width: 6, height: 6 }} />
                                    {tunnelActive ? 'Active' : 'Offline'}
                                </span>
                            </div>
                            {tunnelActive && tunnelUrl ? (
                                <>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-gold-500/20 overflow-hidden shadow-inner cursor-pointer group" onClick={onCopyTunnel}>
                                            <p className="text-[9px] text-gold-400/50 uppercase tracking-widest mb-1">Public Endpoint</p>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-xs font-mono text-gold-400 truncate">{tunnelUrl}</p>
                                                {tunnelCopied ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-gold-400/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-white/30 font-mono mt-2">
                                        <Globe className="w-3.5 h-3.5 text-gold-400/40" />
                                        <span>Globally accessible via encrypted tunnel</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 text-xs text-white/30 bg-black/20 p-3 rounded-xl">
                                    <WifiOff className="w-4 h-4" />
                                    <span>Start Matrix Guardian to enable proxy</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Preferences */}
                    <section>
                        <h3 className="text-[10px] font-mono text-gold-400/60 tracking-widest uppercase mb-3">Preferences</h3>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-4 ct-liquid-glass">
                            <div>
                                <label className="text-xs text-white/40 mb-3 block">Telemetry Sync Rate</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {REFRESH_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => onRefreshChange(opt.value)}
                                            className={cn(
                                                'min-h-11 py-2 rounded-xl text-[11px] font-mono transition-all',
                                                refreshInterval === opt.value
                                                    ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30 font-bold shadow-[0_0_15px_rgba(212,168,67,0.15)]'
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
                        <h3 className="text-[10px] font-mono text-gold-400/60 tracking-widest uppercase mb-3">System Defense</h3>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-4 ct-liquid-glass">
                            <div className="flex items-center gap-3 text-xs text-white/40">
                                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400"><ShieldCheck className="w-3.5 h-3.5" /></div>
                                <span>Session protected (httpOnly)</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-white/40">
                                <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400"><Timer className="w-3.5 h-3.5" /></div>
                                <span>Timing-safe credential verification</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-white/40">
                                <div className="p-1.5 rounded-md bg-gold-500/10 text-gold-400"><Radio className="w-3.5 h-3.5" /></div>
                                <span>Guardian watchdog active</span>
                            </div>
                        </div>
                    </section>

                    {/* System Maintenance */}
                    <section>
                        <h3 className="text-[10px] font-mono text-gold-400/60 tracking-widest uppercase mb-3">Core Maintenance</h3>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-4 ct-liquid-glass">
                            <button
                                onClick={handleSystemSync}
                                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400 hover:bg-gold-500/20 transition-all text-sm font-bold active:scale-95"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Force System Cache Sync
                            </button>

                            <button
                                onClick={onLogout}
                                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all text-sm font-bold active:scale-95"
                            >
                                <LogOut className="w-4 h-4" />
                                Terminate Session
                            </button>
                        </div>
                    </section>

                    {/* Legal / Version */}
                    <div className="pt-4 text-center pb-8">
                        <p className="text-[9px] font-mono tracking-widest text-white/20 uppercase">Citadel OS v3.0 // Sovereign Build</p>
                    </div>
                </div>
            </div>
        </div>
    );

    if (typeof window === 'undefined') return null;
    return createPortal(panel, document.body);
};
