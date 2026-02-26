'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 10 };
const INITIAL_DIRECTION = { x: 1, y: 0 };

export default function Snake() {
    const [snake, setSnake] = useState(INITIAL_SNAKE);
    const [food, setFood] = useState(INITIAL_FOOD);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);

    // Use refs for values needed in the interval to avoid staleness/re-renders
    const directionRef = useRef(INITIAL_DIRECTION);
    const snakeRef = useRef(INITIAL_SNAKE);
    const foodRef = useRef(INITIAL_FOOD);
    const gameOverRef = useRef(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const moveSnake = useCallback(() => {
        if (gameOverRef.current) return;

        const head = snakeRef.current[0];
        const newHead = {
            x: (head.x + directionRef.current.x + GRID_SIZE) % GRID_SIZE,
            y: (head.y + directionRef.current.y + GRID_SIZE) % GRID_SIZE,
        };

        // Collision check
        if (snakeRef.current.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
            setGameOver(true);
            gameOverRef.current = true;
            return;
        }

        const newSnake = [newHead, ...snakeRef.current];

        // Food check
        if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
            setScore(s => s + 10);
            const newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE),
            };
            setFood(newFood);
            foodRef.current = newFood;
        } else {
            newSnake.pop();
        }

        setSnake(newSnake);
        snakeRef.current = newSnake;
    }, []);

    const handleDirectionChange = useCallback((dir: { x: number, y: number }) => {
        if (gameOverRef.current) return;
        if (dir.x !== 0 && directionRef.current.x === 0) directionRef.current = dir;
        if (dir.y !== 0 && directionRef.current.y === 0) directionRef.current = dir;
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            switch (e.key) {
                case 'ArrowUp': handleDirectionChange({ x: 0, y: -1 }); break;
                case 'ArrowDown': handleDirectionChange({ x: 0, y: 1 }); break;
                case 'ArrowLeft': handleDirectionChange({ x: -1, y: 0 }); break;
                case 'ArrowRight': handleDirectionChange({ x: 1, y: 0 }); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        const interval = setInterval(moveSnake, 120);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearInterval(interval);
        };
    }, [moveSnake, handleDirectionChange]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw background
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL_SIZE, 0);
            ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * CELL_SIZE);
            ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
            ctx.stroke();
        }

        // Draw Food
        ctx.fillStyle = '#ff4444';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff4444';
        ctx.beginPath();
        ctx.arc(food.x * CELL_SIZE + CELL_SIZE / 2, food.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw Snake
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#8e2de2';
        snake.forEach((segment, i) => {
            // Simple rectangle segments for maximum compatibility
            const x = segment.x * CELL_SIZE + 2;
            const y = segment.y * CELL_SIZE + 2;
            const w = CELL_SIZE - 4;
            const h = CELL_SIZE - 4;

            // Set fillStyle for each segment to maintain visual distinction
            const opacity = 1 - (i / snake.length * 0.5);
            ctx.fillStyle = i === 0 ? '#b366ff' : `rgba(142, 45, 226, ${opacity})`;
            ctx.fillRect(x, y, w, h);
        });

        ctx.shadowBlur = 0;
    }, [snake, food]);

    const reset = () => {
        setSnake(INITIAL_SNAKE);
        snakeRef.current = INITIAL_SNAKE;
        setFood(INITIAL_FOOD);
        foodRef.current = INITIAL_FOOD;
        directionRef.current = INITIAL_DIRECTION;
        setGameOver(false);
        gameOverRef.current = false;
        setScore(0);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: 300,
                padding: '0 10px',
                fontSize: '0.7rem',
                fontWeight: 900,
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.4)'
            }}>
                <span>SNAKE_NODE: {gameOver ? 'HALTED' : 'ACTIVE'}</span>
                <span>SCORE: {score}</span>
            </div>

            <div style={{ position: 'relative' }}>
                <canvas
                    ref={canvasRef}
                    width={CANVAS_SIZE}
                    height={CANVAS_SIZE}
                    style={{
                        background: 'rgba(0,0,0,0.8)',
                        borderRadius: '20px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        maxWidth: '100%',
                        height: 'auto',
                        aspectRatio: '1 / 1',
                        display: 'block',
                        margin: '1rem 0'
                    }}
                />

                {gameOver && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '20px',
                        color: '#fff',
                        gap: '1rem'
                    }}>
                        <span style={{ fontSize: '0.8rem', letterSpacing: '0.5em', opacity: 0.5 }}>NEURAL_HALT</span>
                        <button
                            onClick={reset}
                            style={{
                                background: '#fff',
                                color: '#000',
                                border: 'none',
                                padding: '0.8rem 1.5rem',
                                borderRadius: '50px',
                                fontWeight: 800,
                                cursor: 'pointer'
                            }}
                        >
                            REBOOT
                        </button>
                    </div>
                )}
            </div>
            {/* Mobile Touch Controls */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                marginTop: '1rem',
                userSelect: 'none',
                pointerEvents: 'auto'
            }}>
                <div />
                <TouchBtn icon="↑" onClick={() => handleDirectionChange({ x: 0, y: -1 })} />
                <div />
                <TouchBtn icon="←" onClick={() => handleDirectionChange({ x: -1, y: 0 })} />
                <TouchBtn icon="↓" onClick={() => handleDirectionChange({ x: 0, y: 1 })} />
                <TouchBtn icon="→" onClick={() => handleDirectionChange({ x: 1, y: 0 })} />
            </div>

            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: '1rem' }}>
                USE ARROW KEYS TO NAVIGATE COGNITIVE PATHWAYS<br />
                SPACE TO PAUSE_SYNC
            </div>
        </div>
    );
}

function TouchBtn({ icon, onClick }: { icon: string, onClick: () => void }) {
    return (
        <button
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            onTouchStart={(e) => { e.preventDefault(); onClick(); }}
            style={{
                width: '60px',
                height: '60px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '15px',
                color: '#fff',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                pointerEvents: 'auto'
            }}
        >
            {icon}
        </button>
    );
}
