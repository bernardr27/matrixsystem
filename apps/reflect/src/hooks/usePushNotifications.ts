'use client';

import { useState, useEffect, useCallback } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);

            // Check existing subscription
            navigator.serviceWorker.ready.then((registration) => {
                registration.pushManager.getSubscription().then((sub) => {
                    setIsSubscribed(!!sub);
                });
            });
        }
    }, []);

    const subscribe = useCallback(async () => {
        if (!isSupported) return false;

        try {
            const perm = await Notification.requestPermission();
            setPermission(perm);
            if (perm !== 'granted') return false;

            const registration = await navigator.serviceWorker.ready;
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) {
                console.error('[PUSH] No VAPID public key configured.');
                return false;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any
            });

            // Store subscription on the server
            const res = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription.toJSON())
            });

            if (res.ok) {
                setIsSubscribed(true);
                return true;
            }
            return false;
        } catch (err) {
            console.error('[PUSH] Subscription failed:', err);
            return false;
        }
    }, [isSupported]);

    const unsubscribe = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
            }

            await fetch('/api/push/subscribe', { method: 'DELETE' });
            setIsSubscribed(false);
            return true;
        } catch (err) {
            console.error('[PUSH] Unsubscribe failed:', err);
            return false;
        }
    }, []);

    return { isSupported, isSubscribed, permission, subscribe, unsubscribe };
}
