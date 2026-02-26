'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NeuralClockProps {
    className?: string;
    variant?: 'minimal' | 'full';
}

export function NeuralClock({ className, variant = 'full' }: NeuralClockProps) {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!time) return null; // Avoid hydration mismatch

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');

    return (
        <div className={cn("flex items-center gap-3 select-none", className)}>
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Clock size={14} />
            </div>

            <div className="flex items-baseline gap-1 font-mono text-cyan-500">
                <span className="text-lg font-bold tracking-widest">{hours}</span>
                <span className="animate-pulse opacity-50 text-sm">:</span>
                <span className="text-lg font-bold tracking-widest">{minutes}</span>

                {variant === 'full' && (
                    <>
                        <span className="animate-pulse opacity-50 text-sm">:</span>
                        <motion.span
                            key={seconds}
                            initial={{ opacity: 0.5, y: -2 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm opacity-80"
                        >
                            {seconds}
                        </motion.span>
                    </>
                )}
            </div>
        </div>
    );
}
