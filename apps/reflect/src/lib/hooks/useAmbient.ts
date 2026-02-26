'use client';

import { useState, useEffect } from 'react';
import { ambientEngine } from '@/lib/audio/ambient-engine';

export function useAmbient(initialState = false) {
    const [isPlaying, setIsPlaying] = useState(initialState);

    useEffect(() => {
        setIsPlaying(initialState);
        if (initialState) {
            if (ambientEngine) ambientEngine.playPinkNoise();
        } else {
            if (ambientEngine) ambientEngine.stop();
        }
    }, [initialState]);

    const toggle = () => {
        if (isPlaying) {
            if (ambientEngine) ambientEngine.stop();
            setIsPlaying(false);
        } else {
            if (ambientEngine) ambientEngine.playPinkNoise();
            setIsPlaying(true);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (ambientEngine) ambientEngine.stop();
        };
    }, []);

    return { isPlaying, toggle };
}
