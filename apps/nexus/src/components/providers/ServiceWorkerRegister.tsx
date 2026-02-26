'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                })
                .catch((error) => {
                    console.error('[Matrix Hub] Service Worker registration failed:', error);
                });
        }
    }, []);

    return null;
}
