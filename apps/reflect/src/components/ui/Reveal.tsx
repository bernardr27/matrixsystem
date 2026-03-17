'use client';

import React from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

type RevealProps = {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    y?: number;
    once?: boolean;
};

export function Reveal({
    children,
    className,
    delay = 0,
    y = 20,
    once = true,
}: RevealProps) {
    const ref = React.useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { amount: 0.2, once });
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
        return (
            <div ref={ref} className={cn(className)}>
                {children}
            </div>
        );
    }

    return (
        <motion.div
            ref={ref}
            className={cn(className)}
            initial={{ opacity: 0, y }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
            transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </motion.div>
    );
}

