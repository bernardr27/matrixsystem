'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

/* ═══════════════════════════════════════════════════════
   SETTINGS PROVIDER — Persistent RocketCommand Settings
   Stores in localStorage for instant cross-page access.
   ═══════════════════════════════════════════════════════ */

export interface RocketSettings {
    // ── Appearance ──
    accentColor: 'orange' | 'cyan' | 'violet' | 'emerald' | 'rose';
    animationsEnabled: boolean;
    compactMode: boolean;
    showBootScreen: boolean;

    // ── AI Chat ──
    aiProvider: 'groq' | 'google' | 'ollama';
    defaultAgent: 'antigravity' | 'ghost' | 'nexus';
    chatFontSize: 'sm' | 'base' | 'lg';
    ttsEnabled: boolean;
    ttsRate: number;
    ttsPitch: number;

    // ── Telemetry ──
    pollingInterval: number; // seconds
    showSparklines: boolean;
    telemetryHistorySize: number; // max data points

    // ── Services ──
    confirmDangerousActions: boolean;
    autoRefreshServices: boolean;
    serviceRefreshRate: number; // seconds

    // ── Notifications ──
    notifyOnServiceDown: boolean;
    notifyOnBroadcast: boolean;
    soundEnabled: boolean;

    // ── Tunnels ──
    tunnelAutoRefresh: boolean;

    // ── Developer ──
    debugMode: boolean;
    showApiLatency: boolean;
    logBroadcasts: boolean;
}

const DEFAULT_SETTINGS: RocketSettings = {
    // Appearance
    accentColor: 'orange',
    animationsEnabled: true,
    compactMode: false,
    showBootScreen: true,

    // AI Chat
    aiProvider: 'groq',
    defaultAgent: 'antigravity',
    chatFontSize: 'sm',
    ttsEnabled: false,
    ttsRate: 1.05,
    ttsPitch: 0.9,

    // Telemetry
    pollingInterval: 30,
    showSparklines: true,
    telemetryHistorySize: 30,

    // Services
    confirmDangerousActions: true,
    autoRefreshServices: true,
    serviceRefreshRate: 15,

    // Notifications
    notifyOnServiceDown: true,
    notifyOnBroadcast: false,
    soundEnabled: false,

    // Tunnels
    tunnelAutoRefresh: true,

    // Developer
    debugMode: false,
    showApiLatency: true,
    logBroadcasts: false,
};

const STORAGE_KEY = 'rocket_settings';

interface SettingsContextType {
    settings: RocketSettings;
    updateSetting: <K extends keyof RocketSettings>(key: K, value: RocketSettings[K]) => void;
    updateSettings: (partial: Partial<RocketSettings>) => void;
    resetSettings: () => void;
    exportSettings: () => string;
    importSettings: (json: string) => boolean;
}

const SettingsContext = createContext<SettingsContextType>({
    settings: DEFAULT_SETTINGS,
    updateSetting: () => {},
    updateSettings: () => {},
    resetSettings: () => {},
    exportSettings: () => '{}',
    importSettings: () => false,
});

export function useSettings() {
    return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<RocketSettings>(DEFAULT_SETTINGS);
    const [loaded, setLoaded] = useState(false);

    // Load settings from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setSettings(prev => ({ ...prev, ...parsed }));
            }
        } catch {
            // corrupted — use defaults
        }
        setLoaded(true);
    }, []);

    // Persist settings to localStorage on change
    useEffect(() => {
        if (!loaded) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch {
            // storage full or unavailable
        }
    }, [settings, loaded]);

    const updateSetting = useCallback(<K extends keyof RocketSettings>(key: K, value: RocketSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const updateSettings = useCallback((partial: Partial<RocketSettings>) => {
        setSettings(prev => ({ ...prev, ...partial }));
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const exportSettings = useCallback(() => {
        return JSON.stringify(settings, null, 2);
    }, [settings]);

    const importSettings = useCallback((json: string): boolean => {
        try {
            const parsed = JSON.parse(json);
            if (typeof parsed !== 'object' || parsed === null) return false;
            setSettings(prev => ({ ...prev, ...parsed }));
            return true;
        } catch {
            return false;
        }
    }, []);

    const value = useMemo(() => ({
        settings,
        updateSetting,
        updateSettings,
        resetSettings,
        exportSettings,
        importSettings,
    }), [settings, updateSetting, updateSettings, resetSettings, exportSettings, importSettings]);

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}
