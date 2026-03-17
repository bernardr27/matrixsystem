'use client';

import React from 'react';
import { cn } from '@matrix-lib/utils';

type LiquidGlassProps = {
    children: React.ReactNode;
    className?: string;
    as?: 'div' | 'button';
    onClick?: () => void;
};

export function LiquidGlass({ children, className, as = 'div', onClick }: LiquidGlassProps) {
    if (as === 'button') {
        return (
            <button type="button" className={cn('ct-liquid-glass', className)} onClick={onClick}>
                {children}
            </button>
        );
    }
    return <div className={cn('ct-liquid-glass', className)}>{children}</div>;
}
