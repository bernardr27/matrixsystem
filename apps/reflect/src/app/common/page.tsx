'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ResonanceField = dynamic(() => import('@/components/Collective/ResonanceField'), { ssr: false });

export default function ResonanceVault() {
    return (
        <main style={{
            minHeight: '100vh',
            background: '#010101',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <ResonanceField />

            {/* Global Egress */}
            <div style={{
                position: 'fixed',
                bottom: '4rem',
                left: '2rem',
                zIndex: 10
            }}>
                <div style={{
                    fontSize: '0.55rem',
                    fontWeight: 900,
                    color: 'rgba(255,255,255,0.1)',
                    letterSpacing: '0.5em',
                    marginBottom: '1rem'
                }}>
                    SIGNAL_STREAM_STABLE
                </div>
            </div>
        </main>
    );
}
