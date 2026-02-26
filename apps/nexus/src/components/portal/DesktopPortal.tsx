'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Wifi, WifiOff, Maximize2, X } from 'lucide-react';
import { NeuralSurface } from '../ui/NeuralSurface';
import { NeuralButton } from '../ui/NeuralButton';
import { supabase } from '@/lib/supabase'; // Use shared client

export function DesktopPortal() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const hasSupabase = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder';
    const [isActive, setIsActive] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [status, setStatus] = useState<'offline' | 'connecting' | 'online'>('offline');
    const [retry, setRetry] = useState(0);
    const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const toggleStream = async () => {
        if (!hasSupabase) return;
        if (isActive) {
            setStatus('offline');
            setIsActive(false);
            // Send explicit STOP command
            await supabase.from('ghost_bridge').insert({
                command: 'vision:stop',
                source: 'nexus_portal',
                status: 'pending'
            });
        } else {
            setStatus('connecting');
            // Send explicit START command
            await supabase.from('ghost_bridge').insert({
                command: 'vision:start',
                source: 'nexus_portal',
                status: 'pending'
            });

            // Wait a moment for server to spin up
            setTimeout(() => {
                setIsActive(true);
                setStatus('online');
                setRetry(r => r + 1); // Force image refresh
            }, 2000);
        }
    };

    return (
        <NeuralSurface className={`relative overflow-hidden transition-all duration-500 ${isFullscreen ? 'fixed inset-4 z-[200] max-h-none' : 'h-[300px]'}`}>
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-black/40 backdrop-blur-sm border-b border-white/5 z-10">
                <div className="flex items-center gap-3">
                    <Monitor size={16} className={isActive ? "text-cyan-400" : "text-slate-600"} />
                    <span className="text-xs font-bold text-white">Desktop Portal</span>
                    {isActive && hasSupabase && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-emerald-400">LIVE</span>
                        </div>
                    )}
                    {!hasSupabase && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span className="text-[9px] font-bold text-amber-300">OFFLINE</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button type="button"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        {isFullscreen ? <X size={14} /> : <Maximize2 size={14} />}
                    </button>
                    <NeuralButton
                        size="sm"
                        variant={isActive ? "danger" : "primary"}
                        onClick={toggleStream}
                        className="h-7 text-[10px]"
                        disabled={!hasSupabase}
                    >
                        {isActive ? 'Terminate' : 'Initialize'}
                    </NeuralButton>
                </div>
            </div>

            {/* Viewport */}
            <div className="w-full h-full bg-black/80 flex items-center justify-center pt-12 pb-4 px-4">
                <AnimatePresence mode="wait">
                    {isActive ? (
                        <motion.div
                            key="stream"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full relative rounded-xl overflow-hidden border border-white/10 shadow-2xl"
                        >
                            {/* Stream Image */}
                            <Image
                                src={`${process.env.NEXT_PUBLIC_STREAM_URL || `//${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3334`}/stream?t=${retry}`}
                                alt="Desktop Stream"
                                width={1280}
                                height={720}
                                className="w-full h-full object-contain"
                                onError={() => setStatus('connecting')}
                                onLoad={() => setStatus('online')}
                                loader={({ src }) => src}
                                unoptimized
                            />

                            {/* Scanlines Overlay */}
                            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[2] bg-[length:100%_2px,3px_100%]" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="offline"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-4 text-slate-600"
                        >
                            <WifiOff size={48} strokeWidth={1} />
                            <span className="text-xs font-medium text-slate-700">Signal Lost - Stream Offline</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </NeuralSurface>
    );
}
