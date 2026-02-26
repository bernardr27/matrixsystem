'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { NeuralSurface } from '../ui/NeuralSurface';

interface Session {
    id: string;
    started_at: string;
    mode: string;
    initial_input: string;
}

export default function SoulStream() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchRecent = async () => {
            const { data } = await supabase
                .from('sessions')
                .select('id, started_at, mode, initial_input')
                .order('started_at', { ascending: false })
                .limit(8);

            if (data) setSessions(data);
            setLoading(false);
        };
        fetchRecent();
    }, [supabase]);

    const getModeColor = (mode: string) => {
        switch (mode) {
            case 'mindset': return 'var(--accent)';
            case 'career': return '#10b981';
            case 'money': return '#f59e0b';
            case 'relationships': return '#ec4899';
            case 'discipline': return '#6366f1';
            default: return 'var(--foreground)';
        }
    };

    if (loading) return null;

    return (
        <div className="w-full h-full p-2 overflow-y-auto custom-scrollbar pr-2">
            <div className="flex flex-col gap-6 relative">
                {/* Visual Resonance Thread */}
                <div className="absolute left-[23px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-cyan-500/20 via-violet-500/20 to-transparent" />

                {sessions.map((session, i) => (
                    <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className="relative group"
                    >
                        {/* THE CONVERSATIONAL CARD (Veylix/Nova Style) */}
                        <div className="ml-10 relative">
                            <NeuralSurface
                                variant="glass"
                                className="p-5 border-white/5 hover:border-cyan-500/30 transition-all duration-500 bg-white/[0.02] backdrop-blur-3xl group-hover:bg-white/[0.04]"
                                hoverEffect
                            >
                                {/* Header: Meta & Status */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full animate-pulse"
                                            style={{ backgroundColor: getModeColor(session.mode), boxShadow: `0 0 10px ${getModeColor(session.mode)}` }}
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                                            {session.mode}_node
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-mono text-white/20">
                                        {new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {/* Main Content: The Prompt */}
                                <p className="text-sm font-light leading-relaxed text-slate-300 italic">
                                    &quot;{session.initial_input}&quot;
                                </p>

                                {/* Aesthetic Foot: Nova Gradient Bar */}
                                <div className="mt-4 h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(bit => (
                                            <div key={bit} className="w-4 h-4 rounded-full border border-black bg-slate-800 flex items-center justify-center">
                                                <div className="w-1 h-1 rounded-full bg-cyan-500/40" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-[8px] font-bold text-cyan-500/40 tracking-widest uppercase">
                                        Verified_Sync
                                    </div>
                                </div>
                            </NeuralSurface>

                            {/* Resonance Connector Node */}
                            <div
                                className="absolute -left-[30px] top-6 w-5 h-5 rounded-full border-2 border-black z-20 flex items-center justify-center transition-transform group-hover:scale-125"
                                style={{ backgroundColor: 'var(--m-bg-primary)' }}
                            >
                                <div
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: getModeColor(session.mode), boxShadow: `0 0 8px ${getModeColor(session.mode)}` }}
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}

                {sessions.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center opacity-20 filter grayscale">
                        <div className="w-12 h-12 border border-dashed border-white/20 rounded-full animate-spin-slow mb-4" />
                        <span className="text-[10px] font-black tracking-[0.5em] uppercase">No_Signal_Detected</span>
                    </div>
                )}
            </div>
        </div>
    );
}
