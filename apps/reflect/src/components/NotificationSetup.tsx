"use client";

import { useState } from 'react';
import { useNotifications } from '@/lib/hooks/useNotifications';

export function NotificationSetup() {
    const { supported, permission, requestPermission, scheduleDaily } = useNotifications();
    const [hour, setHour] = useState(9);
    const [minute, setMinute] = useState(0);
    const [enabled, setEnabled] = useState(false);

    const handleEnable = async () => {
        const granted = await requestPermission();
        if (granted) {
            scheduleDaily(hour, minute, 'Reflect', 'Time for your daily reflection 🌱');
            setEnabled(true);
            localStorage.setItem('reflect_reminder', JSON.stringify({ hour, minute }));
        }
    };

    if (!supported) return null;

    return (
        <div style={{ padding: '12px 16px', border: '1px solid #333', borderRadius: 8, background: '#0d0d0d' }}>
            <div style={{ marginBottom: 8, color: '#ddd', fontWeight: 600 }}>Daily Reminder</div>
            {permission === 'granted' && !enabled && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input type="number" min="0" max="23" value={hour} onChange={(e) => setHour(+e.target.value)} style={{ width: 50, padding: 6, borderRadius: 4, background: '#111', color: '#fff', border: '1px solid #444' }} />
                    <span>:</span>
                    <input type="number" min="0" max="59" value={minute} onChange={(e) => setMinute(+e.target.value)} style={{ width: 50, padding: 6, borderRadius: 4, background: '#111', color: '#fff', border: '1px solid #444' }} />
                    <button onClick={handleEnable} style={{ padding: '6px 12px', borderRadius: 6, background: '#22d3ee', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        Set reminder
                    </button>
                </div>
            )}
            {permission === 'default' && (
                <button onClick={requestPermission} style={{ padding: '6px 12px', borderRadius: 6, background: '#444', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Enable notifications
                </button>
            )}
            {permission === 'denied' && <p style={{ color: '#888', fontSize: '0.9rem' }}>Notifications blocked. Check browser settings.</p>}
            {enabled && <p style={{ color: '#22d3ee', fontSize: '0.9rem' }}>✓ Reminder set for {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}</p>}
        </div>
    );
}
