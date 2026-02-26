'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles } from 'lucide-react';
import { VisionCamera } from '@/components/VisionCamera';
import { cn } from '@/lib/utils';

interface NeuralInputProps {
    value: string;
    onChange: (val: string) => void;
    onSend: () => void;
    status: string;
}

export function NeuralInput({ value, onChange, onSend, status }: NeuralInputProps) {
    const isThinking = status === 'thinking' || status === 'executing';

    return (
        <section className="flex flex-col gap-4">
            <div className="flex gap-3 items-center">
                {/* TACTILE VISION PORT */}
                <div className="flex-shrink-0 group relative">
                    <VisionCamera />
                    <div className="absolute inset-0 border border-cyan-500/20 rounded-2xl pointer-events-none group-hover:border-cyan-500/40 transition-colors" />
                </div>

                {/* COMMAND INPUT FIELD */}
                <motion.div
                    animate={isThinking ? {
                        boxShadow: ['0 0 0px var(--accent)', '0 0 20px var(--accent)', '0 0 0px var(--accent)'],
                        borderColor: ['var(--glass-border)', 'var(--accent)', 'var(--glass-border)']
                    } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="relative flex-1 bg-zinc-950/60 border border-white/5 rounded-2xl px-5 py-4 flex items-center gap-4 group focus-within:border-cyan-500/40 transition-all shadow-2xl overflow-hidden"
                >
                    <div className="scanline opacity-[0.02] pointer-events-none" />

                    <MessageSquare size={18} className={cn(
                        "transition-colors duration-300",
                        isThinking ? "text-cyan-400 animate-pulse" : "text-cyan-400/40 group-focus-within:text-cyan-400"
                    )} />

                    <input
                        type="text"
                        placeholder="Direct instruction to Sage..."
                        className="bg-transparent border-none text-white outline-none flex-1 text-[13px] placeholder:text-white/10 font-medium tracking-wide"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSend()}
                    />

                    {/* DECORATIVE PIPS */}
                    <div className="hidden xs:flex gap-1 opacity-20 group-focus-within:opacity-50 transition-opacity">
                        <div className="w-1 h-3 bg-white/20 rounded-full" />
                        <div className="w-1 h-3 bg-white/20 rounded-full" />
                    </div>
                </motion.div>
            </div>

            {/* SEND BUTTON v2 */}
            <motion.button
                whileHover={{ scale: 1.01, backgroundColor: 'rgba(34, 211, 238, 0.1)' }}
                whileTap={{ scale: 0.99 }}
                onClick={onSend}
                disabled={isThinking || !value.trim()}
                className={cn(
                    "w-full py-4 rounded-2xl font-black text-[10px] tracking-[0.5em] uppercase border transition-all relative overflow-hidden group",
                    isThinking || !value.trim()
                        ? "border-white/5 text-white/10 bg-transparent"
                        : "border-cyan-500/40 text-cyan-400 bg-cyan-500/5 shadow-[0_0_30px_rgba(34,211,238,0.1)]"
                )}
            >
                <div className="scanline opacity-[0.05]" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                    {isThinking ? "Synthesizing..." : "Neural_Send"}
                    {!isThinking && <Sparkles size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />}
                </span>
            </motion.button>
        </section>
    );
}
