
"use client";

import React, { useRef, useEffect } from 'react';

class WeaveParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;

    constructor(width: number, height: number, baseSpeed: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * baseSpeed;
        this.vy = (Math.random() - 0.5) * baseSpeed;
        this.size = Math.random() * 2 + 1;
    }

    update(width: number, height: number, mouse: { x: number; y: number }, cursorInfluence: number) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0 && distance < cursorInfluence) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (cursorInfluence - distance) / cursorInfluence;

            this.vx -= forceDirectionX * force * 0.05;
            this.vy -= forceDirectionY * force * 0.05;
        }
    }

    draw(ctx: CanvasRenderingContext2D, nodeColor: string) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();
    }
}

// Configuration for the Neural Constellation
const CONFIG = {
    particleCount: 60,
    connectionDistance: 120,
    baseSpeed: 0.2,
    cursorInfluence: 150,
    colors: {
        node: 'rgba(0, 255, 255, 0.5)',   // Cyan
        link: 'rgba(0, 200, 200, 0.15)',  // Faint Cyan
        pulse: 'rgba(255, 255, 255, 0.8)' // White pulse
    }
};

export const NeuralWeaving = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: WeaveParticle[] = [];

        // Dynamic Configuration
        let activeConfig = { ...CONFIG };

        // Set Dimensions & Adjust Config
        const resize = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;

            // Mobile Optimization
            const isMobile = window.innerWidth < 768;
            activeConfig.particleCount = isMobile ? 25 : 60;
            activeConfig.connectionDistance = isMobile ? 60 : 120;

            initParticles();
        };

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < activeConfig.particleCount; i++) {
                particles.push(new WeaveParticle(canvas.width, canvas.height, CONFIG.baseSpeed));
            }
        };

        const animate = () => {
            if (!ctx) return;
            if (document.hidden) {
                animationFrameId = requestAnimationFrame(animate);
                return;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p, index) => {
                p.update(canvas.width, canvas.height, mouseRef.current, CONFIG.cursorInfluence);
                p.draw(ctx, CONFIG.colors.node);

                // Draw Connections
                for (let j = index + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < activeConfig.connectionDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = CONFIG.colors.link;
                        ctx.lineWidth = 1 - distance / activeConfig.connectionDistance;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        // Listeners
        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        window.addEventListener('resize', resize);
        container.addEventListener('mousemove', handleMouseMove);

        resize();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            container.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 -z-10 pointer-events-none opacity-40">
            <canvas ref={canvasRef} />
        </div>
    );
};
