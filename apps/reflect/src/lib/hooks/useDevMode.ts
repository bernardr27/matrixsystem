'use client';

import { useState, useEffect } from 'react';

const DEV_MODE_KEY = 'reflect.dev_mode';
const DEV_MODE_EVENT = 'reflect.dev_mode_change';

export function useDevMode() {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        // Initial load
        const stored = localStorage.getItem(DEV_MODE_KEY);
        setEnabled(stored === 'true');

        // Listen for changes (cross-component sync)
        const handleStorageChange = () => {
            const current = localStorage.getItem(DEV_MODE_KEY);
            setEnabled(current === 'true');
        };

        window.addEventListener(DEV_MODE_EVENT, handleStorageChange);
        return () => window.removeEventListener(DEV_MODE_EVENT, handleStorageChange);
    }, []);

    const enable = () => {
        localStorage.setItem(DEV_MODE_KEY, 'true');
        window.dispatchEvent(new Event(DEV_MODE_EVENT));
    };

    const disable = () => {
        localStorage.removeItem(DEV_MODE_KEY);
        window.dispatchEvent(new Event(DEV_MODE_EVENT));
    };

    return { enabled, enable, disable };
}
