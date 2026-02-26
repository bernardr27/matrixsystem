import { useCallback, useMemo, useEffect } from 'react';
import { useSoundEffects } from './useSoundEffects';

export const useSensory = () => {
    const sound = useSoundEffects();

    const triggerHaptic = useCallback((pattern: number | number[]) => {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }, []);

    // Initialize audio on first user interaction to bypass browser autoplay policy
    useEffect(() => {
        const unlockAudio = () => {
            sound.initAudio();
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };

        window.addEventListener('click', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);

        return () => {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
    }, [sound]);

    const click = useCallback(() => {
        triggerHaptic(10);
        sound.playClick();
    }, [triggerHaptic, sound]);

    const hover = useCallback(() => {
        triggerHaptic(5);
        sound.playHover();
    }, [triggerHaptic, sound]);

    const success = useCallback(() => {
        triggerHaptic([50, 30, 50]);
        sound.playSuccess();
    }, [triggerHaptic, sound]);

    const error = useCallback(() => {
        triggerHaptic([50, 50, 50, 50, 100]);
        sound.playError();
    }, [triggerHaptic, sound]);

    const pulse = useCallback(() => {
        triggerHaptic([20, 50, 20]);
        sound.playProcess();
    }, [triggerHaptic, sound]);

    const boot = useCallback(() => {
        triggerHaptic([50, 30, 100, 30, 200]);
        sound.playSuccess(); // Reuse success for now
    }, [triggerHaptic, sound]);

    return useMemo(() => ({
        click,
        hover,
        success,
        error,
        pulse,
        boot
    }), [click, hover, success, error, pulse, boot]);
};
