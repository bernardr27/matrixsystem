'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface NeuralSurfaceProps {
    children: React.ReactNode;
    variant?: 'glass' | 'alert' | 'ghost' | 'neumorphic' | 'neon';
    className?: string;
    style?: React.CSSProperties;
    hoverEffect?: boolean;
    onClick?: () => void;
}

// Standardized Neural Surface v2.0 (Reflect Parity)
export const NeuralSurface: React.FC<NeuralSurfaceProps> = ({
    children,
    variant = 'glass',
    className = '',
    style,
    hoverEffect = false,
    onClick
}) => {

    const baseStyles: React.CSSProperties = {
        padding: '2.5rem', // Voluminous padding
        borderRadius: '2rem', // Aesthetic v4 extreme curvature
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.6s var(--ease-fluid)',
        ...style
    };

    const variants: Record<string, React.CSSProperties> = {
        glass: {
            background: 'rgba(11, 14, 20, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        },
        obsidian: {
            background: '#000000',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 0 0 1px #111, 0 20px 50px rgba(0,0,0,0.8)',
        },
        holographic: {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 10px 40px rgba(139, 92, 246, 0.1)',
            backdropFilter: 'blur(20px) hue-rotate(15deg)',
        },
        alert: {
            background: 'rgba(255, 50, 50, 0.05)',
            border: '1px solid rgba(255, 50, 50, 0.2)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.5s ease-out',
        },
        neumorphic: {
            background: 'rgba(255, 255, 255, 0.01)',
            border: 'none',
            boxShadow: 'inset 0 0 20px rgba(255,255,255,0.01), 0 20px 40px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(20px)',
        },
        neon: {
            background: 'rgba(139, 92, 246, 0.05)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.1)',
        },
        ghost: {
            background: 'transparent',
            border: 'none',
        }
    };

    return (
        <div
            style={{
                ...baseStyles,
                ...variants[variant]
            }}
            className={cn('squircle', className)}
            onClick={onClick}

            onMouseEnter={(e) => {
                if (hoverEffect) {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.15)';
                    e.currentTarget.style.background = variant === 'glass' ? 'rgba(255,255,255,0.05)' : variants[variant].background as string;
                }
            }}
            onMouseLeave={(e) => {
                if (hoverEffect) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.border = variants[variant].border as string;
                    e.currentTarget.style.background = variants[variant].background as string;
                }
            }}
        >
            {/* Ambient Inner Glow */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                opacity: 0.5
            }} />

            {children}
        </div>
    );
};
