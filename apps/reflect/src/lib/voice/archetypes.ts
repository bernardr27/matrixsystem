export interface VocalProfile {
    pitch: number;
    rate: number;
    volume: number;
}

export type SagePersona = 'sage' | 'marcus' | 'lao' | 'socrates';

export const VOCAL_ARCHETYPES: Record<SagePersona, VocalProfile> = {
    marcus: {
        pitch: 0.7,   // Deep, grounded
        rate: 0.85,    // Disciplined, slow
        volume: 1.0
    },
    lao: {
        pitch: 1.2,   // Higher, ethereal
        rate: 0.65,    // Very slow, meditative
        volume: 0.7
    },
    socrates: {
        pitch: 1.0,   // Natural
        rate: 1.0,    // Standard
        volume: 0.9
    },
    sage: {
        pitch: 1.0,   // Balanced
        rate: 0.9,    // Calming
        volume: 1.0
    }
};

export const speakResponse = (text: string, persona: SagePersona) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Clear previous
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const profile = VOCAL_ARCHETYPES[persona] || VOCAL_ARCHETYPES.sage;

    utterance.pitch = profile.pitch;
    utterance.rate = profile.rate;
    utterance.volume = profile.volume;

    // Optional: Select a specific voice if available (English Preferred)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
};
