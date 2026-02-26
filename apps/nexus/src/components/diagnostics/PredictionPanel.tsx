'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface Prediction {
    id: string;
    message: string;
    recommendation: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: number;
}

export function PredictionPanel() {
    const [predictions, setPredictions] = useState<Prediction[]>([]);

    // Compute confidence from prediction data freshness & severity
    const confidence = useMemo(() => {
        if (predictions.length === 0) return 0;
        const now = Date.now();
        const weights = { low: 0.9, medium: 0.7, high: 0.5 };
        const total = predictions.reduce((acc, p) => {
            const ageMinutes = (now - p.timestamp) / 60000;
            const freshness = Math.max(0, 1 - ageMinutes / 60); // decays over 1h
            return acc + (weights[p.severity] ?? 0.7) * freshness;
        }, 0);
        return Math.min(1, total / predictions.length);
    }, [predictions]);

    useEffect(() => {
        loadPredictions();

        const channel = supabase
            .channel('prediction_panel')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'ghost_bridge', filter: 'source=eq.predictive_cortex' },
                (payload: any) => {
                    if (payload.new.command === 'sys:broadcast' && payload.new.output) {
                        try {
                            const data = JSON.parse(payload.new.output);
                            if (data.type === 'prediction') {
                                setPredictions(prev => [
                                    {
                                        id: data.id,
                                        message: data.message,
                                        recommendation: data.recommendation,
                                        severity: data.severity,
                                        timestamp: data.timestamp
                                    },
                                    ...prev.slice(0, 4)
                                ]);
                            }
                        } catch (e) { }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function loadPredictions() {
        const { data } = await supabase
            .from('ghost_bridge')
            .select('id, output, created_at')
            .eq('source', 'predictive_cortex')
            .eq('command', 'sys:broadcast')
            .order('created_at', { ascending: false })
            .limit(5);

        if (data) {
            const parsed = data.map((item: any) => {
                try {
                    const output = JSON.parse(item.output);
                    return {
                        id: item.id,
                        message: output.message,
                        recommendation: output.recommendation,
                        severity: output.severity || 'medium',
                        timestamp: new Date(item.created_at).getTime()
                    };
                } catch {
                    return null;
                }
            }).filter(Boolean) as Prediction[];

            setPredictions(parsed);
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'border-red-500/30 bg-red-500/10';
            case 'medium': return 'border-amber-500/30 bg-amber-500/10';
            default: return 'border-cyan-500/30 bg-cyan-500/10';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <Sparkles className="text-purple-400" size={20} />
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-white">
                            Predictive Oracle
                        </h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                            Forecasting Engine • Anomaly Detection
                        </p>
                    </div>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30">
                    <p className="text-[9px] font-black uppercase tracking-wider text-purple-400">
                        {(confidence * 100).toFixed(0)}% Confidence
                    </p>
                </div>
            </div>

            {/* Predictions */}
            {predictions.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                    <Sparkles size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm">No predictions yet.</p>
                    <p className="text-[10px] mt-2">Oracle is collecting data...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <AlertTriangle size={12} />
                        Active Forecasts
                    </h5>

                    {predictions.map((prediction, idx) => (
                        <motion.div
                            key={prediction.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`p-4 rounded-xl border ${getSeverityColor(prediction.severity)}`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {prediction.severity === 'high' && (
                                        <AlertTriangle size={14} className="text-red-400" />
                                    )}
                                    <p className="text-xs text-white font-medium">
                                        {prediction.message}
                                    </p>
                                </div>
                                <span className="text-[9px] text-slate-500">
                                    {new Date(prediction.timestamp).toLocaleTimeString()}
                                </span>
                            </div>

                            <div className="flex items-start gap-2 mt-2 p-2 rounded-lg bg-black/20">
                                <Sparkles size={10} className="text-purple-400 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-slate-300 leading-relaxed">
                                    {prediction.recommendation}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Info Footer */}
            <div className="pt-3 border-t border-white/5">
                <p className="text-[9px] text-slate-600 text-center">
                    Predictions update every 10 minutes • Data collection every 2 minutes
                </p>
            </div>
        </div>
    );
}
