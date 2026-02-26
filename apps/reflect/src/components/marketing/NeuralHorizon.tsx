'use client';

import React, { useEffect, useRef } from 'react';

class HorizonParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;

    constructor(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.size = Math.random() * 1.2 + 0.5;
    }

    update(width: number, height: number) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
    }

    draw(ctx: CanvasRenderingContext2D, baseColor: string) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `${baseColor}, 0.12)`;
        ctx.fill();
    }
}

const MOOD_COLORS: Record<string, string> = {
    neutral: 'rgba(200, 200, 220',
    focus: 'rgba(16, 185, 129',
    logic: 'rgba(59, 130, 246',
    creative: 'rgba(245, 158, 11',
    reflection: 'rgba(236, 72, 153',
    rest: 'rgba(99, 102, 241', // Indigo for rest
    chaos: 'rgba(220, 38, 38'   // Red for chaos
};

export default function NeuralHorizon({ mood = 'neutral' }: { mood?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const particles: HorizonParticle[] = [];
        const particleCount = 30; // Reduced for performance
        const maxDistance = 180;
        let mouseX = 0;
        let mouseY = 0;
        let rafId: number;
        let lastMove = 0;

        for (let i = 0; i < particleCount; i++) particles.push(new HorizonParticle(width, height));

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        const handleMouseMove = (e: MouseEvent) => {
            const now = Date.now();
            if (now - lastMove < 16) return; // Throttle to ~60fps
            mouseX = e.clientX;
            mouseY = e.clientY;
            lastMove = now;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        const animate = (time: number) => {
            ctx.clearRect(0, 0, width, height);

            const currentBase = MOOD_COLORS[mood] || MOOD_COLORS.neutral;

            // Optimized Gradient logic
            const breath = Math.sin(time * 0.0006) * 0.5 + 0.5;
            const auraGradient = ctx.createRadialGradient(width * 0.85, height * 0.5, 0, width * 0.85, height * 0.5, width * 0.5);
            auraGradient.addColorStop(0, `${currentBase}, ${0.06 * breath})`);
            auraGradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = auraGradient;
            ctx.fillRect(0, 0, width, height);

            particles.forEach((p, i) => {
                p.update(width, height);
                p.draw(ctx, currentBase);

                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distSq = dx * dx + dy * dy; // Use squared distance for performance

                    if (distSq < maxDistance * maxDistance) {
                        const dist = Math.sqrt(distSq);
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        const alpha = (1 - dist / maxDistance) * 0.015;
                        ctx.strokeStyle = `${currentBase}, ${alpha})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            });

            rafId = requestAnimationFrame(animate);
        };

        rafId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [mood]);


    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
                background: '#040404',
                willChange: 'transform'
            }}
        />
    );
}
