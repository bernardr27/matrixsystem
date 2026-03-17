'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Brain, Settings, HardDrive, Compass } from 'lucide-react';
import { cn } from '@matrix-lib/utils';

interface BottomNavBarProps {
    activeTab: 'home' | 'intelligence' | 'hub' | 'explorer' | 'settings';
    onTabChange: (tab: 'home' | 'intelligence' | 'hub' | 'explorer' | 'settings') => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'home', icon: LayoutGrid, label: 'Home' },
        { id: 'intelligence', icon: Brain, label: 'Intelligence' },
        { id: 'explorer', icon: HardDrive, label: 'Explorer' },
    ] as const;

    return (
        <div
            className="absolute bottom-4 left-0 right-0 z-50 px-4 pointer-events-none flex justify-center"
        >
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="pointer-events-auto flex items-center justify-between gap-1 w-full max-w-sm px-2 py-2 rounded-3xl bg-black/65 backdrop-blur-2xl border border-white/10 shadow-2xl ct-liquid-glass"
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id as any)}
                            className="relative flex flex-col items-center justify-center flex-1 h-12 rounded-2xl transition-all duration-300 group px-1"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute inset-0 bg-white/5 rounded-2xl border border-white/10"
                                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                />
                            )}
                            <Icon
                                className={cn(
                                    "w-5 h-5 relative z-10 transition-colors duration-300",
                                    isActive
                                        ? tab.id === 'intelligence' ? "text-gold-400 drop-shadow-[0_0_8px_rgba(212,168,67,0.6)]" : "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                                        : "text-white/40 group-hover:text-white/70"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-[10px] sm:text-[11px] font-sans font-medium mt-1 relative z-10 tracking-wide transition-colors duration-300 w-full text-center px-1 whitespace-nowrap overflow-visible leading-none",
                                    isActive ? "text-white/90" : "text-white/30 group-hover:text-white/60"
                                )}
                            >
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </motion.div>
        </div>
    );
};
