'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type LiquidGlassProps = {
    children: React.ReactNode;
    className?: string;
    as?: 'div' | 'button';
    onClick?: () => void;
};

export function LiquidGlass({ children, className, as = 'div', onClick }: LiquidGlassProps) {
    if (as === 'button') {
        return (
            <button type="button" onClick={onClick} className={cn('rf-liquid-glass', className)}>
                {children}
            </button>
        );
    }

    return <div className={cn('rf-liquid-glass', className)}>{children}</div>;
}
