'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════
   CITADEL AUTH PROVIDER v1.0
   Client-side auth state + session validation
   ═══════════════════════════════════════════════════════ */

interface AuthState {
    authenticated: boolean;
    username: string | null;
    avatar: string | null;
    expiresAt: number | null;
    loading: boolean;
}

interface AuthContextType extends AuthState {
    logout: () => Promise<void>;
    checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
    authenticated: false,
    username: null,
    avatar: null,
    expiresAt: null,
    loading: true,
    logout: async () => { },
    checkSession: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        authenticated: false,
        username: null,
        avatar: null,
        expiresAt: null,
        loading: true,
    });

    const checkSession = useCallback(async (): Promise<boolean> => {
        try {
            const res = await fetch('/api/auth', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setState({
                    authenticated: true,
                    username: data.username,
                    avatar: data.avatar || null,
                    expiresAt: data.expiresAt,
                    loading: false,
                });
                return true;
            }
        } catch { }
        setState({ authenticated: false, username: null, avatar: null, expiresAt: null, loading: false });
        return false;
    }, []);

    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'logout' }),
                credentials: 'include',
            });
        } catch { }
        setState({ authenticated: false, username: null, avatar: null, expiresAt: null, loading: false });
    }, []);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    return (
        <AuthContext.Provider value={{ ...state, logout, checkSession }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
