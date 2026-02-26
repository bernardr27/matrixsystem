import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@matrix-lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();

        // Fetch verified or highly endorsed insights
        const { data: insights, error } = await supabase
            .from('collective_insights')
            .select(`
                *,
                hive_consensus_votes (
                    vote_type,
                    rationale,
                    node_id
                )
            `)
            .or('verification_status.eq.verified,verification_status.eq.universal,endorsements_count.gt.0')
            .order('endorsements_count', { ascending: false })
            .limit(15);

        if (error) throw error;

        // Fetch mesh stats (Phase 47)
        const { data: instances } = await supabase
            .from('matrix_instances')
            .select('id, last_heartbeat');

        const now = Date.now();
        const onlineNodes = instances?.filter(i => (now - new Date(i.last_heartbeat).getTime()) < 120000).length || 0;

        return NextResponse.json({
            status: 'success',
            insights: insights || [],
            mesh: {
                total_nodes: instances?.length || 0,
                online_nodes: onlineNodes,
                resonance_factor: onlineNodes > 0 ? Math.min(1, onlineNodes / 5) : 0
            }
        });
    } catch (err) {
        console.error('[CONSENSUS_API] Failed to fetch consensus data:', err);
        return NextResponse.json({ status: 'error', insights: [] }, { status: 500 });
    }
}
