'use client';

import { useEffect, useRef } from 'react';
import { speakResponse, SagePersona } from '@/lib/voice/archetypes';

interface NeuralVoiceProps {
    text: string | null;
    persona: SagePersona;
    enabled: boolean;
}

export default function NeuralVoice({ text, persona, enabled }: NeuralVoiceProps) {
    const lastSpokenRef = useRef<string | null>(null);

    useEffect(() => {
        if (!enabled || !text || text === lastSpokenRef.current) return;

        // Strip markdown if any for better TTS
        const cleanText = text.replace(/[*#_\[\]]/g, '');

        // Small delay to let the UI settle
        const timer = setTimeout(() => {
            speakResponse(cleanText, persona);
            lastSpokenRef.current = text;
        }, 800);

        return () => {
            clearTimeout(timer);
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, [text, persona, enabled]);

    return null; // Headless component
}
