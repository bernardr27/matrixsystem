'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Globe, Cpu, Activity, Server, CheckCircle, XCircle, AlertCircle, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface MatrixInstance {
    id: string;
    instance_name: string;
    environment: string;
    host: string;
    version: string;
    status: string;
    last_heartbeat: string;
    cpu_load: number;
    ram_percent: number;
    isOnline: boolean;
}

interface CollectiveInsight {
    id: string;
    source_instance: any;
    insight_type: string;
    title: string;
    description: string;
    effectiveness_score: number;
    times_applied: number;
    created_at: string;
}

export function InstanceRegistry() {
    const [instances, setInstances] = useState<MatrixInstance[]>([]);
    const [insights, setInsights] = useState<CollectiveInsight[]>([]);

    useEffect(() => {
        loadInstances();
        loadInsights();

        const interval = setInterval(() => {
            if (!document.hidden) loadInstances();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    async function loadInstances() {
        const { data } = await supabase
            .from('matrix_instances')
            .select('*')
            .order('last_heartbeat', { ascending: false });

        if (data) {
            const now = Date.now();
            const parsed = data.map((item: any) => ({
                ...item,
                isOnline: (now - new Date(item.last_heartbeat).getTime()) < 120000
            }));
            setInstances(parsed);
        }
    }

    async function loadInsights() {
        const { data } = await supabase
            .from('collective_insights')
            .select('*, source_instance:matrix_instances(instance_name, environment)')
            .order('effectiveness_score', { ascending: false })
            .limit(10);

        if (data) {
            setInsights(data as CollectiveInsight[]);
        }
    }

    const getEnvironmentColor = (env: string) => {
        switch (env) {
            case 'production': return 'text-red-400 bg-red-500/10 border-red-500/30';
            case 'staging': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
            case 'dev': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
        }
    };

    const getStatusIcon = (isOnline: boolean, status: string) => {
        if (!isOnline) return <XCircle size={16} className="text-red-500" />;
        if (status === 'degraded') return <AlertCircle size={16} className="text-amber-500" />;
        return <CheckCircle size={16} className="text-green-500" />;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Globe className="text-purple-400" size={24} />
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-white">
                            Distributed Consciousness
                        </h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                            {instances.filter(i => i.isOnline).length} / {instances.length} instances online
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-purple-400">
                        Hive Active
                    </span>
                </div>
            </div>

            {/* Instances Grid */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Server size={12} />
                    Matrix Instances
                </h3>

                {instances.length === 0 ? (
                    <div className="text-center py-12 text-slate-600">
                        <Globe size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="text-sm">No instances registered yet.</p>
                        <p className="text-[10px] mt-2">Hive consciousness initializing...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {instances.map((instance, idx) => (
                            <motion.div
                                key={instance.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(instance.isOnline, instance.status)}
                                        <div>
                                            <p className="text-xs text-white font-medium">{instance.instance_name}</p>
                                            <p className="text-[9px] text-slate-500">{instance.host}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[8px] px-2 py-1 rounded-full font-black uppercase border ${getEnvironmentColor(instance.environment)}`}>
                                        {instance.environment}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/5">
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <Cpu size={10} className="text-cyan-400" />
                                            <span className="text-[8px] text-slate-500 uppercase">CPU</span>
                                        </div>
                                        <p className="text-xs text-white font-bold">
                                            {instance.cpu_load?.toFixed(2) || '0.00'}
                                        </p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <Activity size={10} className="text-fuchsia-400" />
                                            <span className="text-[8px] text-slate-500 uppercase">RAM</span>
                                        </div>
                                        <p className="text-xs text-white font-bold">
                                            {instance.ram_percent?.toFixed(1) || '0.0'}%
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 text-[9px] text-slate-600">
                                    Last seen: {new Date(instance.last_heartbeat).toLocaleTimeString()}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Collective Intelligence Feed */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Lightbulb size={12} />
                    Collective Intelligence
                </h3>

                {insights.length === 0 ? (
                    <div className="text-center py-8 text-slate-600">
                        <Lightbulb size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-xs">No collective insights yet.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {insights.map((insight, idx) => (
                            <motion.div
                                key={insight.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="p-4 rounded-lg bg-white/5 border border-white/10"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <p className="text-xs text-white font-medium">{insight.title}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">{insight.description}</p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-xs text-purple-400 font-bold">
                                            {(insight.effectiveness_score * 100).toFixed(0)}%
                                        </p>
                                        <p className="text-[8px] text-slate-600">effectiveness</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-[9px] text-slate-600">
                                    <span>
                                        Source: {insight.source_instance?.instance_name || 'Unknown'}
                                    </span>
                                    <span>
                                        Applied: {insight.times_applied || 0}x
                                    </span>
                                    <span>
                                        {new Date(insight.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
