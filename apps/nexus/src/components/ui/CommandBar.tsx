'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, X, ArrowRight, Activity, Cpu, Database, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function CommandBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
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

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
        }
    }, [isOpen]);

    const items = [
        { id: 'dash', label: 'Go to Dashboard', icon: Activity, href: '/' },
        { id: 'anal', label: 'Neural Analytics', icon: Cpu, href: '/analytics' },
        { id: 'arch', label: 'Aetheric Archive', icon: Database, href: '/knowledge' },
        { id: 'int', label: 'Neural Extensions', icon: Globe, href: '/integrations' },
        { id: 'sett', label: 'Sys Configuration', icon: Command, href: '/settings' },
    ].filter(item => item.label.toLowerCase().includes(query.toLowerCase()));

    const handleSelect = (href: string) => {
        router.push(href);
        setIsOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 sm:px-0">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-3xl"
                        onClick={() => setIsOpen(false)}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20, rotateX: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20, rotateX: 10 }}
                        className="relative w-full max-w-2xl cockpit-surface rounded-[2rem] overflow-hidden perspective-2000"
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-5 p-8 border-b border-white/5 relative bg-white/[0.02]">
                            <div className="p-3 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                                <Search className="text-cyan-400" size={24} />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Execute_Command_Ref..."
                                className="bg-transparent border-none outline-none text-white text-2xl placeholder:text-slate-700 w-full font-black uppercase tracking-tighter italic"
                                spellCheck={false}
                            />
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[8px] font-black text-slate-500 uppercase tracking-widest">K_Buffer</span>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="max-h-[450px] overflow-y-auto p-4 custom-scrollbar bg-black/40">
                            {items.length > 0 ? (
                                <div className="space-y-2">
                                    <span className="block px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic opacity-50">Protocol_Registry</span>
                                    {items.map((item) => (
                                        <button type="button"
                                            key={item.id}
                                            onClick={() => handleSelect(item.href)}
                                            className="w-full flex items-center justify-between p-5 px-6 hover:bg-white/[0.03] border border-transparent hover:border-white/5 rounded-[2rem] transition-all group group/item"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="p-3 rounded-full bg-white/[0.03] group-hover/item:bg-cyan-500/10 border border-white/5 group-hover/item:border-cyan-500/20 transition-all text-slate-500 group-hover/item:text-cyan-400">
                                                    <item.icon size={20} />
                                                </div>
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="text-sm font-black text-slate-300 group-hover/item:text-white uppercase tracking-widest italic">{item.label}</span>
                                                    <span className="text-[8px] font-mono text-slate-600 group-hover/item:text-cyan-500/40 uppercase tracking-tighter">sys_call_0x{item.id}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <ArrowRight size={16} className="text-slate-600 opacity-0 group-hover/item:opacity-100 transition-all group-hover/item:translate-x-1" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-16 text-center space-y-4">
                                    <div className="p-5 rounded-full bg-white/[0.02] border border-white/5 w-fit mx-auto animate-pulse">
                                        <Command size={40} className="text-slate-800" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] italic">No_Registry_Match</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white/[0.03] border-t border-white/5 flex items-center justify-between px-8">
                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-3 text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none italic">
                                    <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400">ENTER</span> Execute
                                </div>
                                <div className="flex items-center gap-3 text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none italic">
                                    <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400">ARR</span> Select
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-cyan-500/40 animate-pulse" />
                                <span className="text-[8px] font-black text-cyan-500/40 uppercase tracking-[0.6em] italic">Aetheric_Console_v4.5</span>
                            </div>
                        </div>

                        {/* Industrial Grid Texture */}
                        <div className="absolute inset-0 industrial-grid opacity-[0.03] pointer-events-none" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
