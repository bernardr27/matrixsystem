'use client';

import React, { createContext, useContext, useEffect, useRef, useMemo, useCallback, ReactNode } from 'react';
import { MatrixDiagnostic, AppName } from '@/lib/MatrixDiagnostic';

interface DiagnosticContextValue {
    log: (category: string, action: string, metadata?: Record<string, any>) => void;
    startTimer: (operationId: string) => void;
    endTimer: (operationId: string, action: string, metadata?: Record<string, any>) => number;
    error: (action: string, error: Error | string, metadata?: Record<string, any>) => void;
}

const DiagnosticContext = createContext<DiagnosticContextValue | null>(null);

interface DiagnosticProviderProps {
    app: AppName;
    children: ReactNode;
}

export function DiagnosticProvider({ app, children }: DiagnosticProviderProps) {
    const mountTimeRef = useRef(Date.now());

    // Log page mount
    useEffect(() => {
        const mountStartedAt = mountTimeRef.current;
        MatrixDiagnostic.log(app, 'action', 'app_mounted', {
            url: typeof window !== 'undefined' ? window.location.pathname : '',
        });

        return () => {
            const sessionDuration = Math.round((Date.now() - mountStartedAt) / 1000);
            MatrixDiagnostic.log(app, 'action', 'app_unmounted', { sessionDuration });
            MatrixDiagnostic.flush();
        };
    }, [app]);

    // Track page visibility changes
    useEffect(() => {
        const handleVisibility = () => {
            MatrixDiagnostic.log(app, 'action', document.hidden ? 'app_hidden' : 'app_visible');
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [app]);

    // Track errors
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            MatrixDiagnostic.error(app, 'unhandled_error', event.error || event.message);
        };
        const handleRejection = (event: PromiseRejectionEvent) => {
            MatrixDiagnostic.error(app, 'unhandled_rejection', String(event.reason));
        };
        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);
        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, [app]);

    const log = useCallback((category: string, action: string, metadata?: Record<string, any>) => {
        MatrixDiagnostic.log(app, category as any, action, metadata);
    }, [app]);

    const startTimer = useCallback((operationId: string) => {
        MatrixDiagnostic.startTimer(operationId);
    }, []);

    const endTimer = useCallback((operationId: string, action: string, metadata?: Record<string, any>) => {
        return MatrixDiagnostic.endTimer(app, operationId, action, metadata);
    }, [app]);

    const error = useCallback((action: string, err: Error | string, metadata?: Record<string, any>) => {
        MatrixDiagnostic.error(app, action, err, metadata);
    }, [app]);

    const value = useMemo(() => ({ log, startTimer, endTimer, error }), [log, startTimer, endTimer, error]);

    return (
        <DiagnosticContext.Provider value={value}>
            {children}
        </DiagnosticContext.Provider>
    );
}

export function useDiagnostic() {
    const context = useContext(DiagnosticContext);
    if (!context) {
        // Return no-op functions if not wrapped in provider
        return {
            log: () => { },
            startTimer: () => { },
            endTimer: () => 0,
            error: () => { },
        };
    }
    return context;
}
