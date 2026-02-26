'use client';

import React, { useState, useEffect, useRef } from 'react';

/*  ═══════════════════════════════════════════════════════════
    ROCKETCOMMAND PRO — LAUNCH SEQUENCE BOOT
    Countdown + thrust gauge + flame particle circle
    Accent: orange (#ff6b35)  Background: #050510
    ═══════════════════════════════════════════════════════════ */

const SYSTEMS = [
    'Propulsion',
    'Navigation',
    'Comms',
    'Avionics',
    'Life Support',
    'Payload',
];

export function RocketBootScreen({ onComplete }: { onComplete: () => void }) {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState<'countdown' | 'ignition' | 'exit'>('countdown');
    const [countdown, setCountdown] = useState(3);
    const [systemChecks, setSystemChecks] = useState<boolean[]>(new Array(SYSTEMS.length).fill(false));
    const completed = useRef(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Skip boot with Escape or Space
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if ((e.key === 'Escape' || e.key === ' ') && !completed.current) {
                completed.current = true;
                onComplete();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onComplete]);

    // Countdown
    useEffect(() => {
        const cdInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(cdInterval);
                    setPhase('ignition');
                    return 0;
                }
                return prev - 1;
            });
        }, 600);
        return () => clearInterval(cdInterval);
    }, []);

    // Progress (starts after ignition)
    useEffect(() => {
        if (phase !== 'ignition') return;
        const iv = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) { clearInterval(iv); return 100; }
                return prev + Math.random() * 3.5 + 1.5;
            });
        }, 55);
        return () => clearInterval(iv);
    }, [phase]);

    // System checks
    useEffect(() => {
        SYSTEMS.forEach((_, i) => {
            setTimeout(() => {
                setSystemChecks(prev => {
                    const next = [...prev];
                    next[i] = true;
                    return next;
                });
            }, 300 + i * 280);
        });
    }, []);

    // Exit
    useEffect(() => {
        if (progress >= 100 && !completed.current) {
            completed.current = true;
            setTimeout(() => setPhase('exit'), 400);
            setTimeout(() => onComplete(), 950);
        }
    }, [progress, onComplete]);

    // Particle canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = 300, h = 300;
        canvas.width = w;
        canvas.height = h;

        interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; hue: number; }
        const particles: Particle[] = [];
        let raf: number;

        const spawn = () => {
            if (phase !== 'ignition') return;
            const angle = Math.random() * Math.PI * 2;
            const r = 85 + Math.random() * 5;
            particles.push({
                x: w / 2 + Math.cos(angle) * r,
                y: h / 2 + Math.sin(angle) * r,
                vx: Math.cos(angle) * (1 + Math.random() * 2),
                vy: Math.sin(angle) * (1 + Math.random() * 2),
                life: 0,
                maxLife: 30 + Math.random() * 30,
                size: 1 + Math.random() * 2,
                hue: 15 + Math.random() * 30, // orange-red range
            });
        };

        const draw = () => {
            ctx.clearRect(0, 0, w, h);
            for (let i = 0; i < 3; i++) spawn();

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life++;
                const alpha = 1 - p.life / p.maxLife;
                if (alpha <= 0) { particles.splice(i, 1); continue; }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 90%, 55%, ${alpha * 0.6})`;
                ctx.fill();
            }
            raf = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(raf);
    }, [phase]);

    const pct = Math.min(100, Math.round(progress));
    const thrustHeight = phase === 'ignition' ? pct : 0;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-500 ${phase === 'exit' ? 'opacity-0 translate-y-[-20px]' : 'opacity-100 translate-y-0'}`}
            style={{ background: '#050510' }}
        >
            {/* Main ring + engine effects */}
            <div className="relative w-48 h-48 mb-8 z-10">
                {/* Radial engine glow — centered on ring */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
                    style={{
                        width: 300, height: 300,
                        background: phase === 'ignition'
                            ? `radial-gradient(circle, rgba(255,107,53,${0.04 + pct * 0.001}) 0%, transparent 70%)`
                            : 'radial-gradient(circle, rgba(255,107,53,0.02) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                        transition: 'all 0.3s',
                    }}
                />

                {/* Particle canvas — centered on ring */}
                <canvas ref={canvasRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
                    style={{ width: 300, height: 300, opacity: phase === 'ignition' ? 1 : 0, transition: 'opacity 0.5s' }}
                />

                <svg className="w-full h-full relative z-[1]" viewBox="0 0 200 200">
                    {/* Track */}
                    <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,107,53,0.06)" strokeWidth="3" />

                    {/* Thrust segments — outer */}
                    {Array.from({ length: 48 }).map((_, i) => {
                        const angle = ((i * 7.5 - 90) * Math.PI) / 180;
                        const active = i <= (pct * 48) / 100;
                        const r1 = 80;
                        const r2 = active ? 74 : 76;
                        return (
                            <line
                                key={i}
                                x1={100 + r1 * Math.cos(angle)}
                                y1={100 + r1 * Math.sin(angle)}
                                x2={100 + r2 * Math.cos(angle)}
                                y2={100 + r2 * Math.sin(angle)}
                                stroke={active ? `rgba(255,${107 + i},53,0.8)` : 'rgba(255,107,53,0.08)'}
                                strokeWidth={active ? 2.5 : 1}
                                strokeLinecap="round"
                                className="transition-all duration-150"
                            />
                        );
                    })}

                    {/* Progress arc */}
                    <circle
                        cx="100" cy="100" r="88"
                        fill="none"
                        stroke="url(#rocketGrad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 88}
                        strokeDashoffset={2 * Math.PI * 88 * (1 - pct / 100)}
                        transform="rotate(-90 100 100)"
                        className="transition-all duration-100"
                    />

                    <defs>
                        <linearGradient id="rocketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ff6b35" />
                            <stop offset="50%" stopColor="#f97316" />
                            <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-[2]">
                    {phase === 'countdown' && countdown > 0 ? (
                        <span className="text-5xl font-bold text-orange-400/90 tabular-nums rocket-boot-countPulse">
                            {countdown}
                        </span>
                    ) : (
                        <>
                            <span className="text-3xl font-bold text-orange-400/90 tabular-nums font-mono">
                                {pct}
                            </span>
                            <span className="text-[8px] tracking-[0.4em] text-orange-400/40 uppercase mt-1">
                                THRUST
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold tracking-[0.2em] text-orange-400/90 uppercase mb-1 z-10">
                ROCKETCOMMAND <span className="text-xs text-orange-400/50 font-mono">PRO</span>
            </h1>
            <p className="text-[10px] tracking-[0.4em] text-orange-500/30 uppercase mb-6 z-10">
                {phase === 'countdown' ? 'Pre-Flight Check' : phase === 'ignition' ? 'Ignition Sequence' : 'Launch Complete'}
            </p>

            {/* Thrust gauge bar */}
            <div className="w-40 h-2 bg-white/[0.03] rounded-full overflow-hidden mb-6 z-10">
                <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                        width: `${thrustHeight}%`,
                        background: 'linear-gradient(90deg, #f97316, #ef4444, #ff6b35)',
                        boxShadow: phase === 'ignition' ? '0 0 12px rgba(255,107,53,0.4)' : 'none',
                    }}
                />
            </div>

            {/* System checks */}
            <div className="grid grid-cols-3 gap-x-5 gap-y-1.5 font-mono text-[9px] z-10">
                {SYSTEMS.map((sys, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${systemChecks[i]
                            ? 'bg-orange-400 shadow-[0_0_4px_rgba(255,107,53,0.5)]'
                            : 'bg-orange-900/20'
                            }`} />
                        <span className={`transition-all duration-300 ${systemChecks[i] ? 'text-orange-300/50' : 'text-orange-900/20'}`}>
                            {sys}
                        </span>
                        <span className={`ml-auto transition-all duration-300 ${systemChecks[i] ? 'text-green-400/50' : 'text-orange-900/15'}`}>
                            {systemChecks[i] ? 'GO' : '—'}
                        </span>
                    </div>
                ))}
            </div>

            {/* Skip button */}
            <button
                onClick={() => { if (!completed.current) { completed.current = true; onComplete(); } }}
                className="mt-6 z-10 px-4 py-1.5 rounded-lg text-[10px] font-mono text-white/15 hover:text-white/40 hover:bg-white/[0.04] border border-transparent hover:border-white/[0.08] transition-all tracking-wider uppercase"
            >
                Skip · ESC
            </button>
        </div>
    );
}
