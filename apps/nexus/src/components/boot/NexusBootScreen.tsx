'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

/*  ═══════════════════════════════════════════════════════════
    NEXUS — DIAGNOSTIC HUD BOOT
    Hexagonal grid + circuit-trace progress + diagnostic readout
    Accent: emerald (#10b981)  Background: #050505
    ═══════════════════════════════════════════════════════════ */

const DIAGNOSTICS = [
    { label: 'CORE', status: 'NOMINAL' },
    { label: 'TELEMETRY', status: 'LINKED' },
    { label: 'SOUL ENGINE', status: 'ACTIVE' },
    { label: 'NEURAL PULSE', status: 'SYNCED' },
    { label: 'WATCHDOG', status: 'RUNNING' },
    { label: 'SENTINEL', status: 'ONLINE' },
];

export function NexusBootScreen({ onComplete }: { onComplete: () => void }) {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState<'boot' | 'exit'>('boot');
    const [activeDiags, setActiveDiags] = useState<number[]>([]);
    const completed = useRef(false);

    useEffect(() => {
        const iv = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) { clearInterval(iv); return 100; }
                return prev + Math.random() * 2.5 + 1;
            });
        }, 55);

        DIAGNOSTICS.forEach((_, i) => {
            setTimeout(() => {
                setActiveDiags(prev => [...prev, i]);
            }, 400 + i * 350);
        });

        return () => clearInterval(iv);
    }, []);

    useEffect(() => {
        if (progress >= 100 && !completed.current) {
            completed.current = true;
            setTimeout(() => setPhase('exit'), 400);
            setTimeout(() => onComplete(), 950);
        }
    }, [progress, onComplete]);

    const pct = Math.min(100, Math.round(progress));

    // Hex grid points — seeded deterministically based on index so they don't flicker
    const hexPoints = useMemo(() => Array.from({ length: 37 }).map((_, i) => {
        const col = i % 7;
        const row = Math.floor(i / 7);
        const offset = row % 2 === 0 ? 0 : 15;
        // Deterministic fill: activate cells based on index threshold relative to progress
        const threshold = (i / 37) * 100;
        return { x: col * 30 + offset, y: row * 26, active: threshold < pct };
    }), [pct]);

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-500 ${phase === 'exit' ? 'opacity-0 scale-[1.03]' : 'opacity-100 scale-100'}`}
            style={{ background: '#050505' }}
        >
            {/* Ambient emerald glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                }}
            />

            {/* Hexagonal grid background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                <svg width="220" height="160" viewBox="0 0 220 160">
                    {hexPoints.map((pt, i) => (
                        <g key={i} transform={`translate(${pt.x + 10}, ${pt.y + 10})`}>
                            <polygon
                                points="12,0 24,7 24,19 12,26 0,19 0,7"
                                fill={pt.active ? 'rgba(16,185,129,0.08)' : 'none'}
                                stroke={pt.active ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.04)'}
                                strokeWidth={0.5}
                                className="transition-all duration-500"
                            />
                        </g>
                    ))}
                </svg>
            </div>

            {/* Main progress display */}
            <div className="relative w-56 h-56 mb-8">
                <svg className="w-full h-full" viewBox="0 0 224 224">
                    {/* Outer decorative ring */}
                    <circle cx="112" cy="112" r="108" fill="none" stroke="rgba(16,185,129,0.04)" strokeWidth="1" />

                    {/* Circuit trace ring — segmented progress */}
                    {Array.from({ length: 72 }).map((_, i) => {
                        const angle = ((i * 5 - 90) * Math.PI) / 180;
                        const r = 95;
                        const active = i <= (pct * 72) / 100;
                        const isNode = i % 9 === 0;
                        return (
                            <g key={i}>
                                {isNode ? (
                                    <>
                                        <circle
                                            cx={112 + r * Math.cos(angle)}
                                            cy={112 + r * Math.sin(angle)}
                                            r={active ? 4 : 2}
                                            fill={active ? 'rgba(16,185,129,0.7)' : 'rgba(16,185,129,0.08)'}
                                            className="transition-all duration-200"
                                        />
                                        {active && (
                                            <circle
                                                cx={112 + r * Math.cos(angle)}
                                                cy={112 + r * Math.sin(angle)}
                                                r={7}
                                                fill="none"
                                                stroke="rgba(16,185,129,0.15)"
                                                strokeWidth={0.5}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <rect
                                        x={112 + r * Math.cos(angle) - (active ? 2 : 1)}
                                        y={112 + r * Math.sin(angle) - 0.5}
                                        width={active ? 4 : 2}
                                        height={1}
                                        fill={active ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.06)'}
                                        transform={`rotate(${i * 5}, ${112 + r * Math.cos(angle)}, ${112 + r * Math.sin(angle)})`}
                                        className="transition-all duration-200"
                                    />
                                )}
                            </g>
                        );
                    })}

                    {/* Inner ring — solid progress arc */}
                    <circle
                        cx="112" cy="112" r="75"
                        fill="none"
                        stroke="rgba(16,185,129,0.06)"
                        strokeWidth="2"
                    />
                    <circle
                        cx="112" cy="112" r="75"
                        fill="none"
                        stroke="url(#nexusGrad)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 75}
                        strokeDashoffset={2 * Math.PI * 75 * (1 - pct / 100)}
                        transform="rotate(-90 112 112)"
                        className="transition-all duration-100"
                    />

                    {/* Scanner sweep */}
                    <line
                        x1="112" y1="112"
                        x2={112 + 70 * Math.cos(((pct * 3.6 - 90) * Math.PI) / 180)}
                        y2={112 + 70 * Math.sin(((pct * 3.6 - 90) * Math.PI) / 180)}
                        stroke="rgba(16,185,129,0.12)"
                        strokeWidth="1"
                    />

                    <defs>
                        <linearGradient id="nexusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Center readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-mono font-semibold text-emerald-400/90 tabular-nums">
                        {pct}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${pct >= 100 ? 'bg-emerald-400' : 'bg-emerald-500/50 nexus-boot-blink'}`} />
                        <span className="text-[9px] tracking-[0.25em] text-emerald-400/40 uppercase font-mono">
                            {pct >= 100 ? 'READY' : 'BOOTING'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Title */}
            <h1 className="text-xl font-semibold tracking-[0.25em] text-emerald-300/80 uppercase mb-2">
                NEXUS
            </h1>
            <p className="text-[10px] tracking-[0.4em] text-emerald-500/30 uppercase mb-8">
                Command Center Pro
            </p>

            {/* Diagnostic readout grid */}
            <div className="grid grid-cols-3 gap-x-6 gap-y-2 font-mono text-[9px]">
                {DIAGNOSTICS.map((diag, i) => {
                    const active = activeDiags.includes(i);
                    return (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`w-1 h-1 rounded-full transition-all duration-300 ${active ? 'bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.5)]' : 'bg-emerald-900/30'}`} />
                            <span className="text-emerald-600/30 w-16">{diag.label}</span>
                            <span className={`transition-all duration-300 ${active ? 'text-emerald-400/60' : 'text-emerald-900/20'}`}>
                                {active ? diag.status : '---'}
                            </span>
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                .nexus-boot-blink {
                    animation: nexusBlink 1s step-end infinite;
                }
                @keyframes nexusBlink {
                    50% { opacity: 0.2; }
                }
            `}</style>
        </div>
    );
}
