'use client';

import React from 'react';
import { Activity, Zap, Gauge, RefreshCw, LayoutGrid } from 'lucide-react';

interface MenuBarProps {
    minimizedCount: number;
    onOpenDrawer?: () => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({ minimizedCount, onOpenDrawer }) => {
    return (
        <div
            className="fixed left-0 right-0 h-14 z-50 glass-panel border-b border-gold-500/20 flex items-center justify-between px-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
            style={{
                top: 'var(--app-safe-top)',
                paddingLeft: 'max(24px, env(safe-area-inset-left))',
                paddingRight: 'max(24px, env(safe-area-inset-right))',
            }}
        >
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center flex-shrink-0 font-display font-bold text-black drop-shadow-[0_0_10px_rgba(212,168,67,0.4)] relative">
                    M
                    <div className="absolute inset-0 rounded-xl bg-white/20 blur-[2px]" />
                </div>
                <div>
                    <div className="text-sm font-display font-bold text-white tracking-[0.2em] uppercase">MATRIX</div>
                    <div className="text-[10px] font-mono tracking-widest text-gold-500/80 uppercase">Sovereign OS</div>
                </div>
            </div>

            {/* Center: Status */}
            <div className="flex items-center justify-center flex-1 gap-2 sm:gap-6 text-[10px] sm:text-[11px] font-mono tracking-wider uppercase px-2 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-black/40 border border-white/5 shadow-inner shrink-0">
                    <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 animate-pulse drop-shadow-[0_0_5px_rgba(16,185,129,0.5)] shrink-0" />
                    <span className="text-white/70 hidden sm:inline">System Active</span>
                    <span className="text-white/70 sm:hidden">Online</span>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/5 shadow-inner shrink-0">
                    <Gauge className="w-3.5 h-3.5 text-gold-500" />
                    <span className="text-white/70">CPU: 12% <span className="text-white/30 px-1">|</span> RAM: 4.2GB</span>
                </div>
            </div>

            {/* Right: Window Controls */}
            <div className="flex items-center gap-4">
                {minimizedCount > 0 && (
                    <div className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/30 shadow-[0_0_10px_rgba(212,168,67,0.1)]">
                        <span className="text-[10px] sm:text-[11px] font-mono tracking-wider uppercase text-gold-300">{minimizedCount} <span className="hidden sm:inline">minimized</span></span>
                    </div>
                )}
                <button
                    onClick={() => window.location.reload()}
                    title="Force Sync"
                    className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
                <button
                    onClick={onOpenDrawer}
                    title="App Management Center"
                    className="w-9 h-9 rounded-xl glass-panel-gold border border-gold-500/30 flex items-center justify-center text-gold-400 hover:text-gold-200 hover:bg-gold-500/20 transition-all hover:shadow-[0_0_20px_rgba(212,168,67,0.3)] shadow-lg"
                >
                    <LayoutGrid className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
