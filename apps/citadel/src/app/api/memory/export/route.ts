import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@matrix-lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Phase 41: Decentralized Memory Export
 * Allows peer nodes to fetch shared synapses.
 */
export async function GET(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { searchParams } = new URL(req.url);
        const since = searchParams.get('since') || new Date(0).toISOString();

        // Fetch shared synapses (e.g. those created by the swarm or with specific flags)
        // For Phase 41, we export all non-private synapses updated since 'since'
        const { data: synapses, error: synapseError } = await supabase
            .from('synapses')
            .select('*')
            .gt('updated_at', since)
            .limit(100);

        if (synapseError) throw synapseError;

        // Fetch session summaries for these synapses to provide context
        const sessionIds = Array.from(new Set([
            ...synapses.map(s => s.source_id),
            ...synapses.map(s => s.target_id)
        ]));

        const { data: sessions, error: sessionError } = await supabase
            .from('sessions')
            .select('id, initial_input, emotion, created_at')
            .in('id', sessionIds);

        if (sessionError) throw sessionError;

        return NextResponse.json({
            node_id: process.env.MATRIX_INSTANCE_NAME || 'primary',
            timestamp: new Date().toISOString(),
            synapses: synapses || [],
            sessions: sessions || []
        });

    } catch (err: any) {
        console.error('[MEMORY_EXPORT_ERROR]', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
