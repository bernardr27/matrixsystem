'use client';

import { useState, useEffect } from 'react';

export function NotificationManager() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
            checkSubscription();
        }
    }, []);

    const checkSubscription = async () => {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        }
    };

    const subscribe = async () => {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;

            // Get the VAPID public key
            const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!publicKey) throw new Error('No VAPID public key found');

            // Subscribe to push service
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            // Send subscription to server
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });

            setIsSubscribed(true);
            setPermission('granted');
        } catch (error) {
            console.error('Failed to subscribe:', error);
            alert('Failed to enable notifications. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const unsubscribe = async () => {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                await fetch('/api/push/subscribe', { method: 'DELETE' });
                setIsSubscribed(false);
            }
        } catch (error) {
            console.error('Failed to unsubscribe:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async () => {
        if (isSubscribed) {
            await unsubscribe();
        } else {
            if (permission === 'denied') {
                alert('You have blocked notifications. Please enable them in your browser settings.');
                return;
            }
            await subscribe();
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.5rem 2rem',
                background: 'var(--surface)',
                borderRadius: '20px',
                border: '1px solid var(--border-subtle)',
                transition: 'all 0.3s var(--ease-fluid)',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '1rem', color: 'var(--foreground)', fontWeight: 300 }}>
                    Push Notifications
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--foreground)', opacity: 0.3, fontWeight: 300 }}>
                    {permission === 'denied'
                        ? 'Notifications blocked in browser settings.'
                        : 'Receive daily reminders and insights from Sage.'}
                </span>
            </div>

            <div
                onClick={!isLoading ? handleToggle : undefined}
                style={{
                    width: '48px',
                    height: '26px',
                    borderRadius: '20px',
                    background: isSubscribed ? 'var(--accent)' : 'var(--border-subtle)',
                    padding: '3px',
                    cursor: isLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isSubscribed ? 'flex-end' : 'flex-start',
                    transition: 'all 0.4s var(--ease-fluid)',
                    boxShadow: isSubscribed ? '0 0 15px var(--accent-glow)' : 'none',
                    opacity: isLoading ? 0.5 : 1
                }}
            >
                <div
                    style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#fff',
                        boxShadow: 'var(--shadow-sm)',
                        willChange: 'transform',
                    }}
                />
            </div>
        </div>
    );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
