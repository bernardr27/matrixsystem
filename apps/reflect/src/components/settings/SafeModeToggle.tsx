'use client';

import React from 'react';

export function SafeModeToggle() {
    const handleToggle = () => {
        if (confirm("Toggle Simulated Safe Mode?\n\nThis will reload the app.")) {
            const url = new URL(window.location.href);
            if (url.searchParams.get('safe') === '1') {
                url.searchParams.delete('safe');
            } else {
                url.searchParams.set('safe', '1');
            }
            window.location.href = url.toString();
        }
    };

    return (
        <button
            onClick={handleToggle}
            style={{
                cursor: 'pointer',
                background: 'none',
                border: '1px solid #333',
                color: '#facc15',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#facc1555';
                e.currentTarget.style.background = 'rgba(250, 204, 21, 0.05)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.background = 'none';
            }}
        >
            Toggle Safe Mode
        </button>
    );
}
