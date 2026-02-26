'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export type Mood = 'neutral' | 'focus' | 'creative' | 'rest' | 'chaos' | 'logic' | 'reflection';
export type EnergyLevel = number; // 1-100

interface CognitiveState {
    mood: Mood;
    energy: EnergyLevel;
    activeGoal: string | null;
    sessionDuration: number;
    interactions: number;
}

interface CognitiveContextType extends CognitiveState {
    setMood: (mood: Mood) => void;
    setEnergy: (level: EnergyLevel) => void;
    setActiveGoal: (goal: string | null) => void;
    logInteraction: () => void;
    syncState: () => Promise<void>;
}

const CognitiveContext = createContext<CognitiveContextType | undefined>(undefined);

export function CognitiveProvider({ children }: { children: React.ReactNode }) {
    const [mood, setMoodState] = useState<Mood>('neutral');
    const [energy, setEnergyState] = useState<EnergyLevel>(75); // Default to decent energy
    const [activeGoal, setActiveGoal] = useState<string | null>(null);
    const [sessionDuration, setSessionDuration] = useState(0);
    const sessionDurationRef = useRef(0);
    const [interactions, setInteractions] = useState(0);

    const supabase = React.useMemo(() => createClient(), []);

    // Load initial state from local storage or "Calibration"
    // Load initial state from local storage or DB
    useEffect(() => {
        const init = async () => {
            // 1. Try Local Storage first for immediate UI release
            const savedMood = localStorage.getItem('reflect_mood') as Mood;
            if (savedMood) setMoodState(savedMood);

            const savedGoal = localStorage.getItem('reflect_active_goal');
            if (savedGoal) setActiveGoal(savedGoal);

            // 2. Hydrate from Server (Source of Truth)
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('last_mood, core_values')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    if (profile.last_mood) {
                        setMoodState(profile.last_mood as Mood);
                        // Update local ref to keep in sync
                        localStorage.setItem('reflect_mood', profile.last_mood);
                    }
                    if (profile.core_values && (profile.core_values as any).primary_directive) {
                        const directive = (profile.core_values as any).primary_directive;
                        setActiveGoal(directive);
                        localStorage.setItem('reflect_active_goal', directive);
                    }
                }
            }
        };
        init();

        // Start session timer using ref to avoid re-rendering entire context tree every second
        const timer = setInterval(() => {
            sessionDurationRef.current += 1;
            // Only update state every 60s for display purposes
            if (sessionDurationRef.current % 60 === 0) {
                setSessionDuration(sessionDurationRef.current);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [supabase]);

    const setMood = useCallback((newMood: Mood) => {
        setMoodState(newMood);
        localStorage.setItem('reflect_mood', newMood);
        // Dispatch event for visual effects (e.g., NeuralFlow) to listen to directly if needed
        window.dispatchEvent(new CustomEvent('reflect:mood-change', { detail: { mood: newMood } }));
    }, []);

    const setEnergy = useCallback((level: EnergyLevel) => {
        setEnergyState(level);
    }, []);

    const logInteraction = useCallback(() => {
        setInteractions(prev => prev + 1);
    }, []);

    const syncState = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Here we would push strictly relevant cognitive metrics to the DB
            // For now, we trust the local session loop and maybe update a 'last_active_mood' on profile
            await supabase.from('profiles').update({
                last_mood: mood,
                last_active: new Date().toISOString()
            }).eq('id', session.user.id);
        } catch (error) {
            console.error('Failed to sync cognitive state:', error);
        }
    }, [mood, supabase]);

    // Auto-sync every few minutes or on significant changes could go here
    // For now, we keep it manual or triggered by specific events

    const contextValue = useMemo(() => ({
        mood,
        energy,
        activeGoal,
        sessionDuration,
        interactions,
        setMood,
        setEnergy,
        setActiveGoal,
        logInteraction,
        syncState
    }), [mood, energy, activeGoal, sessionDuration, interactions, setMood, setEnergy, setActiveGoal, logInteraction, syncState]);

    return (
        <CognitiveContext.Provider value={contextValue}>
            {children}
        </CognitiveContext.Provider>
    );
}

export function useCognitive() {
    const context = useContext(CognitiveContext);
    if (context === undefined) {
        throw new Error('useCognitive must be used within a CognitiveProvider');
    }
    return context;
}
