'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    // console.log('[Reflect] Service Worker registered with scope:', registration.scope);
                })
                .catch((error) => {
                    console.error('[Reflect] Service Worker registration failed:', error);
                });
        }
    }, []);

    return null;
}
