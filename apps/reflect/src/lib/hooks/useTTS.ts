'use client';

import { useState, useEffect, useRef } from 'react';

export function useTTS() {
    const [speaking, setSpeaking] = useState(false);
    const synth = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synth.current = window.speechSynthesis;
        }
    }, []);

    const speak = (text: string) => {
        if (!synth.current) return;

        // Cancel existing
        synth.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Attempt to pick a decent voice (Subjective preference for English)
        const voices = synth.current.getVoices();
        const preferred = voices.find(v => v.lang === 'en-US' && !v.name.includes('Microsoft'));
        if (preferred) utterance.voice = preferred;

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

        // Pitch/Rate adjustments for calmness
        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        synth.current.speak(utterance);
    };

    const cancel = () => {
        if (synth.current) {
            synth.current.cancel();
            setSpeaking(false);
        }
    };

    return { speak, cancel, speaking };
}
