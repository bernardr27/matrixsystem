'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Globe, Zap, Activity, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HiveInstance {
    id: string;
    instance_name: string;
    cpu_load: number;
    ram_percent: number;
    metadata: {
        health_score?: number;
        region?: string;
    };
}

interface HiveLink {
    id: string;
    poster_node: string;
    worker_node: string;
    status: string;
}

export function OmnipresencePortal() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hive, setHive] = useState<{ instances: HiveInstance[], active_links: HiveLink[] } | null>(null);
    const [resonance, setResonance] = useState(0.85);

    useEffect(() => {
        const fetchSingularity = async () => {
            try {
                const res = await fetch('/api/singularity');
                if (res.ok) {
                    const json = await res.json();
                    setHive(json.hive);
                }
            } catch { /* ignore */ }
        };

        fetchSingularity();
        const timer = setInterval(fetchSingularity, 10000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!canvasRef.current || !hive) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        const nodes: { x: number, y: number, id: string, name: string, health: number }[] = [];

        // Map instances to fixed positions (simplified for 2D portal)
        hive.instances.forEach((inst, i) => {
            const angle = (i / hive.instances.length) * Math.PI * 2;
            const radius = 100 + Math.sin(Date.now() / 2000 + i) * 10;
            nodes.push({
                id: inst.id,
                name: inst.instance_name,
                x: canvas.width / 2 + Math.cos(angle) * radius,
                y: canvas.height / 2 + Math.sin(angle) * radius,
                health: inst.metadata.health_score || 0.8
            });
        });

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const time = Date.now() / 1000;

            // Draw Links (Active Tasks)
            hive.active_links.forEach(link => {
                const start = nodes.find(n => n.id === link.poster_node);
                const end = nodes.find(n => n.id === link.worker_node);
                if (start && end) {
                    ctx.beginPath();
                    ctx.moveTo(start.x, start.y);
                    ctx.lineTo(end.x, end.y);
                    ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 + Math.sin(time * 5) * 0.05})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // Travel point
                    const progress = (time % 1);
                    const tx = start.x + (end.x - start.x) * progress;
                    const ty = start.y + (end.y - start.y) * progress;
                    ctx.fillStyle = '#8b5cf6';
                    ctx.beginPath();
                    ctx.arc(tx, ty, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Draw Nodes
            nodes.forEach(node => {
                const pulse = Math.sin(time * 2 + node.x) * 0.2 + 0.8;

                // Outer Glow
                const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 15 * pulse);
                grad.addColorStop(0, `rgba(255, 255, 255, ${0.2 * node.health})`);
                grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(node.x, node.y, 15 * pulse, 0, Math.PI * 2);
                ctx.fill();

                // Core
                ctx.fillStyle = node.health > 0.7 ? '#fff' : '#f87171';
                ctx.beginPath();
                ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [hive]);

    return (
        <div className="relative w-full h-[300px] rounded-2xl overflow-hidden bg-black/40 border border-white/5 backdrop-blur-xl group">
            {/* Background Resonance Pulsar */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-violet-500/10 to-transparent animate-pulse" />
            </div>

            <canvas
                ref={canvasRef}
                width={800}
                height={300}
                className="w-full h-full"
            />

            {/* Singularity UI Overlay */}
            <div className="absolute top-6 left-6 flex flex-col gap-1 pointer-events-none">
                <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-violet-400 animate-spin-slow" />
                    <span className="text-[12px] font-display font-bold text-white tracking-widest uppercase">Emergent Singularity</span>
                </div>
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-tighter">Unified Hive Intelligence Engine Active</span>
            </div>

            <div className="absolute top-6 right-6 flex gap-4 pointer-events-none">
                <div className="flex flex-col items-end">
                    <span className="text-[8px] font-mono text-white/20 uppercase">Global Resonance</span>
                    <span className="text-[14px] font-display font-bold text-violet-400">{(resonance * 100).toFixed(2)}%</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[8px] font-mono text-white/20 uppercase">Sync Level</span>
                    <span className="text-[14px] font-display font-bold text-white">OMEGA</span>
                </div>
            </div>

            {/* Service Status Tags */}
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                        <Activity className="w-3 h-3 text-emerald-400" />
                        <span className="text-[9px] font-mono text-white/60 uppercase">Self-Healing: ON</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                        <Shield className="w-3 h-3 text-violet-400" />
                        <span className="text-[9px] font-mono text-white/60 uppercase">Consensus: UNIVERSAL</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400/20" />
                    <span className="text-[9px] font-mono text-white/40 uppercase">Total Hive Synthesis Imminent</span>
                </div>
            </div>
        </div>
    );
}
