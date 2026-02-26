'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[RocketCommand Error]', error);
    }, [error]);

    return (
        <div style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            textAlign: 'center',
            fontFamily: 'monospace',
        }}>
            <div style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: 'rgba(255,107,53,0.1)',
                border: '1px solid rgba(255,107,53,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                fontSize: 28,
            }}>
                🚀
            </div>
            <h2 style={{ color: '#ff6b35', fontSize: 18, marginBottom: 8 }}>
                Something went wrong
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 6, maxWidth: 400 }}>
                {error.message}
            </p>
            {error.digest && (
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginBottom: 16 }}>
                    Digest: {error.digest}
                </p>
            )}
            <button
                onClick={() => reset()}
                style={{
                    background: '#ff6b35',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: 8,
                    fontSize: 14,
                    cursor: 'pointer',
                    marginTop: 8,
                }}
            >
                Try Again
            </button>
        </div>
    );
}
