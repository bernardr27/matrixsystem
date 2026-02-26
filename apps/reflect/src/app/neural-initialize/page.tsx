'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * NeuralInitializePage (Legacy)
 * This page has been superseded by /setup for the new onboarding flow.
 * Redirecting for backwards compatibility.
 */
export default function NeuralInitializePage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/setup');
    }, [router]);

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.2)',
            fontSize: '10px',
            fontFamily: 'monospace',
            letterSpacing: '0.2em'
        }}>
            INITIALIZING_SYNAPSE_REDIRECT...
        </div>
    );
}
