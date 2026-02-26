'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface RocketSurfaceProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'glass' | 'flame' | 'ghost' | 'neon' | 'panel';
    hover?: boolean;
    glow?: boolean;
    animated?: boolean;
    onClick?: () => void;
}

const variantStyles: Record<string, string> = {
    default: 'bg-white/[0.03] border border-white/[0.06]',
    glass: 'bg-white/[0.02] border border-white/[0.08] backdrop-blur-md',
    flame: 'bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/15',
    ghost: 'bg-transparent border border-white/[0.04]',
    neon: 'bg-white/[0.02] border border-orange-500/20 shadow-[0_0_15px_rgba(255,107,53,0.08),inset_0_1px_0_rgba(255,255,255,0.04)]',
    panel: 'bg-[#080818] border border-white/[0.04]',
};

export function RocketSurface({
    children,
    className,
    variant = 'default',
    hover = false,
    glow = false,
    animated = false,
    onClick,
}: RocketSurfaceProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'rounded-[2rem] p-4 transition-all duration-200 backdrop-blur-3xl',
                variantStyles[variant],
                hover && 'hover:border-orange-500/20 hover:bg-white/[0.04] cursor-pointer holo-card',
                glow && 'shadow-lg shadow-orange-500/5 animate-breathe',
                animated && 'animate-slide-up',
                onClick && 'cursor-pointer',
                className
            )}
        >
            {children}
        </div>
    )
}

interface RocketButtonProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
}

const btnVariants: Record<string, string> = {
    primary: 'bg-gradient-to-r from-[#ff6b35] to-[#ff9f1c] text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40',
    secondary: 'bg-white/[0.06] border border-white/[0.1] text-white/80 hover:bg-white/[0.1]',
    ghost: 'text-white/50 hover:text-white hover:bg-white/[0.05]',
    danger: 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20',
};

const btnSizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
};

export function RocketButton({
    children,
    className,
    variant = 'primary',
    size = 'md',
    icon,
    onClick,
    disabled,
}: RocketButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 whitespace-nowrap',
                btnVariants[variant],
                btnSizes[size],
                disabled && 'opacity-40 cursor-not-allowed',
                className
            )}
        >
            {icon}
            {children}
        </button>
    );
}
