'use client';

import { useEffect } from 'react';
import { resonanceEngine } from '../audio/resonance';
import { ReflectMode } from '../ai/types';

export function useAudioResonance(mode: ReflectMode, enabled: boolean) {
    useEffect(() => {
        const engine = resonanceEngine;
        if (!engine) return;

        if (enabled) {
            engine.start(mode);
        } else {
            engine.stop();
        }

        return () => {
            engine.stop();
        };
    }, [enabled, mode]);

    useEffect(() => {
        const engine = resonanceEngine;
        if (enabled && engine) {
            engine.setMode(mode);
        }
    }, [mode, enabled]);

    const triggerDissonance = (intensity: number) => {
        const engine = resonanceEngine;
        if (enabled && engine) {
            engine.applyDissonance(intensity);
            setTimeout(() => {
                engine.applyDissonance(0);
            }, 3000);
        }
    };

    return { triggerDissonance };
}
