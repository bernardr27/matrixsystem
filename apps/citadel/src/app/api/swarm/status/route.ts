import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@matrix-lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();

        // Fetch active instances from the registry
        // Heartbeat older than 2 minutes is considered offline
        const cutoff = new Date(Date.now() - 120000).toISOString();

        const { data: instances, error } = await supabase
            .from('matrix_instances')
            .select('id, instance_name, environment, status, last_heartbeat')
            .gt('last_heartbeat', cutoff)
            .order('last_heartbeat', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            count: instances?.length || 0,
            instances: instances || [],
            timestamp: new Date().toISOString()
        });

    } catch (err: any) {
        console.error('[SWARM_STATUS_ERROR]', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
