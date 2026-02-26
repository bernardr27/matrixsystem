'use client';

import { useState, useEffect } from 'react';

// Tracks install prompt availability and whether the app is already installed.
export function usePWA() {
    const [prompt, setPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        const updateInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            // iOS Safari exposes standalone on navigator
            const isIOSStandalone = (window.navigator as any).standalone;
            setIsInstalled(Boolean(isStandalone || isIOSStandalone));
        };

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setPrompt(e);
        };

        updateInstalled();
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', updateInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', updateInstalled);
        };
    }, []);

    const install = async () => {
        if (!prompt) return;
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
            setPrompt(null);
            setIsInstalled(true);
        }
    };

    return { isInstallable: !!prompt && !isInstalled, isInstalled, install };
}
