'use client';

import React, { useRef, useEffect } from 'react';

function mulberry32(a: number) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function stringToSeed(str: string): number {
    let hash = 0;
    if (str.length === 0) return 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return hash + 2147483647 + 1; // Ensure positive
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
}

export const GenerativeBackground = ({ seed = '', intensity = 0.5 }: { seed?: string, intensity?: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        let isVisible = true;

        // Pause animation when tab is hidden to save CPU
        const handleVisibility = () => {
            isVisible = !document.hidden;
            if (isVisible) {
                animationFrameId = requestAnimationFrame(render);
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        // Seeded RNG
        const seedNum = stringToSeed(seed || 'matrix'); // Default seed
        const rng = mulberry32(seedNum);

        // Resize
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        // Colors derived from seed
        const hueBase = Math.floor(rng() * 360);
        const accentHue = (hueBase + 180) % 360;

        const initParticles = () => {
            particles = [];
            const count = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 200); // Cap at 200

            for (let i = 0; i < count; i++) {
                particles.push({
                    x: rng() * canvas.width,
                    y: rng() * canvas.height,
                    vx: (rng() - 0.5) * 0.5,
                    vy: (rng() - 0.5) * 0.5,
                    size: rng() * 2 + 0.5,
                    color: rng() > 0.8
                        ? `hsla(${accentHue}, 70%, 60%, ${rng() * 0.3})`
                        : `hsla(${hueBase}, 60%, 50%, ${rng() * 0.15})`
                });
            }
        };

        const render = () => {
            ctx.fillStyle = 'rgba(5, 5, 7, 0.1)'; // Trail effect
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                p.x += p.vx + (Math.sin(Date.now() * 0.001 + p.y * 0.01) * 0.2); // Flow
                p.y += p.vy;

                // Wrap
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            });

            animationFrameId = isVisible ? requestAnimationFrame(render) : 0;
        };

        window.addEventListener('resize', resize);
        resize();
        render();

        return () => {
            window.removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', handleVisibility);
            cancelAnimationFrame(animationFrameId);
        };
    }, [seed]); // Re-init on seed change

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />;
};
