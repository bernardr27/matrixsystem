'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NeuralSurface } from '../ui/NeuralSurface';

export const NeuralResonanceBox = ({ mood = 'neutral' }: { mood?: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const colors: Record<string, string> = {
        neutral: '#3b82f6',
        silver: '#94a3b8',
        indigo: '#6366f1',
        emerald: '#10b981',
        amber: '#f59e0b',
        rose: '#ec4899'
    };

    const activeColor = colors[mood] || colors.neutral;

    const particlesRef = useRef<any[]>([]);
    const hoverRef = useRef(false);
    const colorRef = useRef(activeColor);

    useEffect(() => {
        hoverRef.current = isHovered;
        colorRef.current = activeColor;
    }, [isHovered, activeColor]);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrame: number;
        const particleCount = 40;

        const initParticles = () => {
            if (canvas.width === 0 || canvas.height === 0) return;
            const newParticles = [];
            for (let i = 0; i < particleCount; i++) {
                newParticles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 2 + 1
                });
            }
            particlesRef.current = newParticles;
        };

        const draw = () => {
            if (!ctx || canvas.width === 0) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = colorRef.current;
            ctx.fillStyle = colorRef.current;

            const speedMult = hoverRef.current ? 2.5 : 1;

            particlesRef.current.forEach((p, i) => {
                p.x += p.vx * speedMult;
                p.y += p.vy * speedMult;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                for (let j = i + 1; j < particlesRef.current.length; j++) {
                    const p2 = particlesRef.current[j];
                    const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (dist < 50) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.globalAlpha = 0.4 * (1 - (dist / 50));
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                }
            });

            animationFrame = requestAnimationFrame(draw);
        };

        if (particlesRef.current.length === 0) {
            initParticles();
        }

        draw();
        return () => cancelAnimationFrame(animationFrame);
    }, []); // Run once on mount

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                width: '100%',
                maxWidth: '600px',
                margin: '2rem 0', // Restored spacing
                position: 'relative',
                zIndex: 10
            }}
        >
            <NeuralSurface
                variant="glass"
                style={{
                    padding: '1.5rem',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    background: isHovered ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                    borderColor: isHovered ? activeColor + '33' : 'rgba(255,255,255,0.05)',
                    transition: 'all 0.5s ease'
                }}
            >
                <canvas
                    ref={canvasRef}
                    width={150}
                    height={80}
                    style={{
                        width: '150px',
                        height: '80px',
                        borderRadius: '12px',
                        background: 'rgba(0,0,0,0.2)'
                    }}
                />
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        letterSpacing: '0.2em',
                        color: activeColor,
                        marginBottom: '4px',
                        opacity: isHovered ? 1 : 0.6,
                        transition: 'opacity 0.3s ease'
                    }}>RESONANCE_FIELD</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 200, color: '#fff', letterSpacing: '-0.01em' }}>
                        Synchronicity detected at <span style={{ fontWeight: 600 }}>98.2%</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '4px' }}>
                        Engage for neural stimulation and synchronicity.
                    </div>
                </div>
            </NeuralSurface>
        </motion.div>
    );
};
