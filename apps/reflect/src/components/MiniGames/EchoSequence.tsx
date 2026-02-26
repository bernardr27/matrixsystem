'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];

export default function EchoSequence({ onExit }: { onExit: () => void }) {
    const [sequence, setSequence] = useState<number[]>([]);
    const [playbackIdx, setPlaybackIdx] = useState(0);
    const [userTurn, setUserTurn] = useState(false);
    const [activeColor, setActiveColor] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [message, setMessage] = useState("Watch Pattern");
    const startNewGameRef = useRef<() => void>(() => { });

    useEffect(() => {
        startNewGameRef.current();
    }, []);

    const startNewGame = () => {
        setSequence([Math.floor(Math.random() * 4)]);
        setScore(0);
        setGameOver(false);
        setUserTurn(false);
        setPlaybackIdx(0);
        setMessage("Watch Pattern");
        setTimeout(playSequence, 1000); // Wait bit before starting
    };
    startNewGameRef.current = startNewGame;

    const playSequence = async () => {
        setUserTurn(false);
        setMessage("Memorize...");
        for (let i = 0; i < sequence.length; i++) {
            await flash(sequence[i]);
            await new Promise(r => setTimeout(r, 300));
        }
        setUserTurn(true);
        setMessage("Your Turn");
    };

    const flash = async (idx: number) => {
        setActiveColor(idx);
        await new Promise(r => setTimeout(r, 400));
        setActiveColor(null);
    };

    const handleBtnClick = async (idx: number) => {
        if (!userTurn || gameOver) return;

        flash(idx);

        if (idx === sequence[playbackIdx]) {
            if (playbackIdx === sequence.length - 1) {
                // Round Complete
                setUserTurn(false);
                setScore(s => s + 1);
                setMessage("Good");
                setTimeout(() => {
                    const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
                    setSequence(nextSeq);
                    setPlaybackIdx(0);
                    playSequence();
                }, 1000);
            } else {
                setPlaybackIdx(p => p + 1);
            }
        } else {
            setGameOver(true);
            setMessage("Sequence Broken");
        }
    };

    return (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: '#fff'
        }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', width: '260px' }}>
                <span>SCORE: {score}</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{message}</span>
                <button onClick={onExit} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer' }}>EXIT</button>
            </div>

            {gameOver && (
                <div style={{ margin: '1rem' }}>
                    <button
                        onClick={startNewGame}
                        style={{
                            padding: '0.5rem 1rem',
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
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px',
                width: '260px',
                height: '260px'
            }}>
                {COLORS.map((color, i) => (
                    <motion.div
                        key={i}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleBtnClick(i)}
                        onTouchStart={(e) => { e.preventDefault(); handleBtnClick(i); }}
                        style={{
                            backgroundColor: color,
                            opacity: activeColor === i ? 1 : 0.3,
                            borderRadius: '16px',
                            cursor: 'pointer',
                            boxShadow: activeColor === i ? `0 0 30px ${color}` : 'none',
                            transition: 'opacity 0.1s'
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
