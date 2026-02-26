'use client';

import { useState, useCallback, useMemo } from 'react';

export const useSynthesizer = () => {
    const [enabled, setEnabled] = useState(false);
    const [speaking, setSpeaking] = useState(false);

    const speak = useCallback((text: string) => {
        if (!enabled || typeof window === 'undefined') return;

        // Cancel current
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Try to find a good voice
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.name.includes('Google US English') || v.name.includes('Microsoft Zira') || v.lang === 'en-US');
        if (preferred) utterance.voice = preferred;

        utterance.rate = 1.1; // Slightly faster for "AI" feel
        utterance.pitch = 1.0;

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [enabled]);

    const toggle = useCallback(() => setEnabled(prev => {
        const next = !prev;
        if (!next && typeof window !== 'undefined') {
            window.speechSynthesis.cancel();
        }
        return next;
    }), []);

    return useMemo(() => ({ enabled, speaking, speak, toggle }), [enabled, speaking, speak, toggle]);
};
