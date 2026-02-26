'use client';

import React, { useState, useEffect } from 'react';

export default function Pacman() {
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
                <span>PACMAN_CORE: {isInitializing ? 'SCANNING' : 'READY'}</span>
                <span>PTS: {score}</span>
            </div>

            <div style={{
                width: 300,
                height: 300,
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%',
                padding: '12px',
                background: 'rgba(255,255,255,0.02)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
            }}>
                {isInitializing ? (
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid #f59e0b',
                        borderTopColor: 'transparent',
                        borderRadius: '50%'
                    }} />
                ) : (
                    <span style={{ fontSize: '5rem', filter: 'drop-shadow(0 0 20px #f59e0b)' }}>🟡</span>
                )}
            </div>
        </div>
    );
}
