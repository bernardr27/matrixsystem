'use client';

import { useDevMode } from '@/lib/hooks/useDevMode';
import { isSafeMode } from '@/lib/safe-mode';

export function DevOverlay() {
    const { enabled } = useDevMode();
    if (!enabled) return null;

    return (
        <div style={{
            display: 'flex',
            gap: '6px',
            paddingLeft: '10px',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
            {isSafeMode() && <span style={{ fontSize: '0.55rem', color: '#facc15', border: '1px solid #facc1555', padding: '1px 6px', borderRadius: '10px' }}>SAFE</span>}
            {process.env.NODE_ENV === 'development' && <span style={{ fontSize: '0.55rem', color: '#f472b6', border: '1px solid #f472b655', padding: '1px 6px', borderRadius: '10px' }}>DEV</span>}
        </div>
    );
}
