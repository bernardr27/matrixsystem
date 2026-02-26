'use client';

import React, { useState, useEffect, useRef } from 'react';

/*  ═══════════════════════════════════════════════════════════
    REFLECT OS — NEURAL BOOT SEQUENCE
    Orbital breathing ring with DNA-strand progress
    Accent: indigo/violet (#6366f1)  Background: #050507
    ═══════════════════════════════════════════════════════════ */

export function ReflectBootScreen({ onComplete }: { onComplete: () => void }) {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState<'boot' | 'exit'>('boot');
    const [statusText, setStatusText] = useState('Initializing neural substrate...');
    const completed = useRef(false);

    const statuses = [
        'Initializing neural substrate...',
        'Mapping cognitive pathways...',
        'Calibrating reflection engine...',
        'Loading memory fragments...',
        'Syncing consciousness layer...',
        'Establishing session bridge...',
        'Activating Reflect OS...',
    ];

    useEffect(() => {
        const iv = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) { clearInterval(iv); return 100; }
                return prev + Math.random() * 3 + 0.8;
            });
        }, 50);

        statuses.forEach((text, i) => {
            setTimeout(() => setStatusText(text), i * 380 + 200);
        });

        return () => clearInterval(iv);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (progress >= 100 && !completed.current) {
            completed.current = true;
            setTimeout(() => setPhase('exit'), 350);
            setTimeout(() => onComplete(), 850);
        }
    }, [progress, onComplete]);

    const pct = Math.min(100, Math.round(progress));

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-500 ${phase === 'exit' ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}
            style={{ background: '#050507' }}
        >
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
            />

            {/* Orbital ring system */}
            <div className="relative w-52 h-52 mb-10">
                {/* Outer breathing ring */}
                <div className="absolute inset-0 rounded-full reflect-boot-breathe"
                    style={{ border: '1px solid rgba(99,102,241,0.08)' }}
                />

                {/* Orbiting dots */}
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="absolute inset-0 reflect-boot-orbit"
                        style={{ animationDelay: `${i * -0.7}s`, animationDuration: `${3.5 + i * 0.3}s` }}
                    >
                        <div
                            className="absolute rounded-full"
                            style={{
                                width: 5 - i * 0.4 + 'px',
                                height: 5 - i * 0.4 + 'px',
                                top: 0,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: `rgba(${99 + i * 10}, ${102 + i * 8}, 241, ${0.8 - i * 0.1})`,
                                boxShadow: `0 0 ${8 + i * 2}px rgba(99,102,241,${0.3 - i * 0.04})`,
                            }}
                        />
                    </div>
                ))}

                {/* SVG DNA progress ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                    {/* DNA helix track */}
                    {Array.from({ length: 40 }).map((_, i) => {
                        const angle = (i * 9 * Math.PI) / 180;
                        const r = 80;
                        const wobble = Math.sin(i * 0.5) * 4;
                        const cx = 100 + (r + wobble) * Math.cos(angle);
                        const cy = 100 + (r + wobble) * Math.sin(angle);
                        const active = i <= (pct * 40) / 100;
                        return (
                            <circle
                                key={i}
                                cx={cx}
                                cy={cy}
                                r={active ? 2.5 : 1.5}
                                fill={active ? 'rgba(99,102,241,0.7)' : 'rgba(99,102,241,0.1)'}
                                className="transition-all duration-200"
                            />
                        );
                    })}
                    {/* Mirror helix */}
                    {Array.from({ length: 40 }).map((_, i) => {
                        const angle = (i * 9 * Math.PI) / 180;
                        const r = 80;
                        const wobble = Math.sin(i * 0.5 + Math.PI) * 4;
                        const cx = 100 + (r + wobble) * Math.cos(angle);
                        const cy = 100 + (r + wobble) * Math.sin(angle);
                        const active = i <= (pct * 40) / 100;
                        return (
                            <circle
                                key={`m${i}`}
                                cx={cx}
                                cy={cy}
                                r={active ? 2 : 1}
                                fill={active ? 'rgba(139,92,246,0.5)' : 'rgba(139,92,246,0.06)'}
                                className="transition-all duration-200"
                            />
                        );
                    })}
                    {/* Connecting bars */}
                    {Array.from({ length: 20 }).map((_, i) => {
                        const angle = (i * 18 * Math.PI) / 180;
                        const w1 = Math.sin(i * 0.5) * 4;
                        const w2 = Math.sin(i * 0.5 + Math.PI) * 4;
                        const active = i <= (pct * 20) / 100;
                        return (
                            <line
                                key={`b${i}`}
                                x1={100 + (80 + w1) * Math.cos(angle)}
                                y1={100 + (80 + w1) * Math.sin(angle)}
                                x2={100 + (80 + w2) * Math.cos(angle)}
                                y2={100 + (80 + w2) * Math.sin(angle)}
                                stroke={active ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.04)'}
                                strokeWidth={0.5}
                            />
                        );
                    })}
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="reflect-boot-core" />
                    <span className="text-3xl font-extralight text-indigo-300/90 tabular-nums tracking-wide z-10">
                        {pct}
                    </span>
                    <span className="text-[8px] tracking-[0.5em] text-indigo-400/30 uppercase mt-1.5 z-10">
                        loading
                    </span>
                </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
                <h1 className="text-lg font-extralight tracking-[0.35em] text-white/80 uppercase">
                    Reflect
                </h1>
                <div className="w-12 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent mx-auto mt-3 mb-3" />
                <p className="text-[10px] tracking-[0.3em] text-indigo-300/25 uppercase">
                    Operating System
                </p>
            </div>

            {/* Status text */}
            <p className="text-[10px] tracking-[0.15em] text-indigo-300/30 reflect-boot-statusPulse">
                {statusText}
            </p>

            {/* Bottom progress bar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-white/[0.03] rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, rgba(99,102,241,0.4), rgba(139,92,246,0.6))',
                    }}
                />
            </div>

            <style jsx>{`
                .reflect-boot-breathe {
                    animation: reflectBreathe 3s ease-in-out infinite;
                }
                @keyframes reflectBreathe {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.06); opacity: 0.7; }
                }
                .reflect-boot-orbit {
                    animation: reflectOrbit 3.5s linear infinite;
                }
                @keyframes reflectOrbit {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .reflect-boot-core {
                    position: absolute;
                    width: 60px; height: 60px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%);
                    animation: reflectCorePulse 2s ease-in-out infinite;
                }
                @keyframes reflectCorePulse {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.3); opacity: 1; }
                }
                .reflect-boot-statusPulse {
                    animation: reflectStatusPulse 2s ease-in-out infinite;
                }
                @keyframes reflectStatusPulse {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
}
