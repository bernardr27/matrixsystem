'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Play, Pause, Copy, Trash2, Plus, RefreshCw, Cpu, Wifi, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useSage } from '@/context/SageContext';

interface Blueprint {
    id: string;
    title: string;
    description: string;
    status: 'queued' | 'executing' | 'completed' | 'failed' | 'paused';
    priority: string;
    payload: any;
    created_at: string;
    updated_at?: string;
}

export default function ArchitectDashboard() {
    const { systemHealth, sendCommand } = useSage();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const hasSupabase = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder';

    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [selectedBp, setSelectedBp] = useState<Blueprint | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastSync, setLastSync] = useState<string>('');

    // New blueprint form
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newPriority, setNewPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');

    const fetchBlueprints = useCallback(async () => {
        if (!hasSupabase) { setLoading(false); return; }
        const { data } = await supabase
            .from('matrix_missions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(25);
        if (data) {
            setBlueprints(data);
            setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            // Refresh selected if it still exists in new data
            setSelectedBp(prev => {
                if (!prev) return prev;
                const updated = data.find((b: any) => b.id === prev.id);
                return updated || prev;
            });
        }
        setLoading(false);
    }, [hasSupabase]);

    // Initial fetch + realtime subscription
    useEffect(() => {
        fetchBlueprints();
        if (!hasSupabase) return;

        const channel = supabase
            .channel('architect_blueprints')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matrix_missions' }, () => {
                fetchBlueprints();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchBlueprints, hasSupabase]);

    const handleCreate = async () => {
        if (!hasSupabase || !newTitle.trim()) return;
        const { error } = await supabase.from('matrix_missions').insert({
            title: newTitle.trim(),
            description: newDesc.trim() || 'Blueprint protocol',
            priority: newPriority,
            payload: { type: 'blueprint' },
            status: 'queued',
        });
        if (!error) {
            setNewTitle('');
            setNewDesc('');
            setShowCreate(false);
            await sendCommand(`mission:${newTitle.trim()}`, { silent: true });
        }
    };

    const handleExecute = async () => {
        if (!selectedBp || !hasSupabase) return;
        await supabase.from('matrix_missions').update({ status: 'executing' }).eq('id', selectedBp.id);
        await sendCommand(`mission:execute ${selectedBp.title}`, { silent: true });
    };

    const handlePause = async () => {
        if (!selectedBp || !hasSupabase) return;
        await supabase.from('matrix_missions').update({ status: 'paused' }).eq('id', selectedBp.id);
    };

    const handleClone = async () => {
        if (!selectedBp || !hasSupabase) return;
        await supabase.from('matrix_missions').insert({
            title: `${selectedBp.title} (Clone)`,
            description: selectedBp.description,
            priority: selectedBp.priority,
            payload: { ...selectedBp.payload, cloned_from: selectedBp.id },
            status: 'queued',
        });
    };

    const handleDelete = async () => {
        if (!selectedBp || !hasSupabase) return;
        await supabase.from('matrix_missions').delete().eq('id', selectedBp.id);
        setSelectedBp(null);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-emerald-400';
            case 'executing': return 'text-cyan-400 animate-pulse';
            case 'queued': return 'text-amber-400';
            case 'paused': return 'text-slate-400';
            case 'failed': return 'text-red-400';
            default: return 'text-slate-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'queued': return 'PENDING';
            case 'executing': return 'IN_PROGRESS';
            case 'completed': return 'COMPLETED';
            case 'failed': return 'FAILED';
            case 'paused': return 'PAUSED';
            default: return status.toUpperCase();
        }
    };

    const getPercentage = (status: string) => {
        switch (status) {
            case 'completed': return 100;
            case 'failed': return 0;
            case 'queued': return 0;
            case 'paused': return 50;
            case 'executing': return 65;
            default: return 0;
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0f1a] text-cyan-400 overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-cyan-900/20 flex items-center justify-between bg-black/40 shrink-0 flex-wrap gap-3">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <Shield size={20} className="text-cyan-400 shrink-0 hidden sm:block" />
                    <Shield size={16} className="text-cyan-400 shrink-0 sm:hidden" />
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl font-bold text-white truncate">Architect</h1>
                        <p className="text-[9px] sm:text-[10px] text-cyan-500/60 truncate">
                            {hasSupabase ? `Blueprint Control · Synced ${lastSync || '...'}` : 'Offline — configure Supabase'}
                        </p>
                    </div>
                </div>

                {/* Live system pills */}
                <div className="hidden md:flex items-center gap-3 text-[10px]">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-cyan-900/20">
                        <Cpu size={10} className="text-cyan-400" />
                        <span className="text-white/50">CPU</span>
                        <span className="text-cyan-400 font-bold">{parseInt(systemHealth.cpu) || 0}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-cyan-900/20">
                        <Zap size={10} className="text-cyan-400" />
                        <span className="text-white/50">RAM</span>
                        <span className="text-cyan-400 font-bold">{parseInt(systemHealth.ram) || 0}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-cyan-900/20">
                        <Wifi size={10} className={systemHealth.online ? "text-emerald-400" : "text-red-400"} />
                        <span className="text-white/50">Net</span>
                        <span className={cn("font-bold", systemHealth.online ? "text-emerald-400" : "text-red-400")}>
                            {systemHealth.online ? `${systemHealth.networkLatency}ms` : 'Off'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Blueprints List */}
                <div className="w-full lg:w-96 flex flex-col border-b lg:border-b-0 lg:border-r border-cyan-900/20 bg-black/20 overflow-hidden">
                    <div className="p-4 border-b border-cyan-900/20 space-y-2 shrink-0">
                        <div className="flex gap-2">
                            <button type="button"
                                onClick={() => setShowCreate(!showCreate)}
                                className="flex-1 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                            >
                                <Plus size={14} /> Create Blueprint
                            </button>
                            <button type="button"
                                onClick={fetchBlueprints}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                                title="Refresh"
                            >
                                <RefreshCw size={14} className="text-cyan-400" />
                            </button>
                        </div>

                        {/* Create form */}
                        <AnimatePresence>
                            {showCreate && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden space-y-2"
                                >
                                    <input
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        placeholder="Blueprint title..."
                                        className="w-full bg-black/40 border border-cyan-900/30 rounded-lg py-2 px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyan-500/50"
                                    />
                                    <input
                                        value={newDesc}
                                        onChange={e => setNewDesc(e.target.value)}
                                        placeholder="Description (optional)..."
                                        className="w-full bg-black/40 border border-cyan-900/30 rounded-lg py-2 px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyan-500/50"
                                    />
                                    <div className="flex gap-1">
                                        {(['low', 'normal', 'high', 'critical'] as const).map(p => (
                                            <button type="button"
                                                key={p}
                                                onClick={() => setNewPriority(p)}
                                                className={cn(
                                                    "flex-1 py-1.5 rounded text-[10px] font-bold uppercase border transition-all",
                                                    newPriority === p
                                                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                                                        : "bg-black/20 border-white/10 text-white/30 hover:text-white/60"
                                                )}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                    <button type="button"
                                        onClick={handleCreate}
                                        disabled={!newTitle.trim() || !hasSupabase}
                                        className="w-full py-2 rounded-lg bg-cyan-500 text-black font-bold text-sm hover:bg-cyan-400 transition-all disabled:opacity-30"
                                    >
                                        Deploy Blueprint
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {loading && (
                            <div className="text-center py-10 text-white/20">Loading...</div>
                        )}
                        {!loading && blueprints.length === 0 && (
                            <div className="text-center py-10 text-white/20 italic">
                                {hasSupabase ? 'No blueprints yet' : 'Offline'}
                            </div>
                        )}
                        {blueprints.map(bp => (
                            <motion.div
                                key={bp.id}
                                layout
                                onClick={() => setSelectedBp(bp)}
                                className={cn(
                                    "p-3 rounded-lg border cursor-pointer transition-all",
                                    selectedBp?.id === bp.id
                                        ? "bg-cyan-500/15 border-cyan-500/50"
                                        : "bg-white/[0.03] border-white/10 hover:border-cyan-500/30"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-sm text-white truncate pr-2">{bp.title}</h3>
                                    <span className={cn("text-[10px] font-medium shrink-0", getStatusColor(bp.status))}>
                                        {getStatusLabel(bp.status)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[9px] text-white/30 font-mono">#{bp.id.substring(0, 8)}</span>
                                    <span className={cn(
                                        "text-[9px] font-bold uppercase",
                                        bp.priority === 'critical' ? "text-red-400" :
                                        bp.priority === 'high' ? "text-amber-400" : "text-white/30"
                                    )}>{bp.priority}</span>
                                </div>
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        animate={{ width: `${getPercentage(bp.status)}%` }}
                                        className={cn(
                                            "h-full rounded-full",
                                            bp.status === 'completed' ? "bg-emerald-500" :
                                            bp.status === 'failed' ? "bg-red-500" : "bg-cyan-500"
                                        )}
                                    />
                                </div>
                                <p className="text-[9px] text-white/20 mt-1.5">
                                    {new Date(bp.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Details Panel */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {selectedBp ? (
                        <div className="space-y-4 sm:space-y-6">
                            <div className="p-4 sm:p-6 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                                <div className="flex items-start justify-between mb-2">
                                    <h2 className="text-xl sm:text-2xl font-bold text-white">{selectedBp.title}</h2>
                                    <span className={cn("text-xs font-bold px-3 py-1 rounded-full border", 
                                        selectedBp.status === 'completed' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                                        selectedBp.status === 'executing' ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 animate-pulse" :
                                        selectedBp.status === 'failed' ? "bg-red-500/10 border-red-500/30 text-red-400" :
                                        "bg-white/5 border-white/10 text-white/50"
                                    )}>
                                        {getStatusLabel(selectedBp.status)}
                                    </span>
                                </div>
                                <p className="text-sm sm:text-base text-cyan-400/80 mb-4">{selectedBp.description}</p>

                                {/* Progress */}
                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/60">Completion</span>
                                        <span className="text-cyan-400">{getPercentage(selectedBp.status)}%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            animate={{ width: `${getPercentage(selectedBp.status)}%` }}
                                            className={cn(
                                                "h-full rounded-full",
                                                selectedBp.status === 'completed' ? "bg-emerald-500" :
                                                selectedBp.status === 'failed' ? "bg-red-500" : "bg-cyan-500"
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-4 gap-3">
                                    <button type="button"
                                        onClick={handleExecute}
                                        disabled={!hasSupabase || selectedBp.status === 'executing' || selectedBp.status === 'completed'}
                                        className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all flex items-center justify-center disabled:opacity-30"
                                        title="Execute"
                                    >
                                        <Play size={16} />
                                    </button>
                                    <button type="button"
                                        onClick={handlePause}
                                        disabled={!hasSupabase || selectedBp.status !== 'executing'}
                                        className="p-3 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all flex items-center justify-center disabled:opacity-30"
                                        title="Pause"
                                    >
                                        <Pause size={16} />
                                    </button>
                                    <button type="button"
                                        onClick={handleClone}
                                        disabled={!hasSupabase}
                                        className="p-3 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all flex items-center justify-center disabled:opacity-30"
                                        title="Clone"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button type="button"
                                        onClick={handleDelete}
                                        disabled={!hasSupabase}
                                        className="p-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center disabled:opacity-30"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Metadata</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-white/40">ID:</span> <span className="text-cyan-400 font-mono text-xs">{selectedBp.id.substring(0, 12)}</span></div>
                                    <div><span className="text-white/40">Priority:</span> <span className={cn(
                                        "font-semibold capitalize",
                                        selectedBp.priority === 'critical' ? "text-red-400" :
                                        selectedBp.priority === 'high' ? "text-amber-400" : "text-cyan-400"
                                    )}>{selectedBp.priority}</span></div>
                                    <div><span className="text-white/40">Created:</span> <span className="text-cyan-400 text-xs">{new Date(selectedBp.created_at).toLocaleString()}</span></div>
                                    <div><span className="text-white/40">Status:</span> <span className={cn("font-semibold", getStatusColor(selectedBp.status))}>{getStatusLabel(selectedBp.status)}</span></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-40">
                            <Shield size={48} className="mb-4 text-cyan-500" />
                            <p className="text-center text-sm">Select a blueprint to view details</p>
                            <p className="text-[10px] text-white/30 mt-1">or create a new one</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
