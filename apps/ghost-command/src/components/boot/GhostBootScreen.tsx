'use client';

import React, { useState, useEffect, useRef } from 'react';

/*  ═══════════════════════════════════════════════════════════
    GHOST COMMAND — BOOT SEQUENCE
    Industrial HUD targeting-ring loader with glitch text
    Accent: cyan (#0891b2)  Background: #0a0f1a
    ═══════════════════════════════════════════════════════════ */

const BOOT_LOG = [
    'GHOST_KERNEL v5.2 loaded',
    'Sentinel uplink... connected',
    'Neural mesh calibrating...',
    'Pulse encoder active',
    'Synaptic bridge online',
    'Ghost Runner initialized',
    'Triage module ready',
    'Command interface mounting...',
];

export function GhostBootScreen({ onComplete }: { onComplete: () => void }) {
    const [progress, setProgress] = useState(0);
    const [logLines, setLogLines] = useState<string[]>([]);
    const [phase, setPhase] = useState<'boot' | 'exit'>('boot');
    const completed = useRef(false);

    useEffect(() => {
        // Progress ticker
        const iv = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(iv);
                    return 100;
                }
                return prev + Math.random() * 4 + 1;
            });
        }, 60);

        // Boot log lines
        BOOT_LOG.forEach((line, i) => {
            setTimeout(() => {
                setLogLines(prev => [...prev, line]);
            }, 300 + i * 280);
        });

        return () => clearInterval(iv);
    }, []);

    useEffect(() => {
        if (progress >= 100 && !completed.current) {
            completed.current = true;
            setTimeout(() => setPhase('exit'), 400);
            setTimeout(() => onComplete(), 900);
        }
    }, [progress, onComplete]);

    const pct = Math.min(100, Math.round(progress));
    const dashOffset = 565.48 - (565.48 * pct) / 100; // circumference of r=90

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-500 ${phase === 'exit' ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
            style={{ background: '#0a0f1a' }}
        >
            {/* Scan line */}
            <div className="ghost-boot-scanline" />

            {/* Grid overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(8,145,178,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.03) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Targeting ring loader */}
            <div className="relative w-48 h-48 mb-8">
                {/* Outer pulse ring */}
                <div className="absolute inset-0 rounded-full border border-cyan-500/10 ghost-boot-pulse" />

                {/* SVG ring */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                    {/* Track */}
                    <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(8,145,178,0.08)" strokeWidth="2" />
                    {/* Segmented ticks */}
                    {Array.from({ length: 60 }).map((_, i) => {
                        const angle = (i * 6 * Math.PI) / 180;
                        const isMajor = i % 5 === 0;
                        const r1 = isMajor ? 78 : 82;
                        const r2 = 86;
                        return (
                            <line
                                key={i}
                                x1={100 + r1 * Math.cos(angle)}
                                y1={100 + r1 * Math.sin(angle)}
                                x2={100 + r2 * Math.cos(angle)}
                                y2={100 + r2 * Math.sin(angle)}
                                stroke={i <= (pct * 60) / 100 ? 'rgba(8,145,178,0.6)' : 'rgba(8,145,178,0.1)'}
                                strokeWidth={isMajor ? 2 : 1}
                            />
                        );
                    })}
                    {/* Progress arc */}
                    <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke="url(#ghostGrad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="565.48"
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-100"
                    />
                    <defs>
                        <linearGradient id="ghostGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0891b2" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Center percentage */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-mono font-bold text-cyan-400 tabular-nums tracking-tight">
                        {pct}
                    </span>
                    <span className="text-[9px] tracking-[0.3em] text-cyan-500/50 uppercase mt-1">percent</span>
                </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold tracking-[0.2em] text-cyan-400/90 uppercase ghost-boot-glitch" data-text="GHOST COMMAND">
                    GHOST COMMAND
                </h1>
                <p className="text-[10px] tracking-[0.4em] text-cyan-600/40 uppercase mt-2">
                    Tactical Neural Remote
                </p>
            </div>

            {/* Boot log */}
            <div className="w-72 max-h-36 overflow-hidden font-mono text-[10px] space-y-1">
                {logLines.map((line, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-2 text-cyan-500/40 animate-[fadeIn_0.3s_ease]"
                    >
                        <span className="text-cyan-600/30">&gt;</span>
                        <span>{line}</span>
                        {i === logLines.length - 1 && <span className="ghost-boot-cursor" />}
                    </div>
                ))}
            </div>

            <style jsx>{`
                .ghost-boot-scanline {
                    position: absolute;
                    left: 0; right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, rgba(8,145,178,0.12), transparent);
                    animation: ghostScan 4s linear infinite;
                    pointer-events: none;
                    z-index: 1;
                }
                @keyframes ghostScan {
                    0% { top: -2px; }
                    100% { top: 100%; }
                }
                .ghost-boot-pulse {
                    animation: ghostPulse 2s ease-in-out infinite;
                }
                @keyframes ghostPulse {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.08); opacity: 0.6; }
                }
                .ghost-boot-glitch {
                    position: relative;
                }
                .ghost-boot-glitch::before,
                .ghost-boot-glitch::after {
                    content: attr(data-text);
                    position: absolute;
                    left: 0; right: 0;
                    overflow: hidden;
                }
                .ghost-boot-glitch::before {
                    color: #ef4444;
                    animation: ghostGlitch1 3s infinite;
                    clip-path: inset(0 0 80% 0);
                }
                .ghost-boot-glitch::after {
                    color: #3b82f6;
                    animation: ghostGlitch2 3s infinite;
                    clip-path: inset(80% 0 0 0);
                }
                @keyframes ghostGlitch1 {
                    0%, 90%, 100% { transform: translateX(0); }
                    92% { transform: translateX(-3px); }
                    94% { transform: translateX(3px); }
                }
                @keyframes ghostGlitch2 {
                    0%, 88%, 100% { transform: translateX(0); }
                    90% { transform: translateX(2px); }
                    93% { transform: translateX(-2px); }
                }
                .ghost-boot-cursor {
                    display: inline-block;
                    width: 5px;
                    height: 10px;
                    background: rgba(8,145,178,0.5);
                    animation: ghostCursorBlink 0.8s step-end infinite;
                }
                @keyframes ghostCursorBlink {
                    50% { opacity: 0; }
                }
            `}</style>
        </div>
    );
}
