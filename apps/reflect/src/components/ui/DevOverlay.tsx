'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { isSafeMode } from '@/lib/safe-mode';
import SentinelHUD from '../Sentinel/SentinelHUD';
import { SentinelLogger } from '@/lib/sentinel/logger';

export default function DevOverlay() {
    const [isOpen, setIsOpen] = useState(false);
    const [isDev, setIsDev] = useState(false);

    useEffect(() => {
        setIsDev(process.env.NODE_ENV === 'development');
    }, []);

    if (!isDev && !isSafeMode()) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '10px'
        }}>
            {isOpen && (
                <div style={{
                    background: '#111',
                    border: '1px solid #333',
                    borderRadius: '12px',
                    padding: '1rem',
                    width: '320px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    animation: 'fadeIn 0.2s',
                    color: '#fff'
                }}>
                    <h3 style={{ fontSize: '0.7rem', color: '#555', letterSpacing: '0.1em', marginBottom: '1rem' }}>SYSTEM_SOVEREIGNTY</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem' }}>Safe Mode</span>
                            <span style={{ color: isSafeMode() ? '#eab308' : '#333', fontWeight: 700 }}>{isSafeMode() ? 'ACTIVE' : 'OFF'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem' }}>Environment</span>
                            <span style={{ color: '#ec4899', fontWeight: 700 }}>{process.env.NODE_ENV?.toUpperCase() || 'LOCAL'}</span>
                        </div>

                        <div style={{ borderTop: '1px solid #222', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <Link href="/system" style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }}>→ System Diagnostics</Link>
                            <Link href="/settings/developer" style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }}>→ Developer Settings</Link>
                            <Link href="/neural-initialize" style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }}>→ Recalibrate Neural OS</Link>
                        </div>

                        <SentinelHUD />

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button
                                onClick={() => SentinelLogger.log("Manual Test Error", { test: true }, 'info')}
                                style={{ flex: 1, padding: '0.5rem', background: '#222', border: 'none', color: '#888', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                            >
                                TEST_LOG
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                style={{ flex: 1, padding: '0.5rem', background: '#222', border: 'none', color: '#888', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                            >
                                FORCE_RELOAD
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: isOpen ? '#ec4899' : '#1a1a1a',
                    border: `1px solid ${isOpen ? '#ec4899' : '#333'}`,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)'
                }}
            >
                <span style={{ fontSize: '1.2rem' }}>{isOpen ? '✕' : '⚙️'}</span>
            </button>
        </div>
    );
}
