import { useCallback, useMemo, useRef } from 'react';

export const useSoundEffects = () => {
    const audioContextRef = useRef<AudioContext | null>(null);

    const initAudio = useCallback(() => {
        if (!audioContextRef.current) {
            // @ts-ignore - Handle WebKit prefix
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioContextRef.current = new AudioContextClass();
            }
        }
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        return audioContextRef.current;
    }, []);

    const playTone = useCallback((freq: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
        const ctx = initAudio();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    }, [initAudio]);

    const playHover = useCallback(() => {
        // High frequency, short duration for hover
        if (!audioContextRef.current) initAudio();
        const ctx = audioContextRef.current;
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    }, [initAudio]);

    const playClick = useCallback(() => {
        if (!audioContextRef.current) initAudio();
        const ctx = audioContextRef.current;
        if (!ctx) return;

        // Thud component
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);

        // High click component
        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(2000, ctx.currentTime);
            gain2.gain.setValueAtTime(0.05, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start();
            osc2.stop(ctx.currentTime + 0.05);
        }, 10);
    }, [initAudio]);

    // Add playProcess, playError, playSuccess with similar robust implementations
    // ... (rest of implementation similar to previous but fixing TS/context issues)

    const playProcess = useCallback(() => {
        if (!audioContextRef.current) initAudio();
        const ctx = audioContextRef.current;
        if (!ctx) return;

        const count = 3;
        for (let i = 0; i < count; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const freq = 1000 + Math.random() * 2000;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + (i * 0.08));
            gain.gain.setValueAtTime(0.03, ctx.currentTime + (i * 0.08));
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i * 0.08) + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + (i * 0.08));
            osc.stop(ctx.currentTime + (i * 0.08) + 0.05);
        }
    }, [initAudio]);

    const playError = useCallback(() => {
        if (!audioContextRef.current) initAudio();
        const ctx = audioContextRef.current;
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }, [initAudio]);

    const playSuccess = useCallback(() => {
        if (!audioContextRef.current) initAudio();
        const ctx = audioContextRef.current;
        if (!ctx) return;

        [400, 600, 1000].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + (i * 0.1));
            gain.gain.setValueAtTime(0.1, ctx.currentTime + (i * 0.1));
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i * 0.1) + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + (i * 0.1));
            osc.stop(ctx.currentTime + (i * 0.1) + 0.2);
        });
    }, [initAudio]);

    return useMemo(() => ({ playHover, playClick, playProcess, playError, playSuccess, initAudio }), [playHover, playClick, playProcess, playError, playSuccess, initAudio]);
};
