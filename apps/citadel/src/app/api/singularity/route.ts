import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@matrix-lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();

        // 1. Fetch all online instances
        const { data: instances } = await supabase
            .from('matrix_instances')
            .select('*')
            .eq('status', 'online');

        // 2. Fetch active market tasks for link visualization
        const { data: activeTasks } = await supabase
            .from('hive_market_tasks')
            .select('id, poster_node, worker_node, status, task_type')
            .in('status', ['claimed', 'active']);

        // 3. Get recent consensus events
        const { data: consensus } = await supabase
            .from('collective_insights')
            .select('id, title, verification_status')
            .neq('verification_status', 'unverified')
            .limit(5);

        return NextResponse.json({
            status: 'success',
            hive: {
                instances: instances || [],
                active_links: activeTasks || [],
                verified_patterns: consensus || []
            }
        });
    } catch (err) {
        console.error('[SINGULARITY_API] Failed to fetch hive state:', err);
        return NextResponse.json({ status: 'error', hive: null }, { status: 500 });
    }
}
