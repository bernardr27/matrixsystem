'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Database, Zap, Activity, Clock } from 'lucide-react';
import { useTelemetry } from '@/components/providers/TelemetryProvider';
import { cn } from '@/lib/utils';

export default function MemoryCore() {
    const { broadcasts } = useTelemetry();
    const [vectors, setVectors] = React.useState<{ id: string; op: string; status: string; time: string }[]>([]);

    React.useEffect(() => {
        // Transform broadcasts into "Memory Vectors"
        // If no broadcasts, show initialization state
        if (broadcasts.length === 0) {
            setVectors([
                { id: 'vec-init', op: 'Neural_Handshake', status: 'verified', time: new Date().toLocaleTimeString([], { hour12: false }) }
            ]);
            return;
        }

        const newVectors = broadcasts.slice(0, 5).map(b => ({
            id: `vec-${b.id.substring(0, 4)}`,
            op: b.message.length > 20 ? b.message.substring(0, 18) + '..' : b.message,
            status: 'verified',
            time: new Date(b.timestamp).toLocaleTimeString([], { hour12: false })
        }));
        setVectors(newVectors);
    }, [broadcasts]);

    return (
        <div className="glass-card p-8 rounded-[2.5rem] border-white/5 flex flex-col gap-8 shadow-2xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                        <Database size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">Memory_Core</h3>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1.5 italic">Vector_Archive_v4.2 [OPTIMIZED]</p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-1.5 bg-white/5 border border-white/5 rounded-full backdrop-blur-md">
                    <Clock size={12} className="text-violet-400" />
                    <span className="text-[9px] font-mono font-black text-white/50 tracking-widest">
                        VEC_{vectors.length > 0 ? 'ACTIVE' : 'IDLE'}
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                {vectors.map((vec, i) => (
                    <motion.div
                        key={vec.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-[8px] font-mono text-slate-600">[{vec.time}]</span>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-violet-400 transition-colors">{vec.op}</span>
                                <span className="text-[7px] text-slate-500 uppercase tracking-widest">ID::{vec.id}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border",
                                vec.status === 'verified' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            )}>
                                {vec.status}
                            </div>
                            <Activity size={10} className="text-slate-700" />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="pt-4 border-t border-white/5">
                <button type="button" className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[8px] font-black text-slate-500 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">
                    Full_Memory_Archive
                </button>
            </div>
        </div>
    );
}
