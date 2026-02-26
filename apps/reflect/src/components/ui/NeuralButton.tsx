'use client';

import React, { ButtonHTMLAttributes, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface NeuralButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'neumorphic' | 'neon';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ReactNode | 'reflect' | 'growth' | 'security' | 'analysis';
    href?: string;
    glow?: boolean;
}

const ButtonIcons = {
    reflect: (color: string) => (
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20" />
            <path d="M2 12h20" />
        </svg>
    ),
    growth: (color: string) => (
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 10 4 4-4 4" />
            <path d="m7 14 5-5 5 5" />
        </svg>
    ),
    security: (color: string) => (
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    analysis: (color: string) => (
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    )
};

interface Burst {
    id: number;
    x: number;
    y: number;
}

export const NeuralButton: React.FC<NeuralButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    href,
    glow = false,
    className = '',
    style,
    disabled,
    onClick,
    ...props
}) => {
    const [bursts, setBursts] = useState<Burst[]>([]);

    const handleInternalClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled || isLoading) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newBurst = { id: Date.now(), x, y };
        setBursts(prev => [...prev, newBurst]);

        // Cleanup burst
        setTimeout(() => {
            setBursts(prev => prev.filter(b => b.id !== newBurst.id));
        }, 1000);

        if (onClick) onClick(e);
    }, [disabled, isLoading, onClick]);

    // Base styles
    const baseStyles: React.CSSProperties = {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: '24px', // Standard interactive radius
        fontWeight: 600,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        backdropFilter: 'blur(10px)',
        border: '1px solid transparent',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.6 : 1,
        textDecoration: 'none',
        ...style
    };

    // Variant styles
    const variants: Record<string, React.CSSProperties> = {
        primary: {
            background: 'var(--foreground)',
            color: 'var(--background)',
            border: '1px solid var(--foreground)',
            boxShadow: glow ? '0 0 20px var(--accent-glow)' : '0 4px 12px rgba(0,0,0,0.1)',
        },
        secondary: {
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        danger: {
            background: 'rgba(255, 50, 50, 0.1)',
            color: '#ff4444',
            border: '1px solid rgba(255, 50, 50, 0.3)',
        },
        neumorphic: {
            background: 'rgba(255, 255, 255, 0.02)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: 'inset 0 0 10px rgba(255,255,255,0.02), 4px 4px 12px rgba(0,0,0,0.4)',
        },
        neon: {
            background: 'rgba(34, 211, 238, 0.1)',
            color: '#22d3ee',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.15)',
        },
        ghost: {
            background: 'transparent',
            color: '#888',
            border: 'none',
        }
    };

    const getAutoFitFontSize = () => {
        const baseSizes = { sm: 0.8, md: 0.9, lg: 1.1 };
        const base = baseSizes[size] || 0.9;

        if (typeof children === 'string') {
            const length = children.length;
            let threshold = size === 'sm' ? 8 : (size === 'lg' ? 14 : 12);
            if (icon) threshold -= 4;

            if (length > threshold) {
                const scale = Math.max(0.65, 1 - (length - threshold) * 0.025);
                return `${base * scale}rem`;
            }
        }
        return `${base}rem`;
    };

    const getDynamicGap = () => {
        if (typeof children === 'string' && icon) {
            const threshold = size === 'sm' ? 8 : 12;
            if (children.length > threshold) return '4px';
        }
        return '8px';
    };

    const getIcon = () => {
        if (!icon) return null;
        if (typeof icon === 'string' && icon in ButtonIcons) {
            const color = variants[variant].color as string;
            return ButtonIcons[icon as keyof typeof ButtonIcons](color);
        }
        return icon;
    };

    const sizes: Record<string, React.CSSProperties> = {
        sm: { minHeight: '44px', padding: '0.4rem 1.2rem', fontSize: getAutoFitFontSize() },
        md: { minHeight: '52px', padding: '0.7rem 1.8rem', fontSize: getAutoFitFontSize() },
        lg: { minHeight: '60px', padding: '1rem 2.5rem', fontSize: getAutoFitFontSize() }
    };

    const combinedStyles = {
        ...baseStyles,
        ...variants[variant],
        ...sizes[size],
    };

    const { onAnimationStart, onDragStart, onDragEnd, onDrag, ...remainingProps } = props as any;

    if (href) {
        return (
            <Link href={href} style={{ textDecoration: 'none', display: 'inline-flex' }}>
                <motion.button
                    style={combinedStyles}
                    disabled={disabled || isLoading}
                    onClick={handleInternalClick}
                    className={`neural-btn ${variant} ${className}`}
                    whileHover={!disabled && !isLoading ? { y: -2, scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' } : {}}
                    whileTap={!disabled && !isLoading ? { scale: 0.96, y: 0 } : {}}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    {...remainingProps}
                >
                    <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: getDynamicGap(), width: '100%', height: '100%' }}>
                        {icon && <span style={{ fontSize: '1.2em' }}>{getIcon()}</span>}
                        <span>{children}</span>
                    </span>
                </motion.button>
            </Link>
        );
    }

    return (
        <motion.button
            style={combinedStyles}
            disabled={disabled || isLoading}
            onClick={handleInternalClick}
            className={`neural-btn ${variant} ${className}`}
            whileHover={!disabled && !isLoading ? {
                y: -2,
                scale: 1.02,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
            } : {}}
            whileTap={!disabled && !isLoading ? {
                scale: 0.96,
                y: 0
            } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            {...remainingProps}
        >
            {/* Shimmer Effect */}
            {variant === 'primary' && !isLoading && !disabled && (
                <motion.div
                    initial={{ x: '-150%', skewX: -20 }}
                    whileHover={{ x: '200%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '50%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                        pointerEvents: 'none',
                        zIndex: 1
                    }}
                />
            )}

            {/* Synaptic Bursts */}
            <AnimatePresence>
                {bursts.map(burst => (
                    <motion.span
                        key={burst.id}
                        initial={{ scale: 0, opacity: 0.5 }}
                        animate={{ scale: 4, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{
                            position: 'absolute',
                            left: burst.x,
                            top: burst.y,
                            width: '20px',
                            height: '20px',
                            marginLeft: '-10px',
                            marginTop: '-10px',
                            borderRadius: '50%',
                            background: variant === 'primary' ? 'rgba(255,255,255,0.4)' : 'var(--accent)',
                            pointerEvents: 'none',
                            zIndex: 0
                        }}
                    />
                ))}
            </AnimatePresence>

            <span style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: getDynamicGap(),
                width: '100%',
                height: '100%'
            }}>
                {isLoading ? (
                    <>
                        <motion.span
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ duration: 1, repeat: Infinity }}
                            style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: 'currentColor'
                            }}
                        />
                        <span style={{ opacity: 0.8, marginLeft: '4px' }}>RESONATING...</span>
                    </>
                ) : (
                    <>
                        {icon && <span style={{ fontSize: '1.2em' }}>{getIcon()}</span>}
                        <span>{children}</span>
                    </>
                )}
            </span>
        </motion.button>
    );
};

