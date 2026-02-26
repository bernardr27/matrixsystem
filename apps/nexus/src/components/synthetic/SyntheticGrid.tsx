'use client';

import React from 'react';
import * as SyntheticComponents from './index';

export function SyntheticGrid() {
    const components = Object.entries(SyntheticComponents).filter(([name]) => name !== 'default');

    if (components.length === 0) {
        return (
            <div className="glass-card p-8 flex flex-col items-center justify-center text-center opacity-40 border-dashed border-white/5 bg-transparent">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-2">Neural Sandbox Empty</div>
                <p className="text-[9px] text-slate-500 max-w-[200px]">
                    Use the Neural Forge to synthesize new dashboard modules and features.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {components.map(([name, Component]: [string, any]) => (
                <div key={name} className="relative group">
                    <div className="absolute -top-3 left-4 px-2 py-0.5 bg-black border border-white/10 rounded-full text-[8px] font-bold text-cyan-400 z-10 group-hover:border-cyan-500/50 transition-colors">
                        SYNTHETIC::{name.toUpperCase()}
                    </div>
                    <Component />
                </div>
            ))}
        </div>
    );
}
