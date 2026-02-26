'use client';

import { useState, useEffect } from 'react';

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setTimeout(() => {
                setSupported(true);
                setPermission(Notification.permission);
            }, 0);
        }
    }, []);

    const requestPermission = async () => {
        if (!supported) return false;
        const result = await Notification.requestPermission();
        setPermission(result);
        return result === 'granted';
    };

    const scheduleDaily = (hour: number, minute: number, title: string, body: string) => {
        if (!supported || permission !== 'granted') return;

        const now = new Date();
        const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
        if (target <= now) {
            target.setDate(target.getDate() + 1);
        }
        const delay = target.getTime() - now.getTime();

        setTimeout(() => {
            new Notification(title, { body, icon: '/icon-192.png' });
            // Reschedule for next day
            scheduleDaily(hour, minute, title, body);
        }, delay);
    };

    const sendNotification = (title: string, body: string) => {
        if (!supported || permission !== 'granted') return;
        new Notification(title, { body, icon: '/icon-192.png' });
    };

    return { supported, permission, requestPermission, scheduleDaily, sendNotification };
}
