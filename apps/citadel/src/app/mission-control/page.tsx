'use client';

import React from 'react';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { MissionControl } from '@/components/research/MissionControl';

export default function MissionControlPage() {
    return (
        <AuthProvider>
            <div className="h-screen w-screen p-8 bg-[#06060f]">
                <MissionControl />
            </div>
        </AuthProvider>
    );
}
