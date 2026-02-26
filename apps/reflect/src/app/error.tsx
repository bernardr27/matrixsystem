'use client';

import { useEffect } from 'react';
import { NeuralSurface } from '@/components/ui/NeuralSurface';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
        }}>
            <NeuralSurface variant="glass" style={{ padding: '3rem', textAlign: 'center', borderColor: '#ef4444' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ef4444' }}>SYSTEM FAILURE</h2>
                <p style={{ marginBottom: '2rem', opacity: 0.7 }}>The application interface has crashed.</p>
                <button
                    onClick={() => reset()}
                    style={{
                        padding: '1rem 2rem',
                        background: '#fff',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    RETRY
                </button>
            </NeuralSurface>
        </div>
    );
}
