'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;

export default function Tetris() {
    const [score, setScore] = useState(0);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsInitializing(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', width: '100%' }}>
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
                <span>TETRIS_CORE: {isInitializing ? 'INIT' : 'READY'}</span>
                <span>PTS: {score}</span>
            </div>

            <div style={{
                width: 240,
                height: 480,
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px',
                padding: '12px',
                background: 'rgba(255,255,255,0.02)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {isInitializing ? (
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: '#fff', letterSpacing: '0.3em', display: 'block' }}>CALIBRATING_GRID</span>
                        <div style={{
                            width: '40px',
                            height: '2px',
                            background: '#3b82f6',
                            margin: '1rem auto'
                        }} />
                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '4rem' }}>🧱</span>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '2rem' }}>SPATIAL_LOGIC_GATE_INACTIVE</p>
                    </div>
                )}
            </div>
        </div>
    );
}
