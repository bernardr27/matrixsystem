'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralSurface } from './NeuralSurface';

interface SpatialOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    color?: string;
}

export const SpatialOverlay: React.FC<SpatialOverlayProps> = ({
    isOpen,
    onClose,
    title,
    children,
    color = '#fff'
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.4)',
                            backdropFilter: 'blur(20px)',
                            zIndex: 2000,
                            cursor: 'pointer'
                        }}
                    />

                    {/* Window Container */}
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        zIndex: 2001,
                        padding: 'clamp(0px, 2vw, 1.5rem)' // Full screen on small mobile
                    }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 30 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                            style={{
                                width: '100%',
                                maxWidth: 'min(1400px, 100vw)',
                                maxHeight: 'min(100vh, 95dvh)',
                                display: 'flex',
                                flexDirection: 'column',
                                pointerEvents: 'auto',
                                position: 'relative'
                            }}
                        >
                            <NeuralSurface
                                variant="glass"
                                style={{
                                    padding: '0',
                                    borderRadius: '24px',
                                    border: `1px solid ${color}20`,
                                    background: 'rgba(5, 5, 5, 0.75)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    flex: 1,
                                    overflow: 'hidden',
                                    boxShadow: `0 0 40px ${color}10, 0 40px 80px rgba(0,0,0,0.8)`
                                }}
                            >
                                {/* Header */}
                                <div style={{
                                    padding: '1rem 1.5rem', // Tighter header
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    background: 'rgba(255,255,255,0.01)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: color,
                                            boxShadow: `0 0 10px ${color}`
                                        }} />
                                        <h3 style={{
                                            color: '#fff',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            letterSpacing: '0.15em',
                                            margin: 0,
                                            opacity: 0.8
                                        }}>{title.toUpperCase()}</h3>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: 'none',
                                            color: '#666',
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1rem',
                                            transition: 'all 0.3s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="overlay-scroll-root" style={{
                                    padding: 'clamp(1rem, 5vw, 2.5rem) clamp(0.5rem, 2vw, 1.5rem) 6rem', // More bottom clearance
                                    overflowY: 'auto',
                                    flex: 1,
                                    position: 'relative'
                                }}>
                                    <style>{`
                                        .overlay-scroll-root::-webkit-scrollbar {
                                            width: 4px;
                                        }
                                        .overlay-scroll-root::-webkit-scrollbar-track {
                                            background: transparent;
                                        }
                                        .overlay-scroll-root::-webkit-scrollbar-thumb {
                                            background: rgba(255, 255, 255, 0.05);
                                            border-radius: 20px;
                                        }
                                        .overlay-scroll-root::-webkit-scrollbar-thumb:hover {
                                            background: rgba(255, 255, 255, 0.1);
                                        }
                                    `}</style>
                                    {children}
                                </div>
                            </NeuralSurface>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
