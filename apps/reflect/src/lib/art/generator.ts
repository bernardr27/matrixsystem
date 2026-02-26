import { ReflectMode } from "../ai/types";

export function generateArt(canvas: HTMLCanvasElement, mode: ReflectMode | string, seedText: string, resonanceColor?: string) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Seed pseudo-random
    let seed = 0;
    for (let i = 0; i < seedText.length; i++) {
        seed = (seed + seedText.charCodeAt(i)) % 1000000;
    }
    const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    // Palettes
    const palettes: Record<string, string[]> = {
        mindset: ['#1e3a8a', '#1e40af', '#60a5fa', '#93c5fd', '#000000'], // Blue/Deep
        career: ['#78350f', '#92400e', '#d97706', '#fcd34d', '#111827'], // Amber/Professional
        money: ['#064e3b', '#065f46', '#10b981', '#6ee7b7', '#000000'], // Green
        relationships: ['#881337', '#9f1239', '#f43f5e', '#fda4af', '#000000'], // Rose
        discipline: ['#334155', '#475569', '#94a3b8', '#cbd5e1', '#0f172a'], // Slate
    };

    const palette = palettes[mode] || palettes.mindset;

    // Clear
    ctx.fillStyle = resonanceColor || palette[4];
    ctx.fillRect(0, 0, width, height);

    // Draw Shapes
    const density = Math.min(50, Math.floor(seedText.length / 5));

    for (let i = 0; i < density; i++) {
        ctx.beginPath();
        const x = random() * width;
        const y = random() * height;
        const size = random() * 100 + 20;

        ctx.fillStyle = palette[Math.floor(random() * 4)];
        ctx.globalAlpha = random() * 0.5 + 0.1;

        if (random() > 0.5) {
            // Circle
            ctx.arc(x, y, size, 0, Math.PI * 2);
        } else {
            // Rect
            ctx.rect(x - size / 2, y - size / 2, size, size);
        }
        ctx.fill();
    }

    // Noise Overlay
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < width * height / 2; i++) {
        if (random() > 0.5) ctx.fillRect(random() * width, random() * height, 1, 1);
    }
}
