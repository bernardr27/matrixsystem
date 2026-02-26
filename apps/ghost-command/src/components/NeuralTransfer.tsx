'use client';

import React, { useState } from 'react';
import { supabase, GHOST_BRIDGE_TABLE } from '@/lib/supabase';
import { Upload, Check, AlertCircle, FileText, Loader2, X, Database, HardDrive, ArrowRight } from 'lucide-react';
import { NeuralButton } from '@/components/ui/NeuralButton';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UploadTask {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    errorMsg?: string;
    progress: number;
}

export const NeuralTransfer: React.FC = () => {
    const [tasks, setTasks] = useState<UploadTask[]>([]);
    const [isHovering, setIsHovering] = useState(false);

    const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        addTasks(Array.from(e.target.files));
    };

    const addTasks = (files: File[]) => {
        const newTasks: UploadTask[] = files.map(file => ({
            id: Math.random().toString(36).substring(7),
            file,
            status: 'pending',
            progress: 0
        }));
        setTasks(prev => [...prev, ...newTasks]);
    };

    const removeTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const initiateTransfers = async () => {
        const pendingTasks = tasks.filter(t => t.status === 'pending');
        if (pendingTasks.length === 0) return;

        for (const task of pendingTasks) {
            updateTask(task.id, { status: 'uploading' });

            try {
                const fileName = `${Date.now()}_${task.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

                // 1. Upload to Storage
                const { data, error } = await supabase.storage
                    .from('ghost-storage')
                    .upload(`transfers/${fileName}`, task.file);

                if (error) throw error;

                // 2. Notify Bridge
                await supabase.from(GHOST_BRIDGE_TABLE).insert({
                    command: `transfer:download transfers/${fileName}`,
                    status: 'pending'
                });

                updateTask(task.id, { status: 'success' });
            } catch (err: unknown) {
                console.error(`Upload failed for ${task.file.name}:`, err);
                updateTask(task.id, {
                    status: 'error',
                    errorMsg: err instanceof Error ? err.message : 'Transmission Interrupted'
                });
            }
        }
    };

    const updateTask = (id: string, updates: Partial<UploadTask>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const isProcessing = tasks.some(t => t.status === 'uploading');
    const hasPending = tasks.some(t => t.status === 'pending');

    return (
        <div className="relative overflow-hidden rounded-sm border border-white/10 bg-[#050505] shadow-xl font-mono text-sm group z-10">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 select-none">
                <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] text-cyan-400/80">
                    <Database size={12} />
                    <span>DATA_INGESTION_PORT</span>
                </div>
                {!isProcessing && tasks.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setTasks([])}
                        className="text-[9px] text-white/30 hover:text-red-400 transition-colors tracking-wider uppercase"
                    >
                        [FLUSH_BUFFER]
                    </button>
                )}
            </div>

            {/* Drop Zone */}
            <div
                className={cn(
                    "relative p-6 transition-all duration-300",
                    isHovering ? "bg-cyan-500/10" : "bg-transparent"
                )}
                onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
                onDragLeave={() => setIsHovering(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsHovering(false);
                    if (e.dataTransfer.files) addTasks(Array.from(e.dataTransfer.files));
                }}
            >
                <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-white/10 rounded-sm p-4 hover:border-cyan-500/50 transition-colors group/zone cursor-pointer">
                    <input
                        type="file"
                        multiple
                        onChange={handleFileSelection}
                        disabled={isProcessing}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className={cn(
                        "p-2 rounded-full transition-all duration-500",
                        isHovering ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-white/20 group-hover/zone:text-white/50"
                    )}>
                        <HardDrive size={24} />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] tracking-widest text-cyan-500 font-bold uppercase">
                            {isHovering ? '<< INJECT_DATA >>' : 'INITIALIZE_TRANSFER'}
                        </span>
                        <span className="text-[9px] text-white/30 uppercase">
                            Drag Artifacts or Select Source
                        </span>
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto px-4 pb-4">
                <AnimatePresence>
                    {tasks.map((task) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className={cn(
                                "flex items-center gap-3 p-2 border-l-2 text-[10px]",
                                task.status === 'pending' && "border-white/30 bg-white/5",
                                task.status === 'uploading' && "border-cyan-500 bg-cyan-950/30",
                                task.status === 'success' && "border-emerald-500 bg-emerald-950/20",
                                task.status === 'error' && "border-red-500 bg-red-950/30"
                            )}
                        >
                            <FileText size={12} className="text-white/40" />

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold truncate text-white/80">{task.file.name}</span>
                                    <span className="text-white/30 font-mono">{(task.file.size / 1024).toFixed(1)}kb</span>
                                </div>
                                {task.status === 'error' && (
                                    <div className="text-red-400 text-[9px] mt-0.5 font-bold truncate">
                                        ERR: {task.errorMsg}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center">
                                {task.status === 'pending' && !isProcessing && (
                                    <button type="button" onClick={() => removeTask(task.id)} className="text-white/20 hover:text-white transition-colors">
                                        <X size={12} />
                                    </button>
                                )}
                                {task.status === 'uploading' && <Loader2 size={12} className="animate-spin text-cyan-400" />}
                                {task.status === 'success' && <Check size={12} className="text-emerald-500" />}
                                {task.status === 'error' && <AlertCircle size={12} className="text-red-500" />}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Actions */}
            {tasks.length > 0 && (
                <div className="p-4 pt-0">
                    <NeuralButton
                        onClick={initiateTransfers}
                        disabled={isProcessing || !hasPending}
                        variant={isProcessing ? 'secondary' : hasPending ? 'primary' : 'secondary'}
                        isLoading={isProcessing}
                        className={cn(
                            "w-full text-[10px] tracking-widest uppercase",
                            isProcessing && "opacity-80",
                            hasPending && "border-cyan-500 hover:bg-cyan-500/10",
                            !hasPending && !isProcessing && "border-emerald-500 text-emerald-500"
                        )}
                        style={{
                            justifyContent: 'center',
                            padding: '12px'
                        }}
                    >
                        {isProcessing ? (
                            "Negotiating Uplink..."
                        ) : hasPending ? (
                            <>
                                <span>EXECUTE_SEQUENCE</span>
                                <ArrowRight size={14} />
                            </>
                        ) : (
                            <span>TRANSMISSION_COMPLETE</span>
                        )}
                    </NeuralButton>
                </div>
            )}
        </div>
    );
};
