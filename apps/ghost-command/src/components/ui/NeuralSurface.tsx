'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface NeuralSurfaceProps {
    children: React.ReactNode;
    variant?: 'glass' | 'alert' | 'ghost';
    className?: string;
    style?: React.CSSProperties;
    hoverEffect?: boolean;
    onClick?: () => void;
    onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const NeuralSurface: React.FC<NeuralSurfaceProps> = ({
    children,
    variant = 'glass',
    className = '',
    style,
    hoverEffect = false,
    onClick,
    onMouseEnter,
    onMouseLeave
}) => {

    const baseStyles: React.CSSProperties = {
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
        willChange: 'backdrop-filter, transform, opacity',
        ...style
    };

    const variants: Record<string, React.CSSProperties> = {
        glass: {
            background: 'rgba(11, 14, 20, 0.7)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            opacity: 1,
        },
        alert: {
            background: 'rgba(255, 50, 50, 0.05)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'rgba(255, 50, 50, 0.2)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.5s ease-out',
        },
        ghost: {
            background: 'transparent',
            border: 'none',
        }
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        if (hoverEffect) {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            // Type assertion to fix type error with partial styles
            const bg = (variant === 'glass' ? '#0A0A0A' : variants[variant].background) as string;
            e.currentTarget.style.background = bg;
        }
        if (onMouseEnter) onMouseEnter(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        if (hoverEffect) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = variants[variant].borderColor as string;
            e.currentTarget.style.background = variants[variant].background as string;
        }
        if (onMouseLeave) onMouseLeave(e);
    };

    return (
        <div
            style={{
                ...variants[variant],
                ...baseStyles
            }}
            className={cn('squircle', className)}
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Ambient Inner Glow */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                opacity: 0.2
            }} />

            {children}
        </div>
    );
};
