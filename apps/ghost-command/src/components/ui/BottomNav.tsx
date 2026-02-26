'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    MessageSquare, Terminal, Share2, Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type GhostModule = 'chat' | 'logs' | 'transfer' | 'system';

interface BottomNavProps {
    activeModule: GhostModule;
    onModuleChange: (module: GhostModule) => void;
}

const GHOST_NAV = [
    { id: 'chat', label: 'Console', icon: MessageSquare },
    { id: 'logs', label: 'Terminal', icon: Terminal },
    { id: 'transfer', label: 'Archive', icon: Share2 },
    { id: 'system', label: 'System', icon: Cpu },
] as const;

export function BottomNav({ activeModule, onModuleChange }: BottomNavProps) {
    return (
        <div className="w-full z-[70] px-4 pb-6 sm:hidden pointer-events-none">
            <div className="max-w-md mx-auto w-full flex justify-center">
                <motion.nav
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-[#050505]/95 backdrop-blur-3xl border border-white/10 rounded-3xl p-1.5 shadow-[0_-20px_100px_rgba(0,0,0,0.9)] flex items-center justify-around pointer-events-auto transform-gpu w-full max-w-[480px] transition-all duration-500 hover:border-white/20"
                >
                    <div className="scanline opacity-[0.05] pointer-events-none rounded-3xl" />
                    {GHOST_NAV.map((item) => {
                        const isActive = activeModule === item.id;
                        const Icon = item.icon;
                        return (
                            <button
                                type="button"
                                key={item.id}
                                onClick={() => onModuleChange(item.id)}
                                className="flex-1 outline-none relative group h-14"
                            >
                                <motion.div
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-1.5 py-2 rounded-2xl transition-all relative z-10",
                                        isActive ? "text-cyan-400" : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    <Icon
                                        size={24}
                                        className={cn(
                                            "transition-all duration-500",
                                            isActive ? "scale-110 drop-shadow-[0_0_12px_var(--accent)]" : "opacity-40 group-hover:opacity-80"
                                        )}
                                    />


                                    {isActive && (
                                        <motion.div
                                            layoutId="ghost-v2-nav-active"
                                            className="absolute inset-x-0.5 inset-y-1 bg-cyan-500/10 rounded-xl border-t border-cyan-500/30 shadow-[inset_0_1px_10px_rgba(34,211,238,0.1)]"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </motion.div>

                                {/* HAPTIC INDICATOR DOT (UPGRADED) */}
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-dot"
                                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_15px_var(--accent-glow)]"
                                    />
                                )}
                            </button>
                        );
                    })}
                </motion.nav>
            </div>
        </div>
    );
}
