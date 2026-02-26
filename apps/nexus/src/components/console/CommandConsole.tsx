'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, X, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { uuidv4 } from '@/lib/uuid';

export function CommandConsole() {
    const [command, setCommand] = useState('');
    const [logs, setLogs] = useState<{ id: string; text: string; type: 'cmd' | 'sys' | 'err'; timestamp: string }[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('nexus_command_logs');
            if (saved) {
                setLogs(JSON.parse(saved));
            } else {
                setLogs([
                    { id: '1', text: 'MATRIX HUB SYSTEM INITIALIZED', type: 'sys', timestamp: '00:00:00' },
                    { id: '2', text: 'AWAITING NEURAL INPUT...', type: 'sys', timestamp: '00:00:00' },
                ]);
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && logs.length > 0) {
            localStorage.setItem('nexus_command_logs', JSON.stringify(logs.slice(-30)));
        }
    }, [logs]);

    const addLog = (text: string, type: 'cmd' | 'sys' | 'err' = 'sys') => {
        const timestamp = new Date(Date.now()).toLocaleTimeString([], { hour12: false });
        setLogs(prev => [...prev.slice(-15), { id: `${Date.now()}-${Math.random().toString()}`, text, type, timestamp }]);
    };

    const handleSendCommand = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!command.trim()) return;

        const cmd = command.trim();
        const cmdId = uuidv4();
        setCommand('');
        addLog(`> ${cmd}`, 'cmd');

        try {
            const { error } = await supabase
                .from('ghost_bridge')
                .insert([{
                    id: cmdId,
                    command: cmd,
                    source: 'nexus_remote',
                    status: 'pending'
                }]);

            if (error) throw error;

            // Subscribe to this specific command for feedback
            const channel = supabase.channel(`cmd_${cmdId}`)
                .on('postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'ghost_bridge', filter: `id=eq.${cmdId}` },
                    (payload) => {
                        const { status, output } = payload.new;
                        if (status === 'executing') {
                            addLog(`EXECUTING: ${cmd}`, 'sys');
                        } else if (status === 'executed') {
                            addLog(`COMPLETED: ${output || 'Success'}`, 'sys');
                            supabase.removeChannel(channel);
                        } else if (status === 'failed') {
                            addLog(`FAILED: ${output || 'Unknown error'}`, 'err');
                            supabase.removeChannel(channel);
                        }
                    }
                ).subscribe();

            // Timeout the subscription after 30s to prevent leaks
            setTimeout(() => supabase.removeChannel(channel), 30000);

        } catch (err) {
            addLog(`DISPATCH FAILED: ${err instanceof Error ? err.message : 'Unknown Error'}`, 'err');
        }
    };

    return (
        <div className="glass-card h-full flex flex-col overflow-hidden border-white/5">
            {/* Console Header */}
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal size={20} className="text-cyan-400" />
                    <span className="text-xs font-bold tracking-widest text-slate-300 uppercase">Remote Interface</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                </div>
            </div>

            {/* Output Area */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto font-mono text-[10px] sm:text-xs space-y-2 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {logs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                                "break-words",
                                log.type === 'err' ? 'text-red-400' : log.type === 'cmd' ? 'text-cyan-400' : 'text-slate-500'
                            )}
                        >
                            <span className="hidden sm:inline opacity-30 mr-2 shrink-0">[{log.timestamp}]</span>
                            {log.text}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendCommand} className="p-4 bg-white/5 border-t border-white/5 flex gap-3">
                <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="ENTER SYSTEM COMMAND..."
                    className="flex-1 bg-transparent border-none outline-none text-cyan-400 placeholder:text-slate-600 font-mono text-base md:text-xs uppercase tracking-wider"
                />
                <button
                    type="submit"
                    className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
