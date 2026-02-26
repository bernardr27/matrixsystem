'use client';

import dynamic from 'next/dynamic';

const SettingsPage = dynamic(
    () => import('@/components/settings/SettingsPage'),
    {
        ssr: false,
        loading: () => (
            <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/5 animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-6 w-32 bg-white/5 rounded-lg animate-pulse" />
                        <div className="h-4 w-48 bg-white/5 rounded-lg animate-pulse" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="h-80 bg-white/[0.02] rounded-xl border border-white/[0.04] animate-pulse" />
                    <div className="lg:col-span-3 h-80 bg-white/[0.02] rounded-xl border border-white/[0.04] animate-pulse" />
                </div>
            </div>
        ),
    }
);

export default function SettingsRoute() {
    return <SettingsPage />;
}
