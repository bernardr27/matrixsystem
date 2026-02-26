'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Shield, HardDrive, Download, Search, FileText, ChevronRight, Lock, ShieldCheck, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface VaultEntry {
    id: string;
    name: string;
    size: string;
    timestamp: string;
    type: 'snapshot' | 'backup' | 'audit';
    integrity: number;
}

const VaultItem = React.memo(({ entry, onAction }: { entry: VaultEntry, onAction: (id: string) => void }) => {
    const isOptimal = entry.integrity === 100;

    return (
        <div
            onClick={() => onAction(entry.id)}
            className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer group/item relative overflow-hidden"
        >
            <div className="absolute inset-y-0 left-0 w-1 bg-white/5 group-hover/item:bg-cyan-500/40 transition-colors" />

            <div className="flex items-center gap-4 relative z-10 pl-2">
                <div className={cn(
                    "p-2 rounded-xl border transition-all",
                    isOptimal ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                )}>
                    <Box size={14} className={isOptimal ? "" : "animate-pulse"} />
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50 group-hover/item:text-white/80 transition-colors">
                        {entry.name}
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">{entry.type}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className="text-[8px] font-mono text-slate-500">{entry.size}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className={cn(
                            "text-[8px] font-mono font-bold uppercase",
                            isOptimal ? "text-cyan-500/60" : "text-amber-500/60"
                        )}>{entry.integrity}%_SAFE</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
                <span className="text-[8px] font-mono text-slate-600 tabular-nums uppercase tracking-tighter hidden sm:block">
                    {entry.timestamp}
                </span>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all">
                    <ChevronRight size={14} className="text-white/40" />
                </div>
            </div>
        </div>
    );
});

VaultItem.displayName = 'VaultItem';

export default function NeuralDataVault() {
    const [entries, setEntries] = useState<VaultEntry[]>([
        { id: '1', name: 'MATRIX_COLLECTIVE_v4.3_NOMINAL', size: '1.2 GB', timestamp: '2026-01-27 23:15', type: 'snapshot', integrity: 100 },
        { id: '2', name: 'MATRIX_HUB_AETHERIC_01', size: '456 MB', timestamp: '2026-01-28 01:00', type: 'backup', integrity: 99.8 },
        { id: '3', name: 'AGENT_PROXY_INITIAL_SYNC', size: '12 KB', timestamp: '2026-01-28 09:04', type: 'audit', integrity: 100 }
    ]);

    const handleAction = async (action: string) => {
        await supabase.from('matrix_diagnostics').insert({
            app: 'nexus',
            category: 'action',
            severity: 'info',
            action: `vault:${action}`,
            metadata: { timestamp: Date.now() }
        });
    };

    return (
        <div className="space-y-4 relative h-full flex flex-col">
            {/* Header: Vault Authority */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
                            <Database className="text-cyan-400" size={20} />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-[#050505] shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-bold text-white mb-1.5">Neural Data Vault</h3>
                        <p className="text-[9px] font-medium text-slate-500">Secure Storage Engine // Encrypted</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer">
                        <Lock size={14} className="text-emerald-500/60" />
                    </div>
                </div>
            </div>

            {/* Storage Registry */}
            <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                {entries.map((entry) => (
                    <VaultItem
                        key={entry.id}
                        entry={entry}
                        onAction={(id) => handleAction(`inspect:${id}`)}
                    />
                ))}
            </div>

            {/* Action Matrix */}
            <div className="grid grid-cols-2 gap-4">
                <button type="button"
                    onClick={() => handleAction('export_external')}
                    className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all group"
                >
                    <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 group-hover:border-white/20">
                        <Download size={12} className="text-slate-500 group-hover:text-white" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 group-hover:text-white transition-colors">Export</span>
                </button>
                <button type="button"
                    onClick={() => handleAction('sync_mirror')}
                    className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-cyan-500/[0.03] hover:bg-cyan-500/[0.08] border border-cyan-500/10 hover:border-cyan-500/20 transition-all group"
                >
                    <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 group-hover:border-cyan-500/30">
                        <HardDrive size={12} className="text-slate-500 group-hover:text-cyan-400" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 group-hover:text-cyan-400 transition-colors">Sync Mirror</span>
                </button>
            </div>

            {/* Global Shield Notice */}
            <div className="p-4 rounded-2xl bg-emerald-500/[0.02] border border-emerald-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ShieldCheck size={16} className="text-emerald-500/40" />
                    <span className="text-[9px] font-bold text-emerald-500/40">Shield Registry Active</span>
                </div>
                <div className="h-1 flex-1 mx-4 bg-emerald-500/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-emerald-500/40"
                        animate={{ x: ['-100%', '300%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                </div>
            </div>
        </div>
    );
}
