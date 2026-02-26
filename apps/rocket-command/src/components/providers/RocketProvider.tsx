'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type ServiceStatus = 'online' | 'offline' | 'connecting' | 'error' | 'degraded';

interface ServiceMap {
    ghost: ServiceStatus;
    reflect: ServiceStatus;
    nexus: ServiceStatus;
    rocket: ServiceStatus;
}

interface RocketTelemetry {
    services: ServiceMap;
    cpu: number;
    memory: number;
    coherence: number;
    broadcasts: any[];
    uptimeStart: Record<string, number | null>;
    gateUrl: string | null;
    isConnected: boolean;
}

const defaultServices: ServiceMap = {
    ghost: 'connecting',
    reflect: 'connecting',
    nexus: 'connecting',
    rocket: 'online',
};

const RocketContext = createContext<RocketTelemetry>({
    services: defaultServices,
    cpu: 0,
    memory: 0,
    coherence: 100,
    broadcasts: [],
    uptimeStart: {},
    gateUrl: null,
    isConnected: false,
});

export function useRocket() {
    return useContext(RocketContext);
}

// Standalone uptime hook — persists across tabs & browser restarts via localStorage
function getUptimeStart(): number {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('rocket_uptime_start');
        if (stored) return parseInt(stored, 10);
        const now = Date.now();
        localStorage.setItem('rocket_uptime_start', String(now));
        return now;
    }
    return Date.now();
}

export function useGlobalUptime(): string {
    const [uptime, setUptime] = useState('00:00:00');

    useEffect(() => {
        const start = getUptimeStart();
        const timer = setInterval(() => {
            const diff = Math.floor((Date.now() - start) / 1000);
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            setUptime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return uptime;
}

export function RocketProvider({ children }: { children: React.ReactNode }) {
    const [services, setServices] = useState<ServiceMap>(defaultServices);
    const [cpu, setCpu] = useState(0);
    const [memory, setMemory] = useState(0);
    const [coherence, setCoherence] = useState(100);
    const [broadcasts, setBroadcasts] = useState<any[]>([]);
    const [uptimeStart, setUptimeStart] = useState<Record<string, number | null>>({});
    const [gateUrl, setGateUrl] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Health polling — uses our own API route (works from any device, not just localhost)
    const checkHealth = useCallback(async () => {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const res = await fetch('/api/services', { signal: controller.signal });
            clearTimeout(timeout);
            if (!res.ok) throw new Error('services API failed');
            const data = await res.json();

            if (data.services) {
                setServices(prev => {
                    const next = { ...prev, rocket: 'online' as ServiceStatus };
                    for (const [key, svc] of Object.entries(data.services) as [string, any][]) {
                        if (key in next) {
                            (next as any)[key] = svc.status === 'online' ? 'online' : 'offline';
                        }
                    }
                    return next;
                });
            }
            if (typeof data.cpu === 'number') setCpu(data.cpu);
            if (typeof data.memory === 'number') setMemory(data.memory);
            setIsConnected(true);
        } catch {
            // API unreachable — mark siblings unknown, rocket still online
            setServices(prev => ({ ...prev, rocket: 'online' as ServiceStatus }));
        }
    }, []);

    // Supabase realtime subscription
    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | null = null;
        try {
        channel = supabase.channel('rocket_telemetry', {
            config: { broadcast: { self: true } }
        });

        channel.on('broadcast', { event: 'heartbeat' }, ({ payload }) => {
            if (!payload) return;

            if (payload.services) {
                setServices(prev => ({ ...prev, ...payload.services }));
            }
            if (payload.cpu != null) setCpu(payload.cpu);
            if (payload.memory != null) setMemory(payload.memory);
            if (payload.coherence != null) setCoherence(payload.coherence);
            if (payload.uptimeStart) setUptimeStart(payload.uptimeStart);
            if (payload.gateUrl) setGateUrl(payload.gateUrl);

            setBroadcasts(prev => [...prev.slice(-49), {
                id: Date.now(),
                ...payload,
                timestamp: new Date().toISOString(),
            }]);
        });

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') setIsConnected(true);
        });
        } catch (err) {
            console.warn('[RocketProvider] Supabase init failed:', err);
        }

        // Initial health check + periodic polling
        // Polling interval is managed by the component — default 30s
        checkHealth();
        const pollingMs = (window as any).__rocketPollingInterval || 30000;
        const poller = setInterval(checkHealth, pollingMs);

        return () => {
            clearInterval(poller);
            if (channel) { try { supabase.removeChannel(channel); } catch {} }
        };
    }, [checkHealth]);

    const value = useMemo(() => ({
        services,
        cpu,
        memory,
        coherence,
        broadcasts,
        uptimeStart,
        gateUrl,
        isConnected,
    }), [services, cpu, memory, coherence, broadcasts, uptimeStart, gateUrl, isConnected]);

    return (
        <RocketContext.Provider value={value}>
            {children}
        </RocketContext.Provider>
    );
}
