'use client';

import { useState, useCallback, useEffect } from 'react';

export const useSynthesizer = () => {
    const [enabled, setEnabled] = useState(false);
    const [speaking, setSpeaking] = useState(false);

    // Cancel speech synthesis on unmount
    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const speak = useCallback((text: string) => {
        if (!enabled || typeof window === 'undefined') return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        // Voice selection logic
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.name.includes('Google US English') || v.name.includes('Microsoft Zira') || v.lang === 'en-US');
        if (preferred) utterance.voice = preferred;

        utterance.rate = 1.1;
        utterance.pitch = 1.0;

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [enabled]);

    const toggle = () => setEnabled(prev => !prev);

    return { enabled, speaking, speak, toggle };
};
