'use client';

import { useEffect, useState } from 'react';

export default function PurgePage() {
    const [status, setStatus] = useState('Initiating System Purge...');

    useEffect(() => {
        let isCancelled = false;

        async function purgeSystem() {
            try {
                // 1. Unregister Service Workers
                if ('serviceWorker' in navigator) {
                    setStatus('Unregistering Service Workers...');
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const reg of registrations) {
                        await reg.unregister();
                    }
                }

                // 2. Clear Caches
                if ('caches' in window) {
                    setStatus('Clearing DOM Caches...');
                    const cacheNames = await caches.keys();
                    for (const name of cacheNames) {
                        await caches.delete(name);
                    }
                }

                // 3. Clear Storage
                setStatus('Clearing Local Storage...');
                localStorage.clear();
                sessionStorage.clear();

                setStatus('System Purge Complete. Redirecting to Matrix Command Center v3.0...');

                if (!isCancelled) {
                    setTimeout(() => {
                        window.location.replace('/');
                    }, 1500);
                }
            } catch (err) {
                console.error(err);
                setStatus('Error during purge. Please manually clear your browser cache.');
            }
        }

        purgeSystem();

        return () => { isCancelled = true; };
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#020205',
            color: '#d4a843',
            fontFamily: 'monospace'
        }}>
            <h2>SYSTEM CACHE PURGE</h2>
            <p>{status}</p>
        </div>
    );
}
