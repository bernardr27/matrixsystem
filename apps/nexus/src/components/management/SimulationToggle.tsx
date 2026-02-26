'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils'; // Assuming cn is available

export function SimulationToggle() {
    const [isSimulated, setIsSimulated] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initial fetch of state - relying on implicit state or local default for now
    // Ideally this would sync with the backend agent via a query

    const toggleSimulation = async () => {
        setLoading(true);
        const newState = !isSimulated;

        try {
            // Send command to Agent to toggle its internal state
            const { error } = await supabase.from('matrix_missions').insert({
                title: newState ? 'ACTIVATE_SIMULATION_PROTOCOL' : 'DEACTIVATE_SIMULATION_PROTOCOL',
                description: `Switching Neural Proxy to ${newState ? 'SIMULATION' : 'LIVE'} mode.`,
                priority: 'critical',
                status: 'queued',
                payload: {
                    type: 'sys:simulation',
                    state: newState
                }
            });

            if (error) throw error;
            setIsSimulated(newState);

        } catch (err) {
            console.error('Failed to toggle simulation:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button type="button"
            onClick={toggleSimulation}
            disabled={loading}
            className={cn(
                "relative group flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-500",
                isSimulated
                    ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
            )}
        >
            <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                isSimulated ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-slate-400"
            )}>
                {isSimulated ? <ShieldAlert size={14} /> : <Shield size={14} />}
            </div>

            <div className="flex flex-col items-start text-left">
                <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest transition-colors",
                    isSimulated ? "text-amber-400" : "text-slate-400"
                )}>
                    {isSimulated ? "SIMULATION_ACTIVE" : "LIVE_SYSTEM"}
                </span>
                <span className="text-[7px] font-mono opacity-50 uppercase">
                    {isSimulated ? "Actions Blocked" : "Full Authority"}
                </span>
            </div>

            {isSimulated && (
                <motion.div
                    layoutId="sim-pulse"
                    className="absolute inset-0 rounded-xl border-amber-500/30"
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ opacity: [0, 1, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}
        </button>
    );
}
