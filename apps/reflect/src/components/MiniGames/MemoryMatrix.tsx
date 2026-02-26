'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { updateCognitionPoints } from '@/app/actions';

export default function MemoryMatrix({ onExit }: { onExit: () => void }) {
    const [grid, setGrid] = useState<boolean[]>(Array(16).fill(false));
    const [pattern, setPattern] = useState<boolean[]>(Array(16).fill(false));
    const [showingPattern, setShowingPattern] = useState(false);
    const [level, setLevel] = useState(1);
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
        startLevel(1);
    }, []);

    const startLevel = (lvl: number) => {
        const newPattern = Array(16).fill(false);
        const count = Math.min(3 + lvl, 10);
        let set = 0;
        while (set < count) {
            const idx = Math.floor(Math.random() * 16);
            if (!newPattern[idx]) {
                newPattern[idx] = true;
                set++;
            }
        }
        setPattern(newPattern);
        setGrid(Array(16).fill(false));
        setShowingPattern(true);
        setTimeout(() => setShowingPattern(false), 1000 + lvl * 200);
    };

    const handleCellClick = (index: number) => {
        if (showingPattern || gameOver) return;

        if (pattern[index]) {
            const newGrid = [...grid];
            newGrid[index] = true;
            setGrid(newGrid);

            // Check win
            if (newGrid.filter(Boolean).length === pattern.filter(Boolean).length) {
                setTimeout(() => {
                    updateCognitionPoints(5).catch(() => { });
                    setLevel(l => l + 1);
                    startLevel(level + 1);
                }, 500);
            }
        } else {
            setGameOver(true);
            if (level > 1) updateCognitionPoints(level).catch(() => { });
        }
    };

    return (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: '#fff'
        }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', width: '280px' }}>
                <span>LEVEL {level}</span>
                <button onClick={onExit} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer' }}>EXIT</button>
            </div>

            {gameOver ? (
                <div style={{ textAlign: 'center' }}>
                    <h2>SIGNAL LOST</h2>
                    <p style={{ marginBottom: '1rem' }}>Re-calibration required.</p>
                    <button
                        onClick={() => { setGameOver(false); setLevel(1); startLevel(1); }}
                        style={{
                            padding: '0.8rem 1.5rem',
                            background: '#fff',
                            color: '#000',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        RETRY
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '10px',
                    width: '280px',
                    height: '280px'
                }}>
                    {Array(16).fill(0).map((_, i) => (
                        <motion.div
                            key={i}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleCellClick(i)}
                            onTouchStart={(e) => { e.preventDefault(); handleCellClick(i); }}
                            animate={{
                                backgroundColor: (showingPattern && pattern[i]) || grid[i]
                                    ? '#4ade80'
                                    : 'rgba(255,255,255,0.1)'
                            }}
                            style={{
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
