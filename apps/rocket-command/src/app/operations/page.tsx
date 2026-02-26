'use client';

import dynamic from 'next/dynamic';

const OperationsCenter = dynamic(
    () => import('@/components/operations/OperationsCenter'),
    {
        ssr: false,
        loading: () => (
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
                <div className="h-10 w-72 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-[300px] bg-white/5 rounded-2xl animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 h-[400px] bg-white/5 rounded-2xl animate-pulse" />
                    <div className="h-[400px] bg-white/5 rounded-2xl animate-pulse" />
                </div>
            </div>
        ),
    }
);

export default function OperationsPage() {
    return <OperationsCenter />;
}
