'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Lock, Zap, Trash2, RotateCcw, Brain,
    Search, Power, ShieldOff, Terminal
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NeuralButton } from '../ui/NeuralButton';

interface QuickAction {
    label: string;
    command: string;
    icon: React.ReactNode;
    color: string;
    danger?: boolean;
}

const QA_COLORS: Record<string, { text: string; bg: string; border: string; hoverBorder: string; hoverBg: string; overlayBg: string }> = {
    blue: { text: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/50', hoverBorder: 'hover:border-blue-500/30', hoverBg: 'hover:bg-blue-500/5', overlayBg: 'bg-blue-500/5' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', hoverBorder: 'hover:border-cyan-500/30', hoverBg: 'hover:bg-cyan-500/5', overlayBg: 'bg-cyan-500/5' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/50', hoverBorder: 'hover:border-amber-500/30', hoverBg: 'hover:bg-amber-500/5', overlayBg: 'bg-amber-500/5' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', hoverBorder: 'hover:border-emerald-500/30', hoverBg: 'hover:bg-emerald-500/5', overlayBg: 'bg-emerald-500/5' },
    violet: { text: 'text-violet-400', bg: 'bg-violet-500/20', border: 'border-violet-500/50', hoverBorder: 'hover:border-violet-500/30', hoverBg: 'hover:bg-violet-500/5', overlayBg: 'bg-violet-500/5' },
    red: { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50', hoverBorder: 'hover:border-red-500/30', hoverBg: 'hover:bg-red-500/5', overlayBg: 'bg-red-500/5' },
};

const ACTIONS: QuickAction[] = [
    { label: 'Help', command: 'sys:help', icon: <Search size={14} />, color: 'blue' },
    { label: 'Health', command: 'sys:health', icon: <Zap size={14} />, color: 'cyan' },
    { label: 'Autopilot', command: 'sys:autopilot', icon: <ShieldOff size={14} />, color: 'blue' },
    { label: 'Maintain', command: 'sys:maintenance_window', icon: <Brain size={14} />, color: 'violet', danger: true },
    { label: 'Recover', command: 'sys:emergency_recover', icon: <Power size={14} />, color: 'red', danger: true },
    { label: 'Optimize', command: 'sys:optimize', icon: <Zap size={14} />, color: 'amber' },
    { label: 'Prune', command: 'sys:prune', icon: <Trash2 size={14} />, color: 'emerald' },
    { label: 'Rebuild', command: 'sys:rebuild', icon: <RotateCcw size={14} />, color: 'violet', danger: true },
    { label: 'Reboot', command: 'sys:reboot', icon: <Power size={14} />, color: 'red', danger: true },
];

export function QuickActions() {
    const [executing, setExecuting] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<string | null>(null);

    const fireCommand = async (action: QuickAction) => {
        if (action.danger && !confirm(`⚠️ Are you sure you want to ${action.label.toUpperCase()}?`)) return;

        setExecuting(action.command);
        setLastResult(null);

        try {
            const cmdId = `nexus_qa_${Date.now()}`;
            const { error } = await supabase.from('ghost_bridge').insert({
                id: cmdId,
                command: action.command,
                source: 'nexus_quick_action',
                status: 'pending'
            });

            if (error) throw error;

            // Listen for response
            const channel = supabase.channel(`qa_${cmdId}`)
                .on('postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'ghost_bridge', filter: `id=eq.${cmdId}` },
                    (payload) => {
                        const { status, output } = payload.new;
                        if (status === 'executed' || status === 'failed') {
                            setLastResult(output || status);
                            setExecuting(null);
                            supabase.removeChannel(channel);
                        }
                    }
                ).subscribe();

            // Timeout
            setTimeout(() => {
                supabase.removeChannel(channel);
                setExecuting(null);
            }, 15000);

        } catch (err) {
            setLastResult(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
            setExecuting(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
                <Terminal size={12} className="text-cyan-400" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">
                    Quick Actions
                </h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {ACTIONS.map((action) => {
                    return (
                        <NeuralButton
                            key={action.command}
                            variant={action.danger ? 'danger' : 'neumorphic'}
                            size="sm"
                            onClick={() => fireCommand(action)}
                            isLoading={executing === action.command}
                            disabled={executing !== null && executing !== action.command}
                            className="h-20"
                        >
                            <div className="flex flex-col items-center gap-1">
                                {action.icon}
                                <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
                            </div>
                        </NeuralButton>
                    );
                })}
            </div>

            {lastResult && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] font-mono text-white/60 break-words"
                >
                    → {lastResult}
                </motion.div>
            )}
        </div>
    );
}
