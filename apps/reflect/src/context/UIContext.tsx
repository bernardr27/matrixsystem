'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

interface UIContextType {
    isBooting: boolean;
    setBooting: (state: boolean) => void;
    isMobile: boolean;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
    const [isBooting, setIsBooting] = useState(false); // Boot sequence disabled
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Debounced mobile detection
        let resizeTimer: NodeJS.Timeout;
        const checkMobile = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                setIsMobile(window.innerWidth < 768);
            }, 150);
        };

        // Initial check (immediate)
        setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', checkMobile);
        return () => {
            window.removeEventListener('resize', checkMobile);
            clearTimeout(resizeTimer);
        };
    }, []);

    const setBooting = useCallback((state: boolean) => setIsBooting(state), []);

    const contextValue = useMemo(() => ({
        isBooting, setBooting, isMobile
    }), [isBooting, setBooting, isMobile]);

    return (
        <UIContext.Provider value={contextValue}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    // Return safe fallback values if used outside provider (e.g., during SSR)
    if (context === undefined) {
        return {
            isBooting: false,
            setBooting: () => { },
            isMobile: false
        };
    }
    return context;
}
