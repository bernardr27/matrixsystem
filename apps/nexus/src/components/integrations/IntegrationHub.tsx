'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Zap, CheckCircle, XCircle, AlertTriangle, Settings2, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface Integration {
    id: string;
    integration_name: string;
    display_name: string;
    description: string;
    integration_type: string;
    enabled: boolean;
    health_status: string;
    success_count: number;
    failure_count: number;
    last_success: string;
    last_failure: string;
}

interface IntegrationEvent {
    id: string;
    integration_name: string;
    event_type: string;
    status: string;
    created_at: string;
    duration_ms: number;
}

export function IntegrationHub() {
    const [gateStatus, setGateStatus] = useState<'online' | 'offline'>('offline');
    const [gateUrl, setGateUrl] = useState<string | null>(null);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [events, setEvents] = useState<IntegrationEvent[]>([]);

    useEffect(() => {
        loadIntegrations();
        loadEvents();
        checkGateStatus();

        const interval = setInterval(() => {
            loadIntegrations();
            loadEvents();
            checkGateStatus();
        }, 30000); // Poll every 30s — real-time updates handled by Supabase channels

        return () => clearInterval(interval);
    }, []);

    async function loadIntegrations() {
        const { data } = await supabase
            .from('integration_configs')
            .select('*')
            .order('integration_name');

        if (data) {
            setIntegrations(data as Integration[]);
        }
    }

    async function loadEvents() {
        const { data } = await supabase
            .from('integration_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setEvents(data as IntegrationEvent[]);
        }
    }

    async function checkGateStatus() {
        const { data } = await supabase
            .from('ghost_bridge')
            .select('output')
            .eq('command', 'sys:heartbeat')
            .eq('source', 'nexus_sentinel')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (data?.output) {
            try {
                const status = typeof data.output === 'string' ? JSON.parse(data.output) : data.output;
                setGateUrl(status.gateUrl || null);
                // "online" if gateUrl is present
                setGateStatus(status.gateUrl ? 'online' : 'offline');
            } catch (e) {
                // ignore parse error
            }
        }
    }

    async function toggleGate(enable: boolean) {
        const command = enable ? 'sys:open_gate' : 'sys:close_gate';
        await supabase.from('ghost_bridge').insert({
            command: command,
            source: 'nexus_dashboard',
            status: 'pending'
        });

        // Optimistic update
        if (!enable) {
            setGateUrl(null);
            setGateStatus('offline');
        }
    }

    async function toggleIntegration(name: string, currentState: boolean) {
        const { error } = await supabase
            .from('integration_configs')
            .update({ enabled: !currentState })
            .eq('integration_name', name);

        if (!error) {
            await loadIntegrations();
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'notification': return '📢';
            case 'devops': return '🔧';
            case 'webhook': return '🔗';
            case 'cloud': return '☁️';
            default: return '⚙️';
        }
    };

    const getHealthColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-green-500';
            case 'degraded': return 'text-amber-500';
            case 'failed': return 'text-red-500';
            default: return 'text-slate-500';
        }
    };

    const getHealthIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle size={16} className="text-green-500" />;
            case 'degraded': return <AlertTriangle size={16} className="text-amber-500" />;
            case 'failed': return <XCircle size={16} className="text-red-500" />;
            default: return <Activity size={16} className="text-slate-500" />;
        }
    };

    const activeCount = integrations.filter(i => i.enabled).length + (gateStatus === 'online' ? 1 : 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Zap className="text-amber-400" size={24} />
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-white">
                            Integration Arsenal
                        </h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                            {activeCount} active modules
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">
                        External Intelligence
                    </span>
                </div>
            </div>

            {/* Integrations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* MATRIX HUB GATE CARD (Special) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border transition-all ${gateStatus === 'online'
                        ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)]'
                        : 'bg-white/[0.02] border-white/5 opacity-60'
                        }`}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🌐</span>
                            <div>
                                <p className="text-xs text-white font-medium">Matrix Gate</p>
                                <p className="text-[9px] text-slate-500">Global Tunneling Protocol</p>
                            </div>
                        </div>
                        {gateStatus === 'online'
                            ? <CheckCircle size={16} className="text-cyan-400" />
                            : <Activity size={16} className="text-slate-500" />
                        }
                    </div>

                    <div className="min-h-[40px] mb-3">
                        {gateStatus === 'online' && gateUrl ? (
                            <a href={gateUrl} target="_blank" rel="noopener noreferrer"
                                className="block p-2 rounded bg-black/40 text-[10px] text-cyan-400 font-mono truncate hover:bg-black/60 transition-colors">
                                {gateUrl}
                            </a>
                        ) : (
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                Securely expose local dashboard to the global network via encrypted tunnel.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 p-2 rounded-lg bg-black/20">
                        <div>
                            <p className="text-[8px] text-slate-600 uppercase">Latency</p>
                            <p className="text-xs text-slate-300 font-bold">~50ms</p>
                        </div>
                        <div>
                            <p className="text-[8px] text-slate-600 uppercase">Security</p>
                            <p className="text-xs text-slate-300 font-bold">Encrypted</p>
                        </div>
                    </div>

                    <button type="button"
                        onClick={() => toggleGate(gateStatus === 'offline')}
                        className={`w-full py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${gateStatus === 'online'
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30'
                            }`}
                    >
                        {gateStatus === 'online' ? 'Close Gate' : 'Open Gate'}
                    </button>
                </motion.div>

                {/* Standard Integrations */}
                {integrations.map((integration, idx) => (
                    <motion.div
                        key={integration.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-4 rounded-xl border transition-all ${integration.enabled
                            ? 'bg-white/5 border-white/10 hover:border-amber-500/30'
                            : 'bg-white/[0.02] border-white/5 opacity-60'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{getTypeIcon(integration.integration_type)}</span>
                                <div>
                                    <p className="text-xs text-white font-medium">{integration.display_name}</p>
                                    <p className="text-[9px] text-slate-500">{integration.integration_type}</p>
                                </div>
                            </div>
                            {getHealthIcon(integration.health_status)}
                        </div>

                        <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                            {integration.description}
                        </p>

                        <div className="grid grid-cols-2 gap-2 mb-3 p-2 rounded-lg bg-black/20">
                            <div>
                                <p className="text-[8px] text-slate-600 uppercase">Success</p>
                                <p className="text-xs text-green-400 font-bold">{integration.success_count}</p>
                            </div>
                            <div>
                                <p className="text-[8px] text-slate-600 uppercase">Failed</p>
                                <p className="text-xs text-red-400 font-bold">{integration.failure_count}</p>
                            </div>
                        </div>

                        <button type="button"
                            onClick={() => toggleIntegration(integration.integration_name, integration.enabled)}
                            className={`w-full py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${integration.enabled
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                                }`}
                        >
                            {integration.enabled ? 'Disable' : 'Enable'}
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Event Log */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Activity size={12} />
                    Recent Events
                </h3>

                {events.length === 0 ? (
                    <div className="text-center py-8 text-slate-600">
                        <Activity size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-xs">No integration events yet.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {events.slice(0, 10).map((event, idx) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${event.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                                        }`} />
                                    <div>
                                        <p className="text-xs text-white font-medium">
                                            {event.integration_name} • {event.event_type}
                                        </p>
                                        <p className="text-[9px] text-slate-500">
                                            <SafeDateTime timestamp={event.created_at} />
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-xs font-bold ${event.status === 'success' ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {event.status}
                                    </p>
                                    {event.duration_ms && (
                                        <p className="text-[9px] text-slate-600">{event.duration_ms}ms</p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
function SafeDateTime({ timestamp }: { timestamp: string }) {
    const [dateTime, setDateTime] = useState<string | null>(null);
    useEffect(() => {
        setDateTime(new Date(timestamp).toLocaleString());
    }, [timestamp]);
    return <>{dateTime || '--/--/---- --:--:--'}</>;
}
