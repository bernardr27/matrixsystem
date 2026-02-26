"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, Zap, Terminal, Shield, Cpu, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export const ModularCommandBar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [executing, setExecuting] = useState<string | null>(null);

    const executeCommand = useCallback(async (cmdId: string) => {
        setExecuting(cmdId);
        const commandMap: Record<string, string> = {
            ignite: 'sys:ignite',
            sync: 'sys:telemetry_sync',
            diagnostic: 'sys:diagnose',
            shield: 'sys:shield_toggle',
            purge: 'sys:purge_volatile',
        };
        try {
            await supabase.from('ghost_bridge').insert({
                command: commandMap[cmdId] || `sys:${cmdId}`,
                source: 'nexus_command_bar',
                status: 'pending',
            });
        } finally {
            setTimeout(() => {
                setExecuting(null);
                setIsOpen(false);
                setQuery('');
            }, 600);
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const commands = [
        { id: 'ignite', label: 'SYSTEM_IGNITE', icon: Zap, color: 'text-cyan-400' },
        { id: 'sync', label: 'FORCE_TELEMETRY_SYNC', icon: Activity, color: 'text-violet-400' },
        { id: 'diagnostic', label: 'RUN_FULL_DIAGNOSTIC', icon: Terminal, color: 'text-emerald-400' },
        { id: 'shield', label: 'TOGGLE_INFRA_SHIELD', icon: Shield, color: 'text-amber-400' },
        { id: 'purge', label: 'HAZARD_PURGE_VOLATILE', icon: Shield, color: 'text-rose-500' },
    ];

    const filtered = commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: -20 }}
                        className="relative w-full max-w-2xl bg-[#0a0a0b] border border-white/10 rounded-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden"
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-4 px-8 py-6 border-b border-white/5 bg-white/[0.02]">
                            <Search className="w-6 h-6 text-white/20" />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Execute_Protocol..."
                                className="flex-1 bg-transparent border-none outline-none text-xl font-mono text-white placeholder:text-white/10 tracking-tight"
                            />
                            <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2">
                                <Command className="w-3 h-3 text-white/30" />
                                <span className="text-[10px] font-mono text-white/30">K</span>
                            </div>
                        </div>

                        {/* Command List */}
                        <div className="p-4 max-h-[400px] overflow-y-auto scrollbar-hide">
                            <div className="px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold italic mb-2">
                                Core_Directives
                            </div>
                            <div className="space-y-1">
                                {filtered.map((cmd) => (
                                    <button type="button"
                                        key={cmd.id}
                                        onClick={() => executeCommand(cmd.id)}
                                        disabled={executing !== null}
                                        className={cn(
                                            "w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/5",
                                            executing === cmd.id && "bg-cyan-500/10 border-cyan-500/20"
                                        )}
                                    >
                                        <div className={cn("p-3 rounded-xl bg-white/5 transition-colors group-hover:bg-white/10", cmd.color)}>
                                            <cmd.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="text-sm font-bold text-white/80 group-hover:text-cyan-400 transition-colors uppercase tracking-tight italic">
                                                {cmd.label}
                                            </div>
                                            <div className="text-[10px] text-white/20 uppercase tracking-widest mt-0.5">
                                                Protocol_v4.0_Secured
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                            <span className="text-[9px] font-mono text-cyan-400 capitalize underline">Execute</span>
                                            <Zap className="w-3 h-3 text-cyan-400" />
                                        </div>
                                    </button>
                                ))}
                                {filtered.length === 0 && (
                                    <div className="p-8 text-center text-white/10 italic text-sm">
                                        No directives found for '{query}'
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-[10px] text-white/30">
                                    <span className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">↑↓</span>
                                    <span>Navigate</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-white/30">
                                    <span className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">↵</span>
                                    <span>Execute</span>
                                </div>
                            </div>
                            <div className="text-[9px] font-mono text-cyan-500/50 uppercase tracking-widest animate-pulse">
                                [Aetheric_Link_Active]
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
