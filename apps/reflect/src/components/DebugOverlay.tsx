'use client';

import React, { useState, useEffect } from 'react';
import { useDebug } from '@/lib/debug/context';
import styles from './DebugOverlay.module.css';

export default function DebugOverlay() {
    const [isVisible, setIsVisible] = useState(false);
    const { debugState } = useDebug();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Toggle with Alt + D
            if (e.altKey && e.key === 'd') {
                setIsVisible(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isVisible) return null;

    return (
        <div className={styles.overlay}>
            <h3 className={styles.header}>Reflect Debug</h3>
            <div className={styles.row}>
                <span className={styles.label}>Mode:</span>
                <span className={styles.value}>{debugState.mode}</span>
            </div>
            <div className={styles.row}>
                <span className={styles.label}>AI Latency:</span>
                <span className={styles.value}>{debugState.lastLatency}ms</span>
            </div>
            <div className={styles.row}>
                <span className={styles.label}>Safe Mode:</span>
                <span className={styles.value}>{debugState.safeMode ? 'ON' : 'OFF'}</span>
            </div>

            {debugState.errors.length > 0 && (
                <div className={styles.errorBox}>
                    <strong>Last Errors:</strong>
                    {debugState.errors.map((e, i) => (
                        <div key={i} className={styles.errorLine}>{e}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
