'use client';

import { useEffect } from 'react';
import { isSafeMode } from '@/lib/safe-mode';
import { createClient } from '@/lib/supabase/client';

export function SessionGuard() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const checkZombie = async () => {
            // If we are NOT in safe mode, but we see the Test User...
            if (!isSafeMode()) {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.id === 'test-user-123') {
                    console.warn(`Guardian: Detected unauthorized Test User (Safe Mode: ${isSafeMode()}). Purging...`);
                    await supabase.auth.signOut();
                    window.location.reload();
                }
            }
        };
        checkZombie();
    }, []);
    return null;
}
