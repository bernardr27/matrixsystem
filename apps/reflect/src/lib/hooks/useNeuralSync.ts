'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useNeuralSync() {
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const supabase = createClient();

        // 1. Initial Check
        const checkActive = async () => {
            const { data } = await supabase
                .from('ghost_bridge')
                .select('id')
                .eq('status', 'executing')
                .limit(1);

            setIsSyncing(data && data.length > 0);
        };

        checkActive();

        // 2. Real-time Subscription
        const channel = supabase.channel('neural_sync_monitor')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'ghost_bridge'
            }, async (payload: any) => {
                // If any command is 'executing', we are syncing
                const { data } = await supabase
                    .from('ghost_bridge')
                    .select('id')
                    .eq('status', 'executing')
                    .limit(1);

                setIsSyncing(data && data.length > 0);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return isSyncing;
}
