'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DebugState {
    aiModel: string;
    lastLatency: number;
    mode: string;
    safeMode: boolean;
    errors: string[];
}

interface DebugContextType {
    debugState: DebugState;
    logError: (msg: string) => void;
    updateState: (partial: Partial<DebugState>) => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({ children }: { children: ReactNode }) {
    const [debugState, setDebugState] = useState<DebugState>({
        aiModel: process.env.NEXT_PUBLIC_AI_MODEL_ID || 'ollama',
        lastLatency: 0,
        mode: 'init',
        safeMode: process.env.NEXT_PUBLIC_SAFE_MODE === 'true',
        errors: [],
    });

    const logError = (msg: string) => {
        setDebugState(prev => ({ ...prev, errors: [...prev.errors.slice(-4), msg] }));
    };

    const updateState = (partial: Partial<DebugState>) => {
        setDebugState(prev => ({ ...prev, ...partial }));
    };

    return (
        <DebugContext.Provider value={{ debugState, logError, updateState }}>
            {children}
        </DebugContext.Provider>
    );
}

export function useDebug() {
    const context = useContext(DebugContext);
    if (!context) {
        // Return dummy if not wrapped (graceful degradation)
        return {
            debugState: { aiModel: 'unknown', lastLatency: 0, mode: 'unknown', safeMode: false, errors: [] },
            logError: () => { },
            updateState: () => { }
        };
    }
    return context;
}
