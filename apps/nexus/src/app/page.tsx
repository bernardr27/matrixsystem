'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { NexusBootScreen } from '@/components/boot/NexusBootScreen';

const NexusDashboardV2 = dynamic(
    () => import('@/components/dashboard/NexusDashboardV2'),
    { ssr: false }
);

export default function Dashboard() {
    const [booted, setBooted] = useState(false);
    const handleBootComplete = useCallback(() => setBooted(true), []);

    return (
        <main className="min-h-screen bg-black">
            {!booted && <NexusBootScreen onComplete={handleBootComplete} />}
            {booted && <NexusDashboardV2 />}
        </main>
    );
}
