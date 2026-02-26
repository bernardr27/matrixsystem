'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Archetype } from '@/lib/ai/archetypes';

export type Tier = 'Essence' | 'Transcendence' | 'Synthesis';

interface AccountContextType {
    tier: Tier;
    setTier: (tier: Tier) => void;
    archetype: Archetype | null;
    setArchetype: (archetype: Archetype) => void;
    insights: string | null;
    setInsights: (insights: string) => void;
    calibrationSnippet: string | null;
    setCalibrationSnippet: (snippet: string) => void;
    userName: string | null;
    setUserName: (name: string) => void;
    hasAccess: (feature: string) => boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider = ({ children }: { children: React.ReactNode }) => {
    const [tier, setTier] = useState<Tier>('Essence');
    const [archetype, setArchetype] = useState<Archetype | null>(null);
    const [insights, setInsights] = useState<string | null>(null);
    const [calibrationSnippet, setCalibrationSnippet] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);

    // Persist session state in localStorage & Hydrate from DB
    useEffect(() => {
        const savedTier = localStorage.getItem('reflect_tier');
        if (savedTier) setTier(savedTier as Tier);

        const savedArch = localStorage.getItem('reflect_archetype');
        if (savedArch) {
            try {
                setArchetype(JSON.parse(savedArch));
            } catch (e) {
                console.error("Failed to load saved archetype", e);
            }
        }

        const savedSnippet = localStorage.getItem('reflect_calibration_snippet');
        if (savedSnippet) setCalibrationSnippet(savedSnippet);

        const savedInsights = localStorage.getItem('reflect_insights');
        if (savedInsights) setInsights(savedInsights);

        const savedUsername = localStorage.getItem('reflect_username');
        if (savedUsername) setUserName(savedUsername);

        // Hydrate from Supabase
        const hydrate = async () => {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('archetype, onboarding_complete')
                    .eq('id', session.user.id)
                    .single();

                if (profile?.archetype) {
                    setArchetype(profile.archetype as Archetype);
                    localStorage.setItem('reflect_archetype', JSON.stringify(profile.archetype));

                    // Apply Theme
                    if (typeof document !== 'undefined') {
                        document.documentElement.style.setProperty('--archetype-color', (profile.archetype as any).color);
                        document.documentElement.style.setProperty('--archetype-glow', `${(profile.archetype as any).color}33`);
                    }
                }
            }
        };
        hydrate();
    }, []);

    const updateTier = useCallback((newTier: Tier) => {
        setTier(newTier);
        localStorage.setItem('reflect_tier', newTier);
    }, []);

    const updateArchetype = useCallback((newArch: Archetype) => {
        setArchetype(newArch);
        localStorage.setItem('reflect_archetype', JSON.stringify(newArch));

        // Dynamic Theme Injection
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--archetype-color', newArch.color);
            document.documentElement.style.setProperty('--archetype-glow', `${newArch.color}33`);
        }
    }, []);

    const updateCalibrationSnippet = useCallback((snippet: string) => {
        setCalibrationSnippet(snippet);
        localStorage.setItem('reflect_calibration_snippet', snippet);
    }, []);

    const updateInsights = useCallback((newInsights: string) => {
        setInsights(newInsights);
        localStorage.setItem('reflect_insights', newInsights);
    }, []);

    const updateUsername = useCallback((name: string) => {
        setUserName(name);
        localStorage.setItem('reflect_username', name);
    }, []);

    const hasAccess = useCallback((feature: string) => {
        if (tier === 'Transcendence' || tier === 'Synthesis') return true;
        const restricted = ['resonance', 'deep_analytics', 'autonomous_archiving'];
        return !restricted.includes(feature.toLowerCase());
    }, [tier]);

    const contextValue = useMemo(() => ({
        tier,
        setTier: updateTier,
        archetype,
        setArchetype: updateArchetype,
        insights,
        setInsights: updateInsights,
        calibrationSnippet,
        setCalibrationSnippet: updateCalibrationSnippet,
        userName,
        setUserName: updateUsername,
        hasAccess
    }), [tier, updateTier, archetype, updateArchetype, insights, updateInsights, calibrationSnippet, updateCalibrationSnippet, userName, updateUsername, hasAccess]);

    return (
        <AccountContext.Provider value={contextValue}>
            {children}
        </AccountContext.Provider>
    );
};

export const useAccount = () => {
    const context = useContext(AccountContext);
    if (!context) throw new Error('useAccount must be used within AccountProvider');
    return context;
};
