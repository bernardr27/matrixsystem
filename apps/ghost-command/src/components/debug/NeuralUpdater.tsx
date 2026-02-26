'use client';

import React, { useEffect } from 'react';
import { useSage } from '@/context/SageContext';

export const NeuralUpdater: React.FC = () => {
    const { reportNeuralFault } = useSage();

    useEffect(() => {
        // 1. Handle Controller Change (Instant Reload)
        // When a new SW skips waiting and becomes active, reload the page.
        const handleControllerChange = () => {
            
            window.location.reload();
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

            // 2. Periodic Update Checks
            // Only check when the user is looking (visibility change) or periodically
            const checkUpdate = () => {
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.update().catch(err => {
                            // Don't report this as a fault, it's just network noise usually
                            
                        });
                    });
                }
            };

            // Check every 60 seconds
            const interval = setInterval(checkUpdate, 60 * 1000);

            // Also check when window regains focus
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    checkUpdate();
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                clearInterval(interval);
            };
        }
    }, []);

    return null;
};
