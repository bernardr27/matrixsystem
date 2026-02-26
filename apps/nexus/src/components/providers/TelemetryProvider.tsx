'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type ServiceStatus = 'online' | 'offline' | 'connecting' | 'error' | 'degraded';

interface TelemetryStateData {
    services: {
        reflect: ServiceStatus;
        ghost: ServiceStatus;
        runner: ServiceStatus;
        nexus: ServiceStatus;
        dashboard: ServiceStatus;
        gate: ServiceStatus;
        sentinel: ServiceStatus;
        proxy: ServiceStatus;
        rocket: ServiceStatus;
    };
    gateUrl?: string;
    gateUrls?: { nexus: string; reflect: string; ghost: string; rocket: string };
    localIp?: string;
    lastPulse: Record<string, number>;
    uptimeStart: Record<string, number>;
    missedPulses: Record<string, number>;
    performanceHistory: { timestamp: number; ram: number; cpu: string }[];
    broadcasts: { id: string; message: string; timestamp: string }[];
    resonance?: { id: string; intensity: number; message: string; timestamp: number };
    resonancePath: { x: number; y: number; timestamp: number }[];
    aiMode: 'groq' | 'ollama' | 'offline';
}

interface TelemetryState extends TelemetryStateData {
    isSyncing: boolean;
    isConnecting: boolean;
    isGateOpen: boolean;
    setGateOpen: (open: boolean) => void;
    coherence: number;
    globalUptimeRef: React.RefObject<string>;
    manualOverrides: Record<string, boolean>;
    setServiceStatus: (service: keyof TelemetryStateData['services'], status: ServiceStatus) => void;
    refreshTelemetry: () => Promise<void>;
}

const TelemetryContext = createContext<TelemetryState | undefined>(undefined);

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const hasSupabase = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder';
    const [isSyncing, setIsSyncing] = useState(false);
    const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
    const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});
    const [isGateOpen, setIsGateOpen] = useState(false);

    // Split state for better performance
    const [services, setServices] = useState<TelemetryStateData['services']>({
        reflect: 'connecting',
        ghost: 'connecting',
        runner: 'connecting',
        nexus: 'connecting',
        dashboard: 'online',
        gate: 'offline',
        sentinel: 'connecting',
        proxy: 'connecting',
        rocket: 'connecting'
    });
    const [lastPulse, setLastPulse] = useState<Record<string, number>>({
        nexus: 0,
        runner: 0,
        reflect: 0,
        ghost: 0,
        proxy: 0,
        rocket: 0
    });
    const [performanceHistory, setPerformanceHistory] = useState<TelemetryStateData['performanceHistory']>([]);
    const [broadcasts, setBroadcasts] = useState<TelemetryStateData['broadcasts']>([]);
    const [resonance, setResonance] = useState<TelemetryStateData['resonance']>();
    const [resonancePath, setResonancePath] = useState<TelemetryStateData['resonancePath']>([]);
    const [gateUrl, setGateUrl] = useState<string | undefined>();
    const [gateUrls, setGateUrls] = useState<TelemetryStateData['gateUrls']>({ nexus: '', reflect: '', ghost: '', rocket: '' });
    const [localIp, setLocalIp] = useState<string | undefined>();
    const [aiMode, setAiMode] = useState<TelemetryStateData['aiMode']>('offline');
    const [uptimeStart, setUptimeStart] = useState<Record<string, number>>({ rocket: 0 });
    const [missedPulses, setMissedPulses] = useState<Record<string, number>>({});

    const lastHeartbeat = useRef<Record<string, number>>({
        nexus: 0,
        runner: 0,
        reflect: 0,
        ghost: 0,
        proxy: 0,
        sentinel: 0,
        rocket: 0
    });
    const runnerSessionId = useRef<string | null>(null);
    const overrideTimestamps = useRef<Record<string, number>>({});

    // Initial Boot Sync
    useEffect(() => {
        if (!hasSupabase) {
            setIsSyncing(false);
            setServices(prev => ({
                ...prev,
                reflect: 'offline',
                ghost: 'offline',
                runner: 'offline',
                nexus: 'offline',
                gate: 'offline',
                sentinel: 'offline',
                proxy: 'offline',
                rocket: 'offline',
                dashboard: 'online'
            }));
            return;
        }
        setIsSyncing(true);
        const now = Date.now();
        lastHeartbeat.current = { nexus: now, runner: now, reflect: now, ghost: now, proxy: now, sentinel: now, rocket: now };

        setServices(prev => ({ ...prev, dashboard: 'online' }));
        setLastPulse({ nexus: now, runner: now, reflect: now, ghost: now, proxy: now, rocket: now });

        const bootTimer = setTimeout(() => {
            setIsSyncing(false);
            setServices(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(key => {
                    const svc = key as keyof typeof updated;
                    if (svc !== 'dashboard' && updated[svc] === 'connecting') updated[svc] = 'offline';
                });
                return updated;
            });
        }, 4000);

        return () => clearTimeout(bootTimer);
    }, [hasSupabase]);

    useEffect(() => {
        if (!hasSupabase) return;
        let lastProcessedPulse = 0;
        const PULSE_THROTTLE = 1500;

        const channel = supabase.channel('system_health');

        channel.on('broadcast', { event: 'heartbeat' }, (payload) => {
            const now = Date.now();
            const data = payload.payload;

            if (data && data.services) {
                setServices(prev => {
                    const next = { ...prev };
                    let changed = false;

                    Object.entries(data.services).forEach(([name, status]) => {
                        const key = name as keyof TelemetryStateData['services'];
                        if (key in next && key !== 'dashboard') {
                            const svcStatus = (status as any)?.status || status as ServiceStatus;
                            if (next[key] !== svcStatus) {
                                next[key] = svcStatus;
                                changed = true;
                            }
                            lastHeartbeat.current[key] = now;
                        }
                    });

                    if (next.sentinel !== 'online') {
                        next.sentinel = 'online';
                        changed = true;
                    }
                    lastHeartbeat.current.sentinel = now;

                    return changed ? next : prev;
                });

                setLastPulse(prev => ({ ...prev, sentinel: now }));

                if (data.serviceStartTimes) {
                    setUptimeStart(prev => ({ ...prev, ...data.serviceStartTimes }));
                }

                if (data.gateUrls) {
                    const anyOpen = data.gateUrls.nexus || data.gateUrls.reflect || data.gateUrls.ghost;
                    if (anyOpen) setServices(prev => prev.gate !== 'online' ? { ...prev, gate: 'online' } : prev);
                }
            }
        });

        channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ghost_bridge' }, (payload) => {
            const { command, source, output } = payload.new;
            const now = Date.now();

            if (command === 'sys:broadcast') {
                let outputData: any = {};
                try { outputData = typeof output === 'string' ? JSON.parse(output) : output; } catch (e) { outputData = { message: output }; }

                const newBroadcast = {
                    id: String(payload.new.id),
                    message: outputData.message || output || '',
                    timestamp: payload.new.created_at
                };

                setBroadcasts(prev => [newBroadcast, ...prev].slice(0, 10));

                if (outputData.type === 'resonance' || outputData.type === 'optimization') {
                    setResonance({
                        id: newBroadcast.id,
                        intensity: outputData.intensity || 1,
                        message: newBroadcast.message,
                        timestamp: now
                    });
                    setResonancePath(prev => [...prev, { x: Math.random() * 100, y: Math.random() * 100, timestamp: now }].slice(-50));
                }
                return;
            }

            if (command === 'sys:heartbeat') {
                if (now - lastProcessedPulse < PULSE_THROTTLE) return;
                lastProcessedPulse = now;

                const hbTime = new Date(payload.new.created_at).getTime();
                let meta: any = {};
                try { meta = JSON.parse(output || '{}'); } catch (e) { }

                if (source === 'ghost_runner') {
                    if (meta.sessionId) runnerSessionId.current = meta.sessionId;

                    setServices(prev => prev.runner !== 'online' ? { ...prev, runner: 'online' } : prev);
                    setLastPulse(prev => ({ ...prev, runner: hbTime }));
                    lastHeartbeat.current.runner = now;

                    if (meta.ram || meta.cpu) {
                        setPerformanceHistory(prev => [...prev, { timestamp: hbTime, ram: parseFloat(meta.ram || '0'), cpu: meta.cpu || 'IDLE' }].slice(-20));
                    }

                    if (meta.gateUrls) setGateUrls(prev => ({ ...prev, ...meta.gateUrls }));
                    if (meta.localIp) setLocalIp(meta.localIp);
                    if (meta.ai_mode) setAiMode(meta.ai_mode);

                } else if (source === 'nexus_sentinel') {
                    setServices(prev => {
                        const next = { ...prev, nexus: 'online' as ServiceStatus };
                        if (meta.services) {
                            Object.entries(meta.services).forEach(([name, status]) => {
                                const key = name as keyof TelemetryStateData['services'];
                                if (key in next && key !== 'dashboard') {
                                    next[key] = (status as any)?.status || status as ServiceStatus;
                                    lastHeartbeat.current[key] = now;
                                }
                            });
                        }
                        return next;
                    });
                    setLastPulse(prev => ({ ...prev, nexus: hbTime }));
                    lastHeartbeat.current.nexus = now;
                    if (meta.gateUrls) setGateUrls(prev => ({ ...prev, ...meta.gateUrls }));
                    if (meta.localIp) setLocalIp(meta.localIp);
                    if (meta.serviceStartTimes) setUptimeStart(prev => ({ ...prev, ...meta.serviceStartTimes }));
                }
            }
        });

        channel.subscribe();

        const monitor = setInterval(() => {
            const current = Date.now();
            setServices(prev => {
                const next = { ...prev };
                let changed = false;
                Object.keys(next).forEach(svc => {
                    const key = svc as keyof typeof next;
                    if (key === 'dashboard' || key === 'gate') return;
                    const elapsed = current - (lastHeartbeat.current[key] || 0);
                    if (next[key] === 'online' && elapsed > 75000) {
                        if (overrideTimestamps.current[key]) return;
                        next[key] = 'offline';
                        setMissedPulses(m => ({ ...m, [key]: (m[key] || 0) + 1 }));
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        }, 10000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(monitor);
        };
    }, [hasSupabase]);

    const setServiceStatus = useCallback((service: keyof TelemetryStateData['services'], status: ServiceStatus) => {
        setServices(prev => ({ ...prev, [service]: status }));
        setManualOverrides(prev => ({ ...prev, [service]: true }));
        overrideTimestamps.current[service] = Date.now();
        setTimeout(() => {
            setManualOverrides(prev => ({ ...prev, [service]: false }));
            delete overrideTimestamps.current[service];
        }, 45000);
    }, []);

    const refreshTelemetry = useCallback(async () => {
        setIsSyncing(true);
        try {
            await supabase.from('ghost_bridge').insert({ command: 'sys:sync', source: 'nexus_dashboard', status: 'pending' });
            await new Promise(r => setTimeout(r, 1000));

            try {
                const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
                const rocketUrl = process.env.NEXT_PUBLIC_ROCKET_URL || `http://${host}:4000`;
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000);
                const res = await fetch(`${rocketUrl}/api/health`, { signal: controller.signal });
                clearTimeout(timeout);
                if (res.ok) {
                    setServices(prev => ({ ...prev, rocket: 'online' }));
                    lastHeartbeat.current.rocket = Date.now();
                    setLastPulse(prev => ({ ...prev, rocket: Date.now() }));
                } else {
                    setServices(prev => ({ ...prev, rocket: 'error' }));
                }
            } catch {
                setServices(prev => ({ ...prev, rocket: 'offline' }));
            }
        } finally {
            setIsSyncing(false);
        }
    }, []);

    const coherence = useMemo(() => {
        const all = Object.keys(services) as (keyof typeof services)[];
        const online = all.filter(s => services[s] === 'online').length;
        return Math.min(100, Math.round((online / all.length) * 100));
    }, [services]);

    const globalUptimeRef = useRef('00:00:00');
    useEffect(() => {
        const timer = setInterval(() => {
            const start = uptimeStart.sentinel || uptimeStart.nexus || Date.now();
            const diff = Math.floor((Date.now() - start) / 1000);
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            globalUptimeRef.current = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }, 1000);
        return () => clearInterval(timer);
    }, [uptimeStart]);

    const value = useMemo(() => ({
        services,
        lastPulse,
        performanceHistory,
        broadcasts,
        resonance,
        resonancePath,
        gateUrl,
        gateUrls,
        localIp,
        aiMode,
        uptimeStart,
        missedPulses,
        isSyncing,
        isConnecting: isSyncing,
        isGateOpen,
        setGateOpen: setIsGateOpen,
        coherence,
        globalUptimeRef,
        manualOverrides,
        setServiceStatus,
        refreshTelemetry
    }), [services, lastPulse, performanceHistory, broadcasts, resonance, resonancePath, gateUrl, gateUrls, localIp, aiMode, uptimeStart, missedPulses, isSyncing, isGateOpen, coherence, manualOverrides, setServiceStatus, refreshTelemetry]);

    return (
        <TelemetryContext.Provider value={value}>
            {children}
        </TelemetryContext.Provider>
    );
}

export function useTelemetry() {
    const context = useContext(TelemetryContext);
    if (context === undefined) throw new Error('useTelemetry must be used within a TelemetryProvider');
    return context;
}

export function useGlobalUptime() {
    const { uptimeStart } = useTelemetry();
    const [uptime, setUptime] = useState('00:00:00');
    useEffect(() => {
        const timer = setInterval(() => {
            const start = uptimeStart.sentinel || uptimeStart.nexus || Date.now();
            const diff = Math.floor((Date.now() - start) / 1000);
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            setUptime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(timer);
    }, [uptimeStart]);
    return uptime;
}
