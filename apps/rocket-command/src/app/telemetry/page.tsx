'use client';

import dynamic from 'next/dynamic';

const TelemetryDeck = dynamic(
    () => import('@/components/telemetry/TelemetryDeck'),
    {
        ssr: false,
        loading: () => (
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
                <div className="h-10 w-64 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="h-[280px] bg-white/5 rounded-2xl animate-pulse" />
                    <div className="h-[280px] bg-white/5 rounded-2xl animate-pulse" />
                </div>
            </div>
        ),
    }
);

export default function TelemetryPage() {
    return <TelemetryDeck />;
}
