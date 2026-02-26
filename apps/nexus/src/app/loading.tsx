'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function Loading() {
    return (
        <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center gap-6 selection:bg-cyan-500/30">
            {/* Pulsing Core */}
            <div className="relative">
                <div className="w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <RefreshCw className="text-cyan-400 animate-spin-slow" size={32} />
                </div>
                {/* Orbital Rings */}
                <div className="absolute inset-[-10px] border border-cyan-500/10 rounded-full animate-ping-slow" />
                <div className="absolute inset-[-30px] border border-violet-500/5 rounded-full animate-pulse" />
            </div>

            <div className="flex flex-col items-center gap-2">
                <h2 className="text-xs font-black uppercase tracking-[0.5em] text-cyan-400">
                    Neural Link Active
                </h2>
                <div className="flex gap-1 h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-violet-400 animate-loading-bar" style={{ width: '40%' }} />
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                    Synchronizing Matrix Segments...
                </p>
            </div>
        </div>
    );
}
