'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { isSafeMode } from '@/lib/safe-mode';

export default function SafeModeBanner() {
    const [active, setActive] = useState(false);

    useEffect(() => {
        setActive(isSafeMode());
    }, []);

    if (!active) return null;

    return (
        <div
            style={{
                width: '100%',
                background: 'linear-gradient(90deg, rgba(245,158,11,0.18), rgba(15,23,42,0.2))',
                borderBottom: '1px solid rgba(245,158,11,0.3)',
                color: '#fbbf24',
                padding: '0.65rem 1.25rem',
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                position: 'relative',
                zIndex: 40
            }}
        >
            <AlertTriangle size={12} />
            Safe Mode Active — Showing Simulated Data
        </div>
    );
}
