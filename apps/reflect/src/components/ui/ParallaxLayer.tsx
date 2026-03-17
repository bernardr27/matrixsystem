'use client';

import React from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

type ParallaxLayerProps = {
    children: React.ReactNode;
    className?: string;
    offset?: number;
};

export function ParallaxLayer({ children, className, offset = 18 }: ParallaxLayerProps) {
    const prefersReducedMotion = useReducedMotion();
    const ref = React.useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });
    const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

    if (prefersReducedMotion) {
        return (
            <div ref={ref} className={cn(className)}>
                {children}
            </div>
        );
    }

    return (
        <motion.div ref={ref} className={cn(className)} style={{ y }}>
            {children}
        </motion.div>
    );
}

