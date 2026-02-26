'use client';

import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function TelemetryOfflineBanner() {
    const { hasSupabase } = useMemo(() => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
        return { hasSupabase: !!url && !!key && !url.includes('placeholder') && key !== 'placeholder' };
    }, []);

    if (hasSupabase) return null;

    return (
        <div
            style={{
                width: '100%',
                background: 'linear-gradient(90deg, rgba(245,158,11,0.18), rgba(15,23,42,0.25))',
                borderBottom: '1px solid rgba(245,158,11,0.3)',
                color: '#fbbf24',
                padding: '0.65rem 1.25rem',
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                position: 'relative',
                zIndex: 40
            }}
        >
            <AlertTriangle size={12} />
            Telemetry Offline — Configure Supabase
        </div>
    );
}
