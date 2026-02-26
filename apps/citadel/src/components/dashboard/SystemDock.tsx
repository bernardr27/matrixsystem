'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@matrix-lib/utils';
import { Settings, RotateCcw, Brain } from 'lucide-react';

interface AppSpec {
    id: string;
    label: string;
    icon: string;
    title: string;
    url: string;
}

interface MinimizedWindow {
    id: string;
    title: string;
}

interface SystemDockProps {
    activeWindows: string[];
    minimizedWindows: MinimizedWindow[];
    onLaunch: (appId: string, title: string, url: string) => void;
    onRestore: (appId: string) => void;
    onOpenIntelligence: () => void;
    focusedId: string | null;
}

const APPS: AppSpec[] = [
    { id: 'reflect', label: 'Reflect', icon: 'reflect', title: 'Reflect', url: process.env.NEXT_PUBLIC_REFLECT_URL || 'http://localhost:3000' },
    { id: 'nexus', label: 'Nexus', icon: 'nexus', title: 'Nexus', url: process.env.NEXT_PUBLIC_NEXUS_URL || 'http://localhost:3001' },
    { id: 'rocket', label: 'Rocket', icon: 'rocket', title: 'Rocket', url: process.env.NEXT_PUBLIC_ROCKET_URL || 'http://localhost:4000' },
    { id: 'ghost', label: 'Ghost', icon: 'ghost', title: 'Ghost', url: process.env.NEXT_PUBLIC_GHOST_URL || 'http://localhost:5173' },
];

const resolveDynamicUrl = (defaultUrl: string) => {
    if (typeof window === 'undefined') return defaultUrl;
    try {
        const urlObj = new URL(defaultUrl);
        if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
            urlObj.hostname = window.location.hostname; // E.g., desktop-7...ts.net
            // Intentionally preserve the HTTP protocol and original port.
            // Some mobile Tailscale clients require port-specific addresses.
            return urlObj.toString();
        }
    } catch (e) {
        // Fallback for invalid URLs
    }
    return defaultUrl;
};

export const SystemDock: React.FC<SystemDockProps> = ({
    activeWindows,
    minimizedWindows,
    onLaunch,
    onRestore,
    onOpenIntelligence,
    focusedId
}) => {
    const [hoveredApp, setHoveredApp] = useState<string | null>(null);

    return (
        <div
            className="fixed left-0 right-0 h-20 sm:h-28 z-40 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end justify-center px-2 sm:px-4 pb-2 sm:pb-4 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-x-auto no-scrollbar"
            style={{
                bottom: 'var(--app-safe-bottom)',
                paddingLeft: 'max(8px, env(safe-area-inset-left))',
                paddingRight: 'max(8px, env(safe-area-inset-right))',
            }}
        >
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-end gap-2 sm:gap-3 pb-3 sm:pb-4 px-3 sm:px-6 pt-2 sm:pt-3 rounded-[2rem] glass-panel border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.8)] relative min-w-max mx-auto backdrop-blur-2xl"
            >
                {/* Inner highlight */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {/* Regular Apps */}
                {APPS.map((app) => {
                    const isActive = activeWindows.includes(app.id);
                    const isFocused = focusedId === app.id;

                    return (
                        <motion.div key={app.id} onHoverStart={() => setHoveredApp(app.id)} onHoverEnd={() => setHoveredApp(null)}>
                            <button
                                onClick={() => onLaunch(app.id, app.title, resolveDynamicUrl(app.url))}
                                className={cn(
                                    "relative group flex flex-col items-center transition-all duration-300",
                                    hoveredApp === app.id ? "scale-105 sm:scale-110" : "scale-100"
                                )}
                                title={app.label}
                            >
                                <motion.div
                                    animate={{ y: hoveredApp === app.id ? (typeof window !== 'undefined' && window.innerWidth < 768 ? -5 : -10) : 0 }}
                                    className={cn(
                                        "w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 squircle flex items-center justify-center transition-all duration-300 relative overflow-hidden",
                                        isActive
                                            ? "glass-panel-gold border border-gold-500/50 shadow-[0_10px_20px_rgba(212,168,67,0.3)] z-10"
                                            : "bg-black/60 border border-white/10 hover:bg-white/5 shadow-lg backdrop-blur-md"
                                    )}
                                >
                                    {isActive && <div className="absolute inset-0 bg-gold-500/10 animate-pulse-slow" />}

                                    {/* High fidelity dynamic icons */}
                                    {app.id === 'reflect' && (
                                        <div className="relative z-10 animate-fade-in group-hover:scale-110 transition-transform">
                                            <div className="absolute inset-0 bg-blue-500/20 blur-[15px] rounded-full" />
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-blue-400 rounded-full flex items-center justify-center bg-black/40 shadow-[inset_0_0_10px_rgba(59,130,246,0.5)]">
                                                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-300 shadow-[0_0_10px_rgba(96,165,250,1)] animate-ping" />
                                            </div>
                                        </div>
                                    )}

                                    {app.id === 'nexus' && (
                                        <div className="relative z-10 animate-fade-in group-hover:scale-110 transition-transform">
                                            <div className="absolute inset-0 bg-emerald-500/20 blur-[15px] rounded-full" />
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-emerald-400/50 rounded-lg flex items-center justify-center bg-black/40 rotate-45 shadow-[inset_0_0_15px_rgba(16,185,129,0.3)]">
                                                <div className="w-3 h-3 sm:w-4 sm:h-4 border border-emerald-300/80 -rotate-45" />
                                                <div className="absolute w-1 h-1 bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,1)]" />
                                            </div>
                                        </div>
                                    )}

                                    {app.id === 'rocket' && (
                                        <div className="relative z-10 animate-fade-in group-hover:scale-110 transition-transform">
                                            <div className="absolute inset-0 bg-orange-500/20 blur-[15px] rounded-full" />
                                            <div className="text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] pr-1">
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 sm:w-10 sm:h-10 rotate-45 transform origin-center">
                                                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                                                    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                                                    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                                                    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}

                                    {app.id === 'ghost' && (
                                        <div className="relative z-10 animate-fade-in group-hover:scale-110 transition-transform">
                                            <div className="absolute inset-0 bg-violet-500/20 blur-[15px] rounded-full" />
                                            <div className="text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]">
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 sm:w-10 sm:h-10">
                                                    <path d="M9 10h.01" /><path d="M15 10h.01" /><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Label Tooltip */}
                                {hoveredApp === app.id && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: -90 }}
                                        className="absolute top-0 text-[11px] font-display font-medium tracking-widest text-gold-100 px-3 py-1.5 rounded-lg glass-panel border border-gold-500/30 whitespace-nowrap shadow-xl"
                                    >
                                        {app.label}
                                    </motion.div>
                                )}

                                {/* Active Indicator */}
                                {isActive && (
                                    <motion.div
                                        className={cn(
                                            "absolute -bottom-2 rounded-full shadow-[0_0_10px_rgba(212,168,67,0.9)] transition-all duration-300",
                                            isFocused ? "w-1.5 h-1.5 bg-gold-400" : "w-1 h-1 bg-gold-500/50"
                                        )}
                                    />
                                )}
                            </button>
                        </motion.div>
                    );
                })}

                {/* Divider */}
                {minimizedWindows.length > 0 && (
                    <div className="w-px h-10 bg-white/10 mx-2 self-center rounded-full" />
                )}

                {/* Minimized Windows */}
                {minimizedWindows.map((win) => (
                    <motion.div key={win.id} onHoverStart={() => setHoveredApp(win.id)} onHoverEnd={() => setHoveredApp(null)}>
                        <button
                            onClick={() => onRestore(win.id)}
                            className={cn(
                                "relative group flex flex-col items-center transition-all duration-300",
                                hoveredApp === win.id ? "scale-110" : "scale-100"
                            )}
                            title={win.title}
                        >
                            <motion.div
                                animate={{ y: hoveredApp === win.id ? -10 : 0 }}
                                className="w-16 h-16 rounded-2xl flex items-center justify-center bg-black/40 border border-violet-500/30 hover:bg-violet-500/10 hover:border-violet-400/50 shadow-lg backdrop-blur-md transition-all duration-300"
                            >
                                <RotateCcw className="w-7 h-7 text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                            </motion.div>

                            {hoveredApp === win.id && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: -80 }}
                                    className="absolute top-0 text-[11px] font-display font-medium tracking-widest text-violet-100 px-3 py-1.5 rounded-lg glass-panel border border-violet-500/30 whitespace-nowrap shadow-xl"
                                >
                                    Restore: {win.title}
                                </motion.div>
                            )}
                        </button>
                    </motion.div>
                ))}

                {/* Divider */}
                <div className="w-px h-10 bg-white/10 mx-2 self-center rounded-full" />

                {/* AntiGravity Intelligence superpower */}
                <motion.div onHoverStart={() => setHoveredApp('intelligence')} onHoverEnd={() => setHoveredApp(null)}>
                    <button
                        onClick={onOpenIntelligence}
                        className={cn(
                            "relative group flex flex-col items-center transition-all duration-300",
                            hoveredApp === 'intelligence' ? "scale-110" : "scale-100"
                        )}
                        title="AntiGravity Intelligence"
                    >
                        <motion.div
                            animate={{ y: hoveredApp === 'intelligence' ? -10 : 0 }}
                            className="w-16 h-16 rounded-2xl flex items-center justify-center bg-black/60 border border-gold-500/30 hover:bg-gold-500/10 shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden"
                        >
                            <Brain className="w-8 h-8 text-gold-500" />
                            <div className="absolute inset-0 bg-gold-500/5 group-hover:bg-gold-500/10 transition-colors" />
                        </motion.div>

                        {hoveredApp === 'intelligence' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: -80 }}
                                className="absolute top-0 text-[11px] font-display font-medium tracking-widest text-gold-100 px-3 py-1.5 rounded-lg glass-panel border border-gold-500/30 whitespace-nowrap shadow-xl"
                            >
                                Deep Intelligence
                            </motion.div>
                        )}
                    </button>
                </motion.div>

                {/* Settings */}
                <motion.div onHoverStart={() => setHoveredApp('settings')} onHoverEnd={() => setHoveredApp(null)}>
                    <button
                        className={cn(
                            "relative group flex flex-col items-center transition-all duration-300",
                            hoveredApp === 'settings' ? "scale-110" : "scale-100"
                        )}
                    >
                        <motion.div
                            animate={{ y: hoveredApp === 'settings' ? -10 : 0 }}
                            className="w-16 h-16 rounded-2xl flex items-center justify-center bg-black/60 border border-white/10 hover:bg-white/10 transition-all duration-300 shadow-lg backdrop-blur-md"
                        >
                            <Settings className="w-7 h-7 text-white/50 group-hover:text-white transition-colors" />
                        </motion.div>

                        {hoveredApp === 'settings' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: -80 }}
                                className="absolute top-0 text-[11px] font-display font-medium tracking-widest text-white px-3 py-1.5 rounded-lg glass-panel border border-white/20 shadow-xl"
                            >
                                Settings
                            </motion.div>
                        )}
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
};

