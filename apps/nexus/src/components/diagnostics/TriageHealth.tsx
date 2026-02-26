'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
    Shield,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    Activity,
    Zap,
    Eye,
    Wrench
} from 'lucide-react';

interface TriageResult {
    app: string;
    healthScore: number;
    evolve?: { totalFindings: number };
    purge?: { lint: { errors: number } };
    timestamp: string;
}

interface TriageHealthProps {
    app?: string;
    compact?: boolean;
}

export function TriageHealth({ app = 'reflect', compact = false }: TriageHealthProps) {
    const [health, setHealth] = useState<TriageResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const fetchHealth = useCallback(async () => {
        setLoading(true);
        try {
            // Request triage health check via ghost_bridge
            await supabase.from('ghost_bridge').insert({
                command: 'triage:health',
                payload: JSON.stringify({ app }),
                status: 'pending',
                source: 'nexus_dashboard'
            });

            // Wait a bit then fetch result
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Get latest triage result
            const { data } = await supabase
                .from('ghost_bridge')
                .select('*')
                .eq('command', 'triage:result')
                .order('created_at', { ascending: false })
                .limit(1);

            if (data && data[0]?.payload) {
                const result = JSON.parse(data[0].payload);
                if (result.result) {
                    setHealth({
                        app: result.app,
                        healthScore: result.result.healthScore,
                        evolve: result.result.evolve,
                        purge: result.result.purge,
                        timestamp: result.result.timestamp
                    });
                    setLastUpdate(new Date());
                }
            }
        } catch (error) {
            console.error('[TriageHealth] Error:', error);
        } finally {
            setLoading(false);
        }
    }, [app]);

    useEffect(() => {
        fetchHealth();
        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchHealth, 300000);
        return () => clearInterval(interval);
    }, [fetchHealth]);

    const getHealthColor = (score: number) => {
        if (score >= 80) return '#22c55e'; // Green
        if (score >= 60) return '#eab308'; // Yellow
        if (score >= 40) return '#f97316'; // Orange
        return '#ef4444'; // Red
    };

    const getHealthIcon = (score: number) => {
        if (score >= 80) return <CheckCircle className="w-5 h-5" />;
        if (score >= 60) return <Activity className="w-5 h-5" />;
        return <AlertTriangle className="w-5 h-5" />;
    };

    const formatAppLabel = (appName: string) => {
        if (appName === 'nexus') return 'Matrix Hub';
        return appName.replace(/_/g, ' ');
    };

    if (compact) {
        return (
            <motion.div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <Shield className="w-4 h-4 text-cyan-400" />
                {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white/50" />
                ) : health ? (
                    <span
                        className="text-sm font-mono font-bold"
                        style={{ color: getHealthColor(health.healthScore) }}
                    >
                        {health.healthScore}
                    </span>
                ) : (
                    <span className="text-xs text-white/30">--</span>
                )}
            </motion.div>
        );
    }

    return (
        <motion.div
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-black/60 to-black/40 border border-white/10 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm font-semibold text-white">Triage Health</span>
                </div>
                <button type="button"
                    onClick={fetchHealth}
                    className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                    disabled={loading}
                >
                    <RefreshCw className={`w-4 h-4 text-white/50 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Health Score */}
            <AnimatePresence mode="wait">
                {health ? (
                    <motion.div
                        key="health"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Score Circle */}
                        <div className="flex items-center justify-center mb-4">
                            <div className="relative">
                                <svg className="w-24 h-24 transform -rotate-90">
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="40"
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth="8"
                                        fill="none"
                                    />
                                    <motion.circle
                                        cx="48"
                                        cy="48"
                                        r="40"
                                        stroke={getHealthColor(health.healthScore)}
                                        strokeWidth="8"
                                        fill="none"
                                        strokeLinecap="round"
                                        initial={{ strokeDashoffset: 251 }}
                                        animate={{
                                            strokeDashoffset: 251 - (251 * health.healthScore / 100)
                                        }}
                                        strokeDasharray="251"
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span
                                        className="text-2xl font-bold font-mono"
                                        style={{ color: getHealthColor(health.healthScore) }}
                                    >
                                        {health.healthScore}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                                <Eye className="w-4 h-4 text-purple-400" />
                                <div>
                                    <div className="text-white/50">EVOLVE</div>
                                    <div className="font-mono text-white">
                                        {health.evolve?.totalFindings || 0} issues
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                                <Wrench className="w-4 h-4 text-orange-400" />
                                <div>
                                    <div className="text-white/50">PURGE</div>
                                    <div className="font-mono text-white">
                                        {health.purge?.lint?.errors || 0} errors
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* App Badge */}
                        <div className="mt-3 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400">
                                <Zap className="w-3 h-3" />
                                {formatAppLabel(health.app)}
                            </div>
                            {lastUpdate && (
                                <span className="text-white/30">
                                    {lastUpdate.toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-8"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
                                <span className="text-xs text-white/50">Scanning...</span>
                            </>
                        ) : (
                            <>
                                <Shield className="w-8 h-8 text-white/20 mb-2" />
                                <span className="text-xs text-white/30">No health data</span>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default TriageHealth;
