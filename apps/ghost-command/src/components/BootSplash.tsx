'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export const BootSplash: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Persist boot screen for 3 seconds to show off the "Nano Bana" quality
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    if (!isMounted) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: 'blur(10px)' }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        background: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        pointerEvents: 'all' // Blocks clicks while visible
                    }}
                    onAnimationComplete={() => { /* Animation complete */ }}
                >
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1
                    }}>
                        <Image
                            src="/boot_screen.png"
                            alt="GHOST SYSTEM INITIALIZING"
                            fill
                            style={{
                                objectFit: 'contain',
                                filter: 'brightness(1.1) contrast(1.1)'
                            }}
                            priority
                        />
                    </div>

                    {/* Industrial Text Layer - Ensures visibility even if image is cropped/scaled */}
                    <div style={{
                        position: 'absolute',
                        top: '20%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        textAlign: 'center',
                        zIndex: 10
                    }}>
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 0.8, y: 0 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                color: 'var(--accent)',
                                fontSize: '0.8rem',
                                fontWeight: 950,
                                letterSpacing: '0.6em',
                                textShadow: '0 0 20px var(--accent-glow)',
                                textTransform: 'uppercase'
                            }}
                        >
                            GHOST_RUNNER_IGNITION
                        </motion.h2>
                        <div style={{ fontSize: '0.5rem', opacity: 0.3, letterSpacing: '0.2em', marginTop: '4px' }}>
                            CORE_SERVICES_HANDSHAKE
                        </div>
                    </div>

                    {/* Loading Indication Overlay */}
                    <div style={{
                        position: 'absolute',
                        bottom: '80px', // Raised slightly for better mobile clearance
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        zIndex: 20
                    }}>
                        <div style={{
                            width: '200px',
                            height: '1px', // Thinner, more surgical line
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '1px',
                            overflow: 'hidden'
                        }}>
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                style={{
                                    width: '40%',
                                    height: '100%',
                                    background: 'var(--neural-pulse)',
                                    boxShadow: '0 0 15px var(--neural-pulse)'
                                }}
                            />
                        </div>
                        <span style={{
                            color: 'var(--neural-pulse)',
                            fontSize: '0.55rem',
                            fontWeight: 700,
                            letterSpacing: '0.4em',
                            fontFamily: 'monospace',
                            opacity: 0.6,
                            textTransform: 'uppercase'
                        }}>
                            Neural_Bridge_Sync...
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
