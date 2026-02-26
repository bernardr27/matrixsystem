'use client';

import { useState, useEffect, useCallback } from 'react';

export function useZen() {
    const [isZen, setIsZen] = useState(false);

    const enterZen = useCallback(async () => {
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
            setIsZen(true);
        }
    }, []);

    const exitZen = useCallback(async () => {
        if (document.exitFullscreen) {
            await document.exitFullscreen();
            setIsZen(false);
        }
    }, []);

    const toggleZen = useCallback(() => {
        if (!isZen) enterZen();
        else exitZen();
    }, [isZen, enterZen, exitZen]);

    useEffect(() => {
        const handler = () => {
            if (!document.fullscreenElement) setIsZen(false);
        };
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // Keyboard support
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                toggleZen();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [toggleZen]);

    return { isZen, toggleZen, enterZen, exitZen };
}
