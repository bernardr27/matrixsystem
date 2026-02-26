'use client';

export class AmbientEngine {
    private ctx: AudioContext | null = null;
    private gainNode: GainNode | null = null;
    private filterNode: BiquadFilterNode | null = null;
    private isPlaying: boolean = false;
    private source: AudioBufferSourceNode | null = null;

    constructor() { }

    private init() {
        if (typeof window === 'undefined') return;
        if (this.ctx) return;

        try {
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;

            this.ctx = new AudioContextClass();
            if (!this.ctx) return;

            this.gainNode = this.ctx.createGain();
            this.filterNode = this.ctx.createBiquadFilter();

            this.filterNode.type = 'lowpass';
            this.filterNode.frequency.setValueAtTime(1000, this.ctx.currentTime);

            this.filterNode.connect(this.gainNode);
            this.gainNode.connect(this.ctx.destination);
            this.gainNode.gain.setValueAtTime(0.05, this.ctx.currentTime);
        } catch (err) {
            console.error("AmbientEngine: Initialization failed", err);
            this.ctx = null;
        }
    }

    public playPinkNoise() {
        this.init();
        if (!this.ctx || !this.filterNode || !this.gainNode) return;

        try {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            if (this.isPlaying) return;

            const bufferSize = 2 * this.ctx.sampleRate;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = buffer.getChannelData(0);
            let b0, b1, b2, b3, b4, b5, b6;
            b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;

            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.11;
                b6 = white * 0.115926;
            }

            this.source = this.ctx.createBufferSource();
            if (!this.source) return;

            this.source.buffer = buffer;
            this.source.loop = true;
            this.source.connect(this.filterNode);
            this.source.start();
            this.isPlaying = true;
        } catch (err) {
            console.error("AmbientEngine: Play failed", err);
        }
    }

    public stop() {
        try {
            if (this.ctx && this.isPlaying) {
                this.ctx.suspend();
            }
            if (this.source) {
                this.source.stop();
                this.source.disconnect();
                this.source = null;
            }
            this.isPlaying = false;
        } catch (err) {
            console.error("AmbientEngine: Stop failed", err);
        }
    }

    public setVolume(val: number) {
        if (!this.ctx || !this.gainNode) return;
        try {
            this.gainNode.gain.setTargetAtTime(val, this.ctx.currentTime, 0.5);
        } catch (err) { }
    }

    public setResonance(stressLevel: number) {
        if (!this.ctx || !this.filterNode) return;
        try {
            const freq = Math.max(500, 2000 - (stressLevel * 1500));
            this.filterNode.frequency.setTargetAtTime(freq, this.ctx.currentTime, 1.0);
        } catch (err) { }
    }
}

export const ambientEngine = new AmbientEngine();
