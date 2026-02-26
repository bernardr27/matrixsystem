'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Terminal, Share2, Cpu,
    Command, Activity, Settings, LayoutGrid,
    Search, Database, Ghost
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSensory } from '@/hooks/useSensory';

export type GhostModule = 'chat' | 'logs' | 'transfer' | 'system';

interface CommandDockProps {
    activeModule: GhostModule;
    onModuleChange: (module: GhostModule) => void;
}

const DOCK_ITEMS = [
    { id: 'chat', label: 'Neural Link', icon: MessageSquare, hotkey: '1' },
    { id: 'logs', label: 'Terminal', icon: Terminal, hotkey: '2' },
    { id: 'system', label: 'System', icon: Cpu, hotkey: '3' },
    { id: 'transfer', label: 'Archive', icon: Share2, hotkey: '4' },
] as const;

// Utility Portal Component
function ClientPortal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    React.useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return createPortal(children, document.body);
}

export function CommandDock({ activeModule, onModuleChange }: CommandDockProps) {
    const [showApps, setShowApps] = useState(false);
    const sensory = useSensory();

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key) {
                case '1': onModuleChange('chat'); break;
                case '2': onModuleChange('logs'); break;
                case '3': onModuleChange('system'); break;
                case '4': onModuleChange('transfer'); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onModuleChange]);

    return (
        <>
            <div className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center pointer-events-none">
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="pointer-events-auto relative"
                >
                    {/* GLASS DOCK */}
                    <div className="relative flex items-center gap-2 p-2 bg-[#050505]/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50">

                        {/* STATUS INDICATOR (Left) */}
                        <div className="pl-3 pr-2 border-r border-white/5 flex flex-col items-center justify-center gap-1 opacity-50">
                            <Command size={14} className="text-white/40" />
                            <span className="text-[8px] font-mono text-white/30">CMD</span>
                        </div>

                        {/* DOCK ITEMS */}
                        <div className="flex items-center gap-1">
                            {DOCK_ITEMS.map((item) => {
                                const isActive = activeModule === item.id;
                                const Icon = item.icon;

                                return (
                                    <button type="button"
                                        key={item.id}
                                        onClick={() => {
                                            sensory.click();
                                            onModuleChange(item.id as GhostModule);
                                        }}
                                        className={cn(
                                            "relative group px-3 py-3 rounded-xl transition-all duration-300 outline-none",
                                            isActive
                                                ? "bg-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                                                : "text-white/40 hover:text-white/80 hover:bg-white/5"
                                        )}
                                    >
                                        <Icon
                                            size={20}
                                            className={cn(
                                                "transition-all duration-300",
                                                isActive && "scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                                            )}
                                        />
                                        {/* TOOLTIP */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 border border-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[110]">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-white tracking-widest uppercase">{item.label}</span>
                                                <span className="text-[8px] font-mono text-white/30 bg-white/10 px-1 rounded">[{item.hotkey}]</span>
                                            </div>
                                        </div>
                                        {/* ACTIVE INDICATOR */}
                                        {isActive && (
                                            <motion.div
                                                layoutId="dock-active-dot"
                                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_var(--accent)]"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* DIVIDER */}
                        <div className="w-[1px] h-6 bg-white/5 mx-1" />

                        {/* SYSTEM MENU (Right) */}
                        <button type="button"
                            onClick={() => setShowApps(!showApps)}
                            className={cn(
                                "p-3 rounded-xl transition-colors group relative",
                                showApps ? "bg-white/10 text-white" : "text-white/20 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <LayoutGrid size={18} />
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 border border-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[110]">
                                <span className="text-[9px] font-bold text-white tracking-widest uppercase">Apps</span>
                            </div>
                        </button>

                    </div>
                </motion.div>
            </div>

            {/* PORTALED APPS GRID */}
            <ClientPortal>
                <AnimatePresence>
                    {showApps && (
                        <>
                            {/* BACKDROP */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowApps(false)}
                                className="fixed inset-0 bg-black/50 z-[9998]"
                            />
                            {/* POPOVER */}
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.95, x: '-50%' }}
                                animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                                exit={{ opacity: 0, y: 10, scale: 0.95, x: '-50%' }}
                                className="fixed bottom-24 left-1/2 w-64 bg-[#080808]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-3 grid grid-cols-2 gap-2 z-[9999]"
                            >
                                <div className="col-span-2 px-1 pb-2 border-b border-white/5 mb-1 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Matrix Apps</span>
                                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                                </div>

                                <AppButton
                                    icon={Search}
                                    label="Reflect"
                                    color="text-amber-400"
                                    onClick={() => window.location.href = `${window.location.protocol}//${window.location.hostname}:3000`}
                                />
                                <AppButton
                                    icon={Database}
                                    label="Matrix Hub"
                                    color="text-blue-400"
                                    onClick={() => window.location.href = `${window.location.protocol}//${window.location.hostname}:3001`}
                                />
                                <AppButton
                                    icon={Ghost}
                                    label="Ghost"
                                    color="text-violet-400"
                                    active
                                    onClick={() => { setShowApps(false); }}
                                />
                                <AppButton
                                    icon={Settings}
                                    label="Config"
                                    color="text-white"
                                    onClick={() => window.location.href = `${window.location.protocol}//${window.location.hostname}:3001/settings`}
                                />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </ClientPortal>
        </>
    );
}

function AppButton({ icon: Icon, label, color, onClick, active }: any) {
    return (
        <button type="button"
            onClick={onClick}
            className={cn(
                "flex flex-col items-center gap-2 p-3 squircle border transition-all hover:bg-white/5 active:scale-95 group",
                active ? "bg-white/5 border-white/10" : "border-transparent hover:border-white/5"
            )}
        >
            <div className={cn("p-2 squircle bg-white/5 group-hover:bg-white/10 transition-colors", color)}>
                <Icon size={16} />
            </div>
            <span className="text-[9px] font-mono text-white/60 group-hover:text-white transition-colors uppercase tracking-wider">{label}</span>
        </button>
    )
}
