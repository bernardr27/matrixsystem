'use client';

import { useState } from 'react';
import { useDevMode } from '@/lib/hooks/useDevMode';

export default function DeveloperToggle() {
    const { enabled, enable, disable } = useDevMode();
    const [taps, setTaps] = useState(0);

    const handleTap = () => {
        if (enabled) return; // Already unlocked

        const newTaps = taps + 1;
        setTaps(newTaps);

        if (newTaps >= 7) {
            if (window.confirm("WARNING: Entering Developer Mode.\n\nThis will reveal advanced debugging tools.\nAre you sure?")) {
                enable();
                alert("SYSTEM UNLOCKED: Developer Mode Active");
            }
            setTaps(0);
        }
    };

    return (
        <div style={{ marginTop: '4rem', textAlign: 'center', opacity: 0.3 }}>
            <p
                onClick={handleTap}
                className="select-none"
                style={{ fontSize: '0.7rem', cursor: 'default', userSelect: 'none' }}
            >
                REFLECT OS v11.9
                {enabled && <span style={{ color: '#22d3ee', marginLeft: '8px', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); disable(); }}>[DEV_ACTIVE] (Tap to Lock)</span>}
            </p>
        </div>
    );
}
