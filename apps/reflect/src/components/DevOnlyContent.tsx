'use client';

import { useDevMode } from '@/lib/hooks/useDevMode';

export function DevOnlyContent({ children }: { children: React.ReactNode }) {
    const { enabled } = useDevMode();
    if (!enabled) return null;
    return <>{children}</>;
}
