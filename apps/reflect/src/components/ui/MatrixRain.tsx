'use client';

import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
    color?: string;
    opacity?: number;
    speed?: number;
}

export default function MatrixRain({
    color = '#4a9eff',
    opacity = 0.05,
    speed = 1
}: MatrixRainProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let drops: number[] = [];
        let isVisible = true;

        // Pause animation when tab is hidden to save CPU
        const handleVisibility = () => {
            isVisible = !document.hidden;
            if (isVisible) {
                animationFrameId = requestAnimationFrame(draw);
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const fontSize = 14;
            const columns = Math.ceil(canvas.width / fontSize);

            // Reset drops if resizing
            drops = new Array(columns).fill(0).map(() => Math.random() * -100);
        };

        resize();
        window.addEventListener('resize', resize);

        const chars = '0123456789ABCDEF';

        const draw = () => {
            // Semi-transparent black to create trail effect
            ctx.fillStyle = `rgba(0, 0, 0, ${0.05 * speed})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = color;
            ctx.font = '14px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];

                // Draw the character
                ctx.globalAlpha = opacity;
                ctx.fillText(text, i * 14, drops[i] * 14);

                // Reset drop to top randomly
                if (drops[i] * 14 > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }

                // Move drop
                drops[i] += 0.5 * speed;
            }

            animationFrameId = isVisible ? requestAnimationFrame(draw) : 0;
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', handleVisibility);
            cancelAnimationFrame(animationFrameId);
        };
    }, [color, opacity, speed]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0
            }}
        />
    );
}
