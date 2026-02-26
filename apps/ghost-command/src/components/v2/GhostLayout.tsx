'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GhostLayoutProps {
    children: React.ReactNode;
}

export function GhostLayout({ children }: GhostLayoutProps) {
    return (
        <div className="relative h-screen w-full bg-[#050505] overflow-hidden flex flex-col text-slate-100 selection:bg-cyan-500/30 overscroll-none">
            {/* ATMOSPHERIC LAYER */}
            <div className="ambient-glow" />

            {/* PROCEDURAL NOISE LAYER */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg%20viewBox%3D%270%200%20200%20200%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cfilter%20id%3D%27n%27%3E%3CfeTurbulence%20type%3D%27fractalNoise%27%20baseFrequency%3D%270.65%27%20numOctaves%3D%273%27%20stitchTiles%3D%27stitch%27%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%27100%25%27%20height%3D%27100%25%27%20filter%3D%27url%28%23n%29%27%2F%3E%3C%2Fsvg%3E")` }} />

            {/* MASTER SCANLINE */}
            <div className="scanline fixed inset-0 z-50 pointer-events-none" />

            {/* CONTENT ORCHESTRATOR - FLEX GROW */}
            <div className="relative z-10 flex flex-col h-full">
                {children}
            </div>

            {/* VIGNETTE EFFECT */}
            <div className="fixed inset-0 pointer-events-none z-40 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

            {/* VECTOR GRID (SUBTLE) */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]"
                style={{
                    backgroundImage: `linear-gradient(var(--glass-border) 1px, transparent 1px), linear-gradient(90deg, var(--glass-border) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }} />
        </div>
    );
}
