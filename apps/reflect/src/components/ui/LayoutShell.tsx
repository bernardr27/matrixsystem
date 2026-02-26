import React from 'react';
import { motion } from 'framer-motion';

interface LayoutShellProps {
    children: React.ReactNode;
    variant?: 'default' | 'full'; // default = with standard padding, full = edge-to-edge
    className?: string;
    id?: string;
}

export function LayoutShell({ children, variant = 'default', className = '', id }: LayoutShellProps) {
    return (
        <div
            id={id}
            className={className}
            style={{
                width: '100%',
                minHeight: '100vh',
                paddingTop: variant === 'default' ? 'var(--header-height)' : '0',
                paddingBottom: 'var(--dock-height)',
                paddingLeft: 'env(safe-area-inset-left)',
                paddingRight: 'env(safe-area-inset-right)',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                overflowX: 'hidden',
                position: 'relative'
            }}
        >
            <div style={{
                width: '100%',
                maxWidth: 'var(--content-width)',
                padding: variant === 'default' ? '0 clamp(1rem, 5vw, 3rem)' : '0',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box'
            }}>
                {children}
            </div>
        </div>
    );
}
