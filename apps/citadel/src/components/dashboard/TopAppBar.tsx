'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Shield, Activity, Settings, RefreshCw, ChevronDown, LogOut, Radio } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { cn } from '@matrix-lib/utils';

interface TopAppBarProps {
    onOpenSettings: () => void;
    onRefresh: () => void;
    tunnelUrl: string | null;
    tunnelActive: boolean;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
    onOpenSettings,
    onRefresh,
    tunnelUrl,
    tunnelActive
}) => {
    const { username, logout } = useAuth();
    const router = useRouter();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close user menu on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pb-3 border-b border-white/[0.06] bg-[#06060f]/55 backdrop-blur-xl ct-liquid-glass rounded-b-3xl"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold-500/30 via-gold-600/10 to-transparent border border-gold-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(212,168,67,0.15)] group relative overflow-hidden ct-liquid-glass">
                    <Shield className="w-5 h-5 text-gold-400" />
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                    <h1 className="text-sm font-display font-black tracking-[0.2em] text-white uppercase leading-none">
                        <span className="text-gold-400">Matrix</span> OS
                    </h1>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        <span className="text-[9px] text-emerald-400 font-mono tracking-widest uppercase">Online</span>
                    </div>
                </div>
            </div>

            {/* Center: Optional Tunnel Status Indicator (pill) */}
            {tunnelActive && (
                <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20">
                    <Radio className="w-3.5 h-3.5 text-gold-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-gold-400/80">Tunnel Active</span>
                </div>
            )}

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
                <button
                    onClick={onRefresh}
                    className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
                <button
                    onClick={onOpenSettings}
                    className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                >
                    <Settings className="w-4 h-4" />
                </button>

                {/* User Menu */}
                <div className="relative ml-1" ref={userMenuRef}>
                    <button
                        onClick={() => setShowUserMenu(v => !v)}
                        className="flex items-center gap-1.5 p-1 pr-2 rounded-xl border border-white/5 hover:bg-white/5 transition-colors ct-liquid-glass"
                    >
                        <div className="w-7 h-7 rounded-lg bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
                            <span className="text-xs font-mono font-bold text-gold-400 uppercase">
                                {username?.[0] || 'O'}
                            </span>
                        </div>
                        <ChevronDown className="w-3 h-3 text-white/30" />
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 py-1 rounded-2xl bg-[#06060f]/95 backdrop-blur-3xl shadow-xl shadow-black/50 z-50 animate-fade-in border border-white/10">
                            <div className="px-4 py-3 border-b border-white/[0.06]">
                                <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">{username || 'Operator'}</p>
                                <p className="text-[10px] text-white/40 mt-0.5">Active Session</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-3 text-xs text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                End Session
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
