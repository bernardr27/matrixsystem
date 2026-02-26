'use client';

import React, { useMemo, useState } from 'react';

export default function SupabaseStatusBanner() {
    const [dismissed, setDismissed] = useState(false);
    const { hasSupabase } = useMemo(() => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
        return {
            hasSupabase: !!url && !!key && !url.includes('placeholder') && key !== 'placeholder'
        };
    }, []);

    if (hasSupabase || dismissed) return null;

    return (
        <div
            style={{
                position: 'absolute',
                top: '3.5rem',
                left: 0,
                right: 0,
                zIndex: 40,
                padding: '0.5rem 1.25rem',
                background: 'linear-gradient(90deg, rgba(245,158,11,0.18), rgba(2,6,23,0.35))',
                borderBottom: '1px solid rgba(245,158,11,0.3)',
                color: '#fbbf24',
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: '0.35em',
                textTransform: 'uppercase' as const,
                textAlign: 'center' as const,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
            }}
        >
            <span>Telemetry Offline — Configure Supabase</span>
            <button type="button"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss Supabase banner"
                style={{
                    background: 'rgba(245,158,11,0.2)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    color: '#fbbf24',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em'
                }}
            >
                DISMISS
            </button>
        </div>
    );
}
