'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NeuralButton } from '../ui/NeuralButton';
import { updateCognitionPoints } from '@/app/actions';

export default function ZenSnake({ onExit }: { onExit: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    // Game state refs to avoid closure staleness
    const snake = useRef([{ x: 10, y: 10 }]);
    const dir = useRef({ x: 0, y: 0 });
    const food = useRef({ x: 15, y: 15 });
    const gameLoop = useRef<any>(null);
    const touchStart = useRef({ x: 0, y: 0 });
    const startGameRef = useRef<() => void>(() => { });

    useEffect(() => {
        window.addEventListener('keydown', handleKey);
        startGameRef.current();
        return () => {
            window.removeEventListener('keydown', handleKey);
            clearInterval(gameLoop.current);
        };
    }, []);

    const startGame = () => {
        snake.current = [{ x: 10, y: 10 }];
        dir.current = { x: 1, y: 0 };
        food.current = { x: 5, y: 5 };
        setScore(0);
        setGameOver(false);
        if (gameLoop.current) clearInterval(gameLoop.current);
        gameLoop.current = setInterval(update, 100);
    };
    startGameRef.current = startGame;

    const handleKey = (e: KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowUp': if (dir.current.y !== 1) dir.current = { x: 0, y: -1 }; break;
            case 'ArrowDown': if (dir.current.y !== -1) dir.current = { x: 0, y: 1 }; break;
            case 'ArrowLeft': if (dir.current.x !== 1) dir.current = { x: -1, y: 0 }; break;
            case 'ArrowRight': if (dir.current.x !== -1) dir.current = { x: 1, y: 0 }; break;
        }
    };

    const update = () => {
        const head = { ...snake.current[0] };
        head.x += dir.current.x;
        head.y += dir.current.y;

        // Wrap around
        if (head.x < 0) head.x = 19;
        if (head.x > 19) head.x = 0;
        if (head.y < 0) head.y = 19;
        if (head.y > 19) head.y = 0;

        // Self collision check
        if (snake.current.some(s => s.x === head.x && s.y === head.y)) {
            setGameOver(true);
            clearInterval(gameLoop.current);
            if (score > 0) updateCognitionPoints(Math.floor(score / 2)).catch(() => { });
            return;
        }

        snake.current.unshift(head);

        // Eat food
        if (head.x === food.current.x && head.y === food.current.y) {
            setScore(s => s + 1);
            food.current = {
                x: Math.floor(Math.random() * 20),
                y: Math.floor(Math.random() * 20)
            };
        } else {
            snake.current.pop();
        }

        draw();
    };

    const draw = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, 400, 400);

        // Snake
        ctx.fillStyle = '#4a9eff';
        snake.current.forEach(s => {
            ctx.fillRect(s.x * 20, s.y * 20, 18, 18);
        });

        // Food
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(food.current.x * 20 + 10, food.current.y * 20 + 10, 8, 0, Math.PI * 2);
        ctx.fill();
    };

    return (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: '#fff',
            padding: '1rem',
            touchAction: 'none'
        }}
            onTouchStart={(e) => {
                touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }}
            onTouchEnd={(e) => {
                const dx = e.changedTouches[0].clientX - touchStart.current.x;
                const dy = e.changedTouches[0].clientY - touchStart.current.y;
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Horizontal
                    if (Math.abs(dx) > 30) {
                        if (dx > 0 && dir.current.x !== -1) dir.current = { x: 1, y: 0 };
                        else if (dx < 0 && dir.current.x !== 1) dir.current = { x: -1, y: 0 };
                    }
                } else {
                    // Vertical
                    if (Math.abs(dy) > 30) {
                        if (dy > 0 && dir.current.y !== -1) dir.current = { x: 0, y: 1 };
                        else if (dy < 0 && dir.current.y !== 1) dir.current = { x: 0, y: -1 };
                    }
                }
            }}
        >
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '400px', fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.1em' }}>
                <span>SCORE: {score}</span>
                <button onClick={onExit} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.3, cursor: 'pointer', fontSize: '0.7rem' }}>[ DISCONNECT ]</button>
            </div>

            <div style={{ position: 'relative', width: 'min(400px, 80vw)', height: 'min(400px, 80vw)' }}>
                {gameOver && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ fontSize: '1.2rem', letterSpacing: '0.3em', margin: 0 }}>FLOW BROKEN</h3>
                        <p style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '2rem' }}>SIGNAL COLLAPSED AT {score} PTS</p>
                        <NeuralButton onClick={startGame}>RESTART_MODULE</NeuralButton>
                    </div>
                )}

                <canvas
                    ref={canvasRef}
                    width={400}
                    height={400}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '24px',
                        background: '#050508'
                    }}
                />
            </div>

            {/* Mobile Touch Controls */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginTop: '1.5rem',
                userSelect: 'none'
            }}>
                <div />
                <TouchBtn icon="↑" onClick={() => { if (dir.current.y !== 1) dir.current = { x: 0, y: -1 }; }} />
                <div />
                <TouchBtn icon="←" onClick={() => { if (dir.current.x !== 1) dir.current = { x: -1, y: 0 }; }} />
                <TouchBtn icon="↓" onClick={() => { if (dir.current.y !== -1) dir.current = { x: 0, y: 1 }; }} />
                <TouchBtn icon="→" onClick={() => { if (dir.current.x !== -1) dir.current = { x: 1, y: 0 }; }} />
            </div>

            <div style={{ marginTop: '1rem', fontSize: '0.6rem', opacity: 0.3, letterSpacing: '0.1em' }}>CONTROL_VECTORS: ARROWS // D-PAD</div>
        </div>
    );
}

function TouchBtn({ icon, onClick }: { icon: string, onClick: () => void }) {
    return (
        <button
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            onTouchStart={(e) => { e.preventDefault(); onClick(); }}
            style={{
                width: 'min(64px, 18vw)',
                height: 'min(64px, 18vw)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                color: '#fff',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                touchAction: 'none'
            }}
        >
            {icon}
        </button>
    );
}
