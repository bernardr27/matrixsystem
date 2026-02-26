/**
 * Reflect OS // Affective Computing Core
 * Managing Biometric Resonance & Neural Synchrony.
 */

export interface BiometricState {
    stressLevel: number; // 0.0 to 1.0
    focusLevel: number;  // 0.0 to 1.0
    heartRate: number;   // BPM
    timestamp: number;
}

export class BiofeedbackManager {
    private state: BiometricState = {
        stressLevel: 0.3,
        focusLevel: 0.8,
        heartRate: 65,
        timestamp: Date.now()
    };

    private listeners: ((state: BiometricState) => void)[] = [];
    private simulationInterval: any = null;

    constructor() {
        if (typeof window === 'undefined') return;
    }

    addListener(callback: (state: BiometricState) => void) {
        this.listeners.push(callback);
    }

    removeListener(callback: (state: BiometricState) => void) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    startSimulation() {
        if (this.simulationInterval) return;
        this.simulationInterval = setInterval(() => {
            // Drift logic for simulation
            this.state.stressLevel = Math.max(0, Math.min(1, this.state.stressLevel + (Math.random() * 0.1 - 0.05)));
            this.state.focusLevel = Math.max(0, Math.min(1, this.state.focusLevel + (Math.random() * 0.1 - 0.05)));
            this.state.heartRate = 60 + (this.state.stressLevel * 40) + (Math.random() * 2);
            this.state.timestamp = Date.now();

            this.notify();
        }, 3000);
    }

    stopSimulation() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
    }

    setManualStress(level: number) {
        this.state.stressLevel = level;
        this.notify();
    }

    getState(): BiometricState {
        return { ...this.state };
    }

    private notify() {
        this.listeners.forEach(l => l(this.state));
    }

    /**
     * Map stress to a specific HSL color range.
     * High stress (1.0) -> Cool Blues/Greens (Peaceful resonance)
     * Low stress (0.0) -> Neutral/Warm tones
     */
    getResonanceColor(): string {
        const h = 200 + (this.state.stressLevel * 40); // Shift towards blue
        const s = 40 + (this.state.stressLevel * 20);
        const l = 20 + (this.state.stressLevel * 10);
        return `hsl(${h}, ${s}%, ${l}%)`;
    }

    /**
     * Map focus to a specific frequency multiplier.
     * Low focus -> Higher frequencies to stimulate.
     */
    getFrequencyMultiplier(): number {
        return 1.0 + (1.0 - this.state.focusLevel) * 0.5;
    }
}

export const biofeedbackManager = typeof window !== 'undefined' ? new BiofeedbackManager() : null;
