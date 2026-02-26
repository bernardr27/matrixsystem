'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTelemetry } from '@/components/providers/TelemetryProvider';
import { cn } from '@/lib/utils';

class OrbParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    orbitRadius: number;
    angle: number;
    speed: number;

    constructor(w: number, h: number, colors: string[]) {
        this.x = w / 2;
        this.y = h / 2;
        this.angle = Math.random() * Math.PI * 2;
        this.orbitRadius = Math.random() * (w / 2.5);
        this.speed = (Math.random() * 0.02 + 0.005) * (Math.random() < 0.5 ? 1 : -1);
        this.size = Math.random() * 2 + 0.5;
        this.color = colors[Math.floor(Math.random() * colors.length)];

        this.x = (w / 2) + Math.cos(this.angle) * this.orbitRadius;
        this.y = (h / 2) + Math.sin(this.angle) * this.orbitRadius;
        this.vx = 0;
        this.vy = 0;
    }

    update(w: number, h: number, multiplier: number) {
        this.angle += this.speed * multiplier;

        const targetX = (w / 2) + Math.cos(this.angle) * this.orbitRadius;
        const targetY = (h / 2) + Math.sin(this.angle) * this.orbitRadius;

        this.x += (targetX - this.x) * 0.1;
        this.y += (targetY - this.y) * 0.1;

        this.size = Math.max(0.5, this.size + Math.sin(Date.now() * 0.005) * 0.05);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

export function NeuralOrb() {
    const { services, lastPulse, isSyncing } = useTelemetry();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const systemState = useMemo(() => {
        const statuses = Object.values(services);
        const onlineCount = statuses.filter(s => s === 'online').length;
        const anyError = statuses.some(s => s === 'error');

        if (anyError) return 'critical';
        if (onlineCount === statuses.length) return 'stable';
        if (isSyncing || onlineCount > 0) return 'syncing';
        return 'offline';
    }, [services, isSyncing]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: OrbParticle[] = [];
        const particleCount = 60;
        let isVisible = !document.hidden;

        const onVisibility = () => { isVisible = !document.hidden; if (isVisible) render(); };

        // Dynamic properties based on state
        const getColors = () => {
            switch (systemState) {
                case 'stable': return ['#22d3ee', '#0ea5e9', '#ffffff']; // Cyan/Blue
                case 'syncing': return ['#a78bfa', '#8b5cf6', '#ffffff']; // Violet
                case 'critical': return ['#f87171', '#ef4444', '#fee2e2']; // Red
                default: return ['#64748b', '#475569', '#94a3b8']; // Slate
            }
        };

        const getSpeedMultiplier = () => {
            switch (systemState) {
                case 'stable': return 1.5;
                case 'syncing': return 2.5; // Fast chaos during sync
                case 'critical': return 0.2; // Sluggish
                default: return 0.5;
            }
        };

        const resize = () => {
            canvas.width = canvas.parentElement?.clientWidth || 300;
            canvas.height = canvas.parentElement?.clientHeight || 300;
            const colors = getColors();
            particles = Array.from({ length: particleCount }, () => new OrbParticle(canvas.width, canvas.height, colors));
        };

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const multiplier = getSpeedMultiplier();
            const colors = getColors();

            // Draw connections
            ctx.lineWidth = 0.5;
            for (let i = 0; i < particles.length; i++) {
                const p1 = particles[i];
                p1.update(canvas.width, canvas.height, multiplier);
                p1.draw(ctx);

                // Connect nearby particles
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 60) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `${colors[0]}${Math.floor((1 - dist / 60) * 50).toString(16).padStart(2, '0')}`; // Opacity hex hack
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = isVisible ? requestAnimationFrame(render) : 0;
        };

        window.addEventListener('resize', resize);
        document.addEventListener('visibilitychange', onVisibility);
        resize();
        render();

        return () => {
            window.removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', onVisibility);
            cancelAnimationFrame(animationFrameId);
        };
    }, [systemState]); // Re-init when state tier changes

    return (
        <div className="relative flex items-center justify-center w-full h-64 sm:h-80">
            {/* Background Glow */}
            <div className={cn(
                "absolute inset-0 blur-[100px] opacity-20 transition-colors duration-1000",
                systemState === 'stable' ? "bg-cyan-500" :
                    systemState === 'syncing' ? "bg-violet-600" :
                        systemState === 'critical' ? "bg-rose-600" : "bg-slate-800"
            )} />

            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10" />

            {/* Central Core */}
            <motion.div
                animate={{
                    scale: systemState === 'critical' ? [1, 1.1, 1] : [1, 1.05, 1],
                    opacity: [0.8, 1, 0.8]
                }}
                transition={{
                    duration: systemState === 'syncing' ? 0.5 : 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className={cn(
                    "w-20 h-20 rounded-full z-20 backdrop-blur-sm border flex items-center justify-center shadow-[0_0_50px_currentColor] transition-all duration-1000",
                    systemState === 'stable' ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400" :
                        systemState === 'syncing' ? "border-violet-500/50 bg-violet-500/10 text-violet-400" :
                            systemState === 'critical' ? "border-rose-500/50 bg-rose-500/10 text-rose-400" :
                                "border-slate-500/20 bg-slate-900/50 text-slate-500"
                )}
            >
                <div className={cn(
                    "w-8 h-8 rounded-full pointer-events-none",
                    systemState === 'stable' ? "bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]" :
                        systemState === 'syncing' ? "bg-violet-400 shadow-[0_0_20px_rgba(167,139,250,0.8)]" :
                            systemState === 'critical' ? "bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.8)]" :
                                "bg-slate-600"
                )} />
            </motion.div>
        </div>
    );
}
