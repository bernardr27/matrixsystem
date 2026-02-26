'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSensory } from '@/hooks/useSensory';

interface NeuralButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'anomaly';
    isLoading?: boolean;
    glow?: boolean;
}

export const NeuralButton: React.FC<NeuralButtonProps> = ({
    children,
    variant = 'primary',
    isLoading = false,
    glow = true,
    onClick,
    className = '',
    style,
    disabled,
    ...props
}) => {
    const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
    const sensory = useSensory();

    const handleInternalClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled || isLoading) return;

        sensory.click(); // Invoke sensory click

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const id = Date.now();
        setBursts(prev => [...prev, { id, x, y }]);
        setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 1000);

        if (onClick) onClick(e);
    }, [disabled, isLoading, onClick, sensory]);

    const baseStyles: React.CSSProperties = {
        position: 'relative',
        padding: '1.2rem 2rem',
        borderRadius: '18px',
        fontWeight: 700,
        fontSize: '1rem',
        letterSpacing: '0.05em',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        border: '1px solid var(--glass-border)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        transition: 'background 0.3s, border 0.3s',
        ...style
    };

    const variants = {
        primary: {
            background: 'var(--glass-bg)',
            color: '#fff',
            boxShadow: glow ? '0 0 20px rgba(0, 255, 255, 0.15)' : 'none'
        },
        secondary: {
            background: 'transparent',
            color: 'rgba(255,255,255,0.6)',
        },
        anomaly: {
            background: 'rgba(255, 107, 107, 0.1)',
            color: 'var(--anomaly)',
            borderColor: 'rgba(255, 107, 107, 0.3)'
        }
    };

    const { onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, ...remainingProps } = props as any;

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleInternalClick}
            disabled={disabled || isLoading}
            style={{ ...baseStyles, ...variants[variant] }}
            className={`neural-btn ${className}`}
            {...remainingProps}
        >
            <AnimatePresence>
                {bursts.map(burst => (
                    <motion.span
                        key={burst.id}
                        initial={{ scale: 0, opacity: 0.6, x: burst.x, y: burst.y }}
                        animate={{ scale: 2, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.4)',
                            pointerEvents: 'none',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 0
                        }}
                    />
                ))}
            </AnimatePresence>

            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isLoading ? (
                    <>
                        <motion.span
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}
                        />
                        <span>RESONATING...</span>
                    </>
                ) : children}
            </span>
        </motion.button>
    );
};
