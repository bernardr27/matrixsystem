'use client';

import { ReflectMode } from '../ai/types';

// Solfeggio Frequencies for Cognitive Anchoring
const FREQUENCY_MAP: Record<ReflectMode, number> = {
    mindset: 432,      // Natural resonance, clarity
    career: 528,       // Transformation, miracles
    money: 417,        // Undoing situations, facilitation change
    relationships: 639, // Connecting, relationships
    discipline: 741,   // Awakening intuition, solving problems
    capsule: 852,      // Returning to spiritual order, awakening
};

export class AudioResonanceEngine {
    private ctx: AudioContext | null = null;
    private oscillator: OscillatorNode | null = null;
    private gainNode: GainNode | null = null;
    private filter: BiquadFilterNode | null = null;
    private droneOscillator: OscillatorNode | null = null;
    private droneGain: GainNode | null = null;

    constructor() { }

    private init() {
        if (this.ctx) return;
        try {
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) {
                console.warn("AudioContext not supported in this environment.");
                return;
            }
            this.ctx = new AudioContextClass();
            if (!this.ctx) return;

            this.gainNode = this.ctx.createGain();
            this.filter = this.ctx.createBiquadFilter();

            this.filter.type = 'lowpass';
            this.filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
            this.filter.Q.setValueAtTime(1, this.ctx.currentTime);

            this.gainNode.connect(this.filter);
            this.filter.connect(this.ctx.destination);
            this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
        } catch (err) {
            console.error("Failed to initialize AudioResonanceEngine:", err);
            this.ctx = null;
        }
    }

    start(mode: ReflectMode) {
        this.init();
        if (!this.ctx || !this.gainNode || !this.filter) return;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const freq = FREQUENCY_MAP[mode] || 440;

        try {
            // Primary Harmony
            this.oscillator = this.ctx.createOscillator();
            if (this.oscillator) {
                this.oscillator.type = 'sine';
                this.oscillator.frequency.setValueAtTime(freq, this.ctx.currentTime);
                this.oscillator.connect(this.gainNode);
                this.oscillator.start();
            }

            // Deep Drone (Sub-octave)
            this.droneOscillator = this.ctx.createOscillator();
            if (this.droneOscillator) {
                this.droneOscillator.type = 'triangle';
                this.droneOscillator.frequency.setValueAtTime(freq / 2, this.ctx.currentTime);
                this.droneGain = this.ctx.createGain();
                if (this.droneGain) {
                    this.droneGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
                    this.droneOscillator.connect(this.droneGain);
                    this.droneGain.connect(this.gainNode);
                }
                this.droneOscillator.start();
            }

            // Fade in
            this.gainNode.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 2);
        } catch (err) {
            console.error("AudioEngine: Start Failed", err);
        }
    }

    setMode(mode: ReflectMode) {
        if (!this.ctx || !this.oscillator || !this.droneOscillator) return;
        const freq = FREQUENCY_MAP[mode] || 440;

        try {
            this.oscillator.frequency.exponentialRampToValueAtTime(freq, this.ctx.currentTime + 1.5);
            this.droneOscillator.frequency.exponentialRampToValueAtTime(freq / 2, this.ctx.currentTime + 1.5);
        } catch (err) { }
    }

    applyDissonance(intensity: number) {
        if (!this.ctx || !this.oscillator) return;
        try {
            // Subtle detuning for cognitive nudge
            this.oscillator.detune.linearRampToValueAtTime(intensity * 50, this.ctx.currentTime + 1);
        } catch (err) { }
    }

    stop() {
        if (!this.gainNode || !this.ctx) return;
        try {
            this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
            setTimeout(() => {
                if (this.oscillator) {
                    try { this.oscillator.stop(); this.oscillator.disconnect(); } catch (e) { }
                    this.oscillator = null;
                }
                if (this.droneOscillator) {
                    try { this.droneOscillator.stop(); this.droneOscillator.disconnect(); } catch (e) { }
                    this.droneOscillator = null;
                }
            }, 1100);
        } catch (err) { }
    }
}

export const resonanceEngine = typeof window !== 'undefined' ? new AudioResonanceEngine() : null;
