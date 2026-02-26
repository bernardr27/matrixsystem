'use client';

import dynamic from 'next/dynamic';

const RemoteDesktop = dynamic(
    () => import('@/components/remote/RemoteDesktop'),
    {
        ssr: false,
        loading: () => (
            <div className="flex flex-col bg-[#050510]" style={{ height: 'var(--content-height)' }}>
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
                    <div className="h-8 w-64 bg-white/5 rounded-xl animate-pulse" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white/5 rounded-2xl animate-pulse" />
                </div>
            </div>
        ),
    }
);

export default function RemoteDesktopPage() {
    return <RemoteDesktop />;
}
