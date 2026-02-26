'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to handle real-time conversational voice with Ghost Command WebSocket bridge.
 */
export function useConversationalVoice() {
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [lastTranscription, setLastTranscription] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [error, setError] = useState<string | null>(null);

    const socketRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    // Initialize/Cleanup WebSocket
    useEffect(() => {
        const socket = new WebSocket('ws://localhost:3006');

        socket.onopen = () => console.log('[CONVO_VOICE] Socket connected');
        socket.onclose = () => console.log('[CONVO_VOICE] Socket disconnected');
        socket.onerror = (err) => setError('WebSocket connection failed');

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'transcription') {
                setLastTranscription(message.text);
                setIsThinking(true);
                setAiResponse(''); // Clear previous response
            } else if (message.type === 'llm_chunk') {
                setIsThinking(false);
                setIsSpeaking(true);
                setAiResponse(prev => prev + message.content);
            } else if (message.type === 'llm_end') {
                // Keep speaking state until TTS finished (handled in TTS effect)
            } else if (message.type === 'interrupted') {
                setIsSpeaking(false);
                window.speechSynthesis.cancel();
            }
        };

        socketRef.current = socket;
        return () => socket.close();
    }, []);

    // TTS Effect - Basic progressive synthesis
    useEffect(() => {
        if (aiResponse && isSpeaking && !window.speechSynthesis.speaking) {
            const utterance = new SpeechSynthesisUtterance(aiResponse);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    }, [aiResponse, isSpeaking]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = (reader.result as string).split(',')[1];
                        socketRef.current?.send(JSON.stringify({
                            type: 'audio_chunk',
                            data: base64data
                        }));
                    };
                    reader.readAsDataURL(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                socketRef.current?.send(JSON.stringify({ type: 'audio_end' }));
                setIsThinking(true);
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(250);
            setIsListening(true);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Microphone access denied');
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isListening) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsListening(false);
        }
    }, [isListening]);

    const interrupt = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: 'interrupt' }));
        }
    }, []);

    return {
        isListening,
        isThinking,
        isSpeaking,
        lastTranscription,
        aiResponse,
        error,
        startRecording,
        stopRecording,
        interrupt
    };
}
