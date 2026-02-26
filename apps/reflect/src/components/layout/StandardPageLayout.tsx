'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * STANDARD PAGE LAYOUT (Mobile & Desktop)
 * 
 * Use this wrapper for ALL new internal application pages.
 * It enforces safe areas, consistent padding, and header/dock spacing.
 */

type StandardPageLayoutProps = {
    children: React.ReactNode;
    title?: string;
    variant?: 'default' | 'focus';
    backHref?: string;
};

export default function StandardPageLayout({
    children,
    title,
    variant = 'default',
}: StandardPageLayoutProps) {
    return (
        <motion.div
            style={{
                width: '100%',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                background: 'var(--background)',
                color: 'var(--foreground)',
                // Safe Area Enforcements (Critical for Mobile)
                paddingTop: 'calc(var(--header-height) + var(--safe-area-top) + 3rem)',
                paddingBottom: 'calc(var(--dock-height) + 4rem)',
                paddingLeft: 'max(1rem, env(safe-area-inset-left))',
                paddingRight: 'max(1rem, env(safe-area-inset-right))',
                boxSizing: 'border-box',
                overflowX: 'hidden'
            }}
        >
            {title && (
                <div style={{
                    marginBottom: '1rem',
                    textAlign: 'left', // Aligned with the new aesthetic
                    animation: 'slideDownFadeIn 0.6s var(--ease-fluid)',
                    borderLeft: '2px solid var(--accent)',
                    paddingLeft: '1.5rem'
                }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.45em', display: 'block', marginBottom: '0.5rem' }}>SYSTEM_NODE</span>
                    <h1 style={{
                        fontSize: 'clamp(1.8rem, 6vw, 2.5rem)',
                        fontWeight: 100,
                        letterSpacing: '-0.02em',
                        wordWrap: 'break-word',
                        maxWidth: '100%',
                        color: 'var(--foreground)',
                        margin: 0
                    }}>
                        {title}
                    </h1>
                </div>
            )}

            <div style={{
                width: '100%',
                maxWidth: 'var(--content-width)',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                flex: 1
            }}>
                {children}
            </div>
        </motion.div>
    );
}
