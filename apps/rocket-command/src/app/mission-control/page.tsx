'use client';

import dynamic from 'next/dynamic';

const MissionControl = dynamic(
    () => import('@/components/mission/MissionControl'),
    {
        ssr: false,
        loading: () => (
            <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
                <div className="h-10 w-64 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        ),
    }
);

export default function MissionControlPage() {
    return <MissionControl />;
}
