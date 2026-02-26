'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseVoiceInputReturn {
    isListening: boolean;
    transcript: string;
    interimTranscript: string;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    supported: boolean;
    error: string | null;
}

// Minimal type definitions for the Web Speech API
interface SpeechRecognitionEvent {
    results: {
        [index: number]: {
            [index: number]: {
                transcript: string;
            };
            isFinal: boolean;
        };
        length: number;
    };
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
    error: string;
    message?: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
}

// Polyfill for browser support
declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

export function useVoiceInput(lang: string = 'en-US'): UseVoiceInputReturn {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [supported, setSupported] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Type as any first to avoid TS complaining about window props during init
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                setSupported(true);
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = lang;

                recognition.onstart = () => setIsListening(true);
                recognition.onend = () => setIsListening(false);
                recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                    setError(event.error);
                    setIsListening(false);
                };

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    let finalTx = '';
                    let interimTx = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTx += event.results[i][0].transcript;
                        } else {
                            interimTx += event.results[i][0].transcript;
                        }
                    }

                    if (finalTx) {
                        setTranscript(prev => prev + ' ' + finalTx.trim());
                    }
                    setInterimTranscript(interimTx);
                };

                recognitionRef.current = recognition;
            } else {
                setSupported(false);
                setError("Speech Recognition API not supported in this browser.");
            }
        }

        // Cleanup: stop recognition on unmount
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {
                    // Ignore errors during cleanup
                }
                recognitionRef.current = null;
            }
        };
    }, [lang]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                // Reset interim on start to avoid ghosts
                setInterimTranscript('');
                setError(null);
                recognitionRef.current.start();
            } catch (e) {
                console.error("Speech Recognition Start Error:", e);
                setError("Failed to start listening.");
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
        setError(null);
    }, []);

    return {
        isListening,
        transcript: (transcript + (interimTranscript ? ' ' + interimTranscript : '')).trim(),
        interimTranscript,
        startListening,
        stopListening,
        resetTranscript,
        supported,
        error
    };
}
