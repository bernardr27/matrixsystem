'use client';

import { useEffect } from 'react';

export function ServiceWorkerPurge() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (let registration of registrations) {
                    registration.unregister().then(() => {
                        
                        // Optional: Force reload if we found one? 
                        // Better to just let the user reload once.
                    });
                }
            });
        }
    }, []);

    return null;
}
