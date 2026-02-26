'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@matrix-lib/utils';

interface SentimentData {
    averageMood: number;
    dominantEmotion: string;
    systemResonance: number;
    emotionDistribution: Record<string, number>;
    count: number;
    lastUpdate: string;
}

const EMOTION_MAP: Record<string, { color: string; label: string; icon: any }> = {
    joy: { color: 'amber', label: 'Radiant', icon: TrendingUp },
    happiness: { color: 'amber', label: 'Radiant', icon: TrendingUp },
    sadness: { color: 'blue', label: 'Melancholy', icon: TrendingDown },
    melancholy: { color: 'blue', label: 'Melancholy', icon: TrendingDown },
    anger: { color: 'red', label: 'Turbulent', icon: Activity },
    frustration: { color: 'red', label: 'Turbulent', icon: Activity },
    fear: { color: 'purple', label: 'Anxious', icon: Activity },
    anxiety: { color: 'purple', label: 'Anxious', icon: Activity },
    exhaustion: { color: 'slate', label: 'Depleted', icon: Minus },
    neutral: { color: 'gold', label: 'Balanced', icon: Minus },
};

const MOOD_STYLES: Record<string, { dotClass: string; dotStyle?: React.CSSProperties; barClass: string; barStyle?: React.CSSProperties }> = {
    amber: {
        dotClass: 'bg-amber-500 shadow-[0_0_8px_rgba(var(--amber-500-rgb),0.6)]',
        barClass: 'bg-amber-500/50'
    },
    blue: {
        dotClass: 'bg-blue-500 shadow-[0_0_8px_rgba(var(--blue-500-rgb),0.6)]',
        barClass: 'bg-blue-500/50'
    },
    red: {
        dotClass: 'bg-red-500 shadow-[0_0_8px_rgba(var(--red-500-rgb),0.6)]',
        barClass: 'bg-red-500/50'
    },
    purple: {
        dotClass: 'bg-purple-500 shadow-[0_0_8px_rgba(var(--purple-500-rgb),0.6)]',
        barClass: 'bg-purple-500/50'
    },
    slate: {
        dotClass: 'bg-slate-500 shadow-[0_0_8px_rgba(var(--slate-500-rgb),0.6)]',
        barClass: 'bg-slate-500/50'
    },
    gold: {
        dotClass: 'bg-[color:var(--gold)]',
        dotStyle: { boxShadow: '0 0 8px rgba(212, 168, 67, 0.6)' },
        barClass: 'bg-[color:var(--gold)]/50',
        barStyle: { backgroundColor: 'rgba(212, 168, 67, 0.5)' }
    }
};

interface BiometricData {
    cognitive_state: {
        status: string;
        color: string;
        resonance: number;
    };
    metrics: {
        hrv: number;
        sleep: number;
        readiness: number;
    };
}

export function SentimentHUD() {
    const [data, setData] = useState<SentimentData | null>(null);
    const [biometric, setBiometric] = useState<BiometricData | null>(null);
    const [swarmCount, setSwarmCount] = useState(0);
    const [spatialActive, setSpatialActive] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sentRes, swarmRes, bioRes, logsRes] = await Promise.all([
                    fetch('/api/sentiment'),
                    fetch('/api/swarm/status'),
                    fetch('/api/telemetry/biometrics?action=insight'),
                    fetch('/api/logs?service=ghost-vision&limit=1')
                ]);

                if (sentRes.ok) {
                    const json = await sentRes.json();
                    setData(json);
                }

                if (swarmRes.ok) {
                    const json = await swarmRes.json();
                    setSwarmCount(json.count);
                }

                // Check for Spatial Uplink (Phase 46)
                if (logsRes.ok) {
                    const logs = await logsRes.json();
                    const latestLog = logs.data?.[0];
                    if (latestLog && latestLog.metadata?.type === 'spatial_uplink') {
                        const logTime = new Date(latestLog.timestamp).getTime();
                        const now = Date.now();
                        setSpatialActive(now - logTime < 30000); // 30s window
                    }
                }

                if (bioRes.ok) {
                    const bioJson = await bioRes.json();
                    setBiometric(bioJson);

                    // Biometric State takes precedence for System Resonance
                    const state = bioJson.cognitive_state;
                    let colorHex = '#d4a843'; // Default gold
                    if (state.color === 'amber') colorHex = '#f59e0b';
                    if (state.color === 'blue') colorHex = '#3b82f6';
                    if (state.color === 'red') colorHex = '#ef4444';
                    if (state.color === 'purple') colorHex = '#8b5cf6';
                    if (state.color === 'slate') colorHex = '#64748b';

                    document.documentElement.style.setProperty('--system-mood-color', colorHex);
                    document.documentElement.style.setProperty('--system-mood-opacity', (0.1 + (state.resonance * 0.2)).toString());
                } else if (sentRes.ok) {
                    // Fallback to sentiment if biometrics unavailable
                    const json = await sentRes.json();
                    const mood = EMOTION_MAP[json.dominantEmotion.toLowerCase()] || EMOTION_MAP.neutral;
                    let colorHex = '#d4a843';
                    if (mood.color === 'amber') colorHex = '#f59e0b';
                    if (mood.color === 'blue') colorHex = '#3b82f6';
                    if (mood.color === 'red') colorHex = '#ef4444';
                    if (mood.color === 'purple') colorHex = '#8b5cf6';
                    if (mood.color === 'slate') colorHex = '#64748b';

                    document.documentElement.style.setProperty('--system-mood-color', colorHex);
                    document.documentElement.style.setProperty('--system-mood-opacity', (0.1 + (json.systemResonance * 0.2)).toString());
                }

                if (swarmRes.ok) {
                    const json = await swarmRes.json();
                    setSwarmCount(json.count);
                }
            } catch { /* ignore */ }
            setLoading(false);
        };

        fetchData();
        const timer = setInterval(fetchData, 10000); // Check every 10s
        return () => clearInterval(timer);
    }, []);

    if (loading || !data) return null;

    const mood = biometric ? {
        label: biometric.cognitive_state.status,
        color: biometric.cognitive_state.color,
        icon: Heart
    } : (EMOTION_MAP[data.dominantEmotion.toLowerCase()] || EMOTION_MAP.neutral);

    const Icon = mood.icon;
    const moodStyle = MOOD_STYLES[mood.color] ?? MOOD_STYLES.gold;

    return (
        <div className="flex items-center gap-4">
            {/* Swarm Status Pill */}
            {swarmCount > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                    <div className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-widest">Swarm: {swarmCount} Nodes</span>
                </div>
            )}

            {/* Biometric Sync Pill */}
            {biometric && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-full">
                    <Activity className="w-2.5 h-2.5 text-rose-400" />
                    <span className="text-[8px] font-mono text-rose-400 uppercase tracking-widest">Bio-Sync Active</span>
                </div>
            )}

            {/* Spatial Uplink Pill (Phase 46) */}
            {spatialActive && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                    <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest">Sovereign Uplink</span>
                </div>
            )}

            <div className="flex items-center gap-3 px-3 py-1 bg-white/[0.03] border border-white/[0.06] rounded-full backdrop-blur-md">
                <div className="relative flex items-center justify-center">
                    <motion.div
                        animate={{
                            scale: spatialActive ? [1, 1.4, 1] : [1, 1.2, 1],
                            opacity: spatialActive ? [0.6, 1, 0.6] : [0.4, 0.8, 0.4]
                        }}
                        transition={{ duration: spatialActive ? 1 : 2, repeat: Infinity }}
                        className={cn(
                            "w-2.5 h-2.5 rounded-full shadow-lg",
                            spatialActive ? "bg-cyan-500 shadow-cyan-500/50" : moodStyle.dotClass
                        )}
                        style={!spatialActive ? moodStyle.dotStyle : undefined}
                    />
                    <Heart className={cn(
                        "w-3 h-3 absolute text-white transition-opacity",
                        spatialActive ? "opacity-0" : "opacity-40",
                        biometric ? 'animate-pulse' : ''
                    )} />
                </div>

                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-display font-bold text-white/90 uppercase tracking-tighter">
                            {mood.label}
                        </span>
                        <Icon className="w-2.5 h-2.5 text-white/30" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-12 bg-white/5 h-1 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${data.systemResonance * 100}%` }}
                                className={cn('h-full', moodStyle.barClass)}
                                style={moodStyle.barStyle}
                            />
                        </div>
                        <span className="text-[8px] font-mono text-white/20 uppercase">
                            Resonance {(data.systemResonance * 100).toFixed(0)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

