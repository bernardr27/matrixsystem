'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSettings } from '@/components/providers/SettingsProvider';

const RocketBootScreen = dynamic(
    () => import('@/components/boot/RocketBootScreen').then(m => ({ default: m.RocketBootScreen })),
    { ssr: false }
);

const LaunchDashboard = dynamic(
    () => import('@/components/dashboard/LaunchDashboard'),
    { ssr: false }
);

export default function HomePage() {
    const { settings } = useSettings();
    const [booted, setBooted] = useState(false);
    const handleBootComplete = useCallback(() => setBooted(true), []);

    // Skip boot screen if disabled in settings
    useEffect(() => {
        if (!settings.showBootScreen) setBooted(true);
    }, [settings.showBootScreen]);

    return (
        <>
            {!booted && settings.showBootScreen && <RocketBootScreen onComplete={handleBootComplete} />}
            <LaunchDashboard />
        </>
    );
}
