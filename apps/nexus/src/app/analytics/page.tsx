'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const DeepAnalytics = dynamic(
    () => import('@/components/analytics/DeepAnalytics'),
    {
        ssr: false,
        loading: () => (
            <div className="min-h-screen bg-black p-6 md:p-12">
                <div className="h-12 w-64 bg-white/5 rounded-2xl animate-pulse mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-[300px] bg-white/5 rounded-2xl animate-pulse" />
                    <div className="h-[300px] bg-white/5 rounded-2xl animate-pulse" />
                </div>
            </div>
        )
    }
);

export default function AnalyticsPage() {
    return (
        <main className="min-h-screen bg-black">
            <DeepAnalytics />
        </main>
    );
}
